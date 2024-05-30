const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const util = require('util');
const crypto = require('crypto');

class GitUpdater {
  constructor(repoURL, currentVersion, targetDirectory, branch = 'main') {
    this.repoURL = repoURL;
    this.currentVersion = currentVersion;
    this.targetDirectory = targetDirectory;
    this.branch = branch;
    this.git = simpleGit(targetDirectory);
  }

  async getUpdateLog() {
    try {
      const log = await this.git.log({
        from: this.currentVersion,
        to: 'HEAD'
      });

      return log.all.map(commit => {
        const author = commit.author_name;
        const hash = commit.hash;
        const shortHash = commit.hash.substring(0, 7);
        let summary = commit.body.trim();
        if (!summary || summary.length < 4) {
          summary = 'Patch';
        }
        const originalMessage = commit.message.trim();
        const modifiedFilesMessage = this.formatMessage(commit.message);
        const message = `${originalMessage}\n\n${modifiedFilesMessage}`;

        return {
          Author: author,
          Hash: hash,
          ShortHash: shortHash,
          Summary: summary,
          Message: message
        };
      });
    } catch (error) {
      console.error('Failed to get update log:', error);
      return [];
    }
  }

  formatMessage(message) {
    const modifiedFilesRegex = /- (.*) \(\+(\d+) \| -(\d+)\)/g;
    const modifiedFiles = [];
    let match;
    while ((match = modifiedFilesRegex.exec(message)) !== null) {
      modifiedFiles.push(`- ${match[1]} (+${match[2]} | -${match[3]})`);
    }
    return modifiedFiles.length > 0 ? `Modified Files:\n${modifiedFiles.join('\n')}` : '';
  }

  async needsUpdate() {
    try {
      const remoteTags = await this.git.listRemote(['--tags', this.repoURL]);
      const latestTag = this.extractLatestTag(remoteTags);
      return latestTag !== this.currentVersion;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }

  extractLatestTag(tagsString) {
    const tags = tagsString.split('\n').map(tag => tag.match(/refs\/tags\/(.*)/)).filter(Boolean).map(match => match[1]);
    return tags.length ? tags.sort().pop() : null;
  }

  async applyUpdate() {
    try {
      await this.git.pull(this.repoURL, this.branch);
      console.log('Update applied successfully.');
      await this.clearUnneededFiles();
      await this.updateIntegrityFile();
      this.clearModuleCache();
      console.log('Cleaned up successfully.');
    } catch (error) {
      console.error('Failed to apply update:', error);
      throw new Error('Update failed');
    }
  }

  async updateIntegrityFile() {
    try {
      const integrityData = {};
      const files = await this.git.listFiles();

      for (const file of files) {
        const filePath = path.relative(this.targetDirectory, file);
        const hash = await this.calculateFileHash(file);
        integrityData[filePath] = hash;
      }

      const integrityFilePath = path.join(this.targetDirectory, 'integrity.json');
      fs.writeFileSync(integrityFilePath, JSON.stringify(integrityData, null, 2));

      console.log('Integrity file updated successfully.');
    } catch (error) {
      console.error('Failed to update integrity file:', error);
      throw new Error('Failed to update integrity file');
    }
  }

  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async clearUnneededFiles() {
    try {
      console.log('Deleting unneeded files...');
      const status = await this.git.status();
      const deletedFiles = status.deleted;

      await Promise.all(
        deletedFiles.map(file => this.deleteFile(file))
      );

      console.log('Unneeded files deleted successfully.');
    } catch (error) {
      console.error('Failed to clear unneeded files:', error);
      throw new Error('Failed to clear unneeded files');
    }
  }

  async deleteFile(fileName) {
    const filePath = path.join(this.targetDirectory, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`Deleting file: ${fileName}`);
      await util.promisify(fs.unlink)(filePath);
    }
  }

  async verifyIntegrity() {
    try {
      const integrityFilePath = path.join(this.targetDirectory, 'integrity.json');
      if (!fs.existsSync(integrityFilePath)) {
        console.error('Integrity file does not exist.');
        return false;
      }
      const integrityData = JSON.parse(fs.readFileSync(integrityFilePath, 'utf-8'));
      for (const [filePath, expectedHash] of Object.entries(integrityData)) {
        const absolutePath = path.join(this.targetDirectory, filePath);
        if (!fs.existsSync(absolutePath) || !(await this.verifyFileHash(absolutePath, expectedHash))) {
          console.error(`File integrity check failed for ${filePath}`);
          await this.restoreFile(filePath);
        }
      }
      console.log('All files are intact.');
      return true;
    } catch (error) {
      console.error('Failed to verify integrity:', error);
      return false;
    }
  }

  async verifyFileHash(filePath, expectedHash) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex') === expectedHash));
      stream.on('error', reject);
    });
  }

  async restoreFile(filePath) {
    try {
      await this.git.checkout(['--', filePath]);
      console.log(`Restored file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to restore file ${filePath}:`, error);
    }
  }

  clearModuleCache() {
    const modulePath = require.resolve('./GitUpdater.js');
    delete require.cache[modulePath];
  }
}

module.exports = GitUpdater;