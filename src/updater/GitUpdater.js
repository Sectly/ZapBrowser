const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
const { fork } = require('child_process');

class GitUpdater {
  constructor(repo, currentVersion) {
    this.repo = repo;
    this.currentVersion = currentVersion;
    this.git = simpleGit();
    this.cloneDir = path.join(__dirname, 'repoClone');
  }

  async needsUpdates() {
    await this._cloneOrUpdateRepo();
    const tags = await this.git.tags();
    const latestTag = tags.latest;

    if (this._isNewerVersion(latestTag, this.currentVersion)) {
      const commits = await this.git.log({ from: this.currentVersion, to: latestTag });
      return { needsUpdate: true, log: commits.all };
    }
    return { needsUpdate: false, log: [] };
  }

  async applyUpdates(callback) {
    await this._cloneOrUpdateRepo();
    const tags = await this.git.tags();
    const latestTag = tags.latest;

    const commits = await this.git.log({ from: this.currentVersion, to: latestTag });
    for (const commit of commits.all) {
      const diff = await this.git.diffSummary([`${commit.hash}^`, commit.hash]);
      await this._applyDiff(diff, callback);
    }

    // Update current version
    this.currentVersion = latestTag;
  }

  async getUpdates() {
    await this._cloneOrUpdateRepo();
    const tags = await this.git.tags();
    const latestTag = tags.latest;

    const commits = await this.git.log({ from: this.currentVersion, to: latestTag });
    return commits.all.map(commit => ({
      hash: commit.hash,
      shorthash: commit.hash.slice(0, 7),
      author: commit.author_name,
      summary: commit.message,
      description: commit.body,
    }));
  }

  async verifyIntegrity(callback) {
    await this._cloneOrUpdateRepo();
    const status = await this.git.status();
    const failedFiles = status.files.filter(file => file.working_dir !== ' ');

    if (callback) {
      callback(failedFiles);
    }

    return failedFiles.length === 0;
  }

  async _cloneOrUpdateRepo() {
    if (fs.existsSync(this.cloneDir)) {
      await this.git.cwd(this.cloneDir).pull();
    } else {
      await this.git.clone(this.repo, this.cloneDir);
      await this.git.cwd(this.cloneDir);
    }
  }

  _isNewerVersion(latestTag, currentVersion) {
    const latestParts = latestTag.split('.').map(Number);
    const currentParts = currentVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    return false;
  }

  async _applyDiff(diff, callback) {
    for (const file of diff.files) {
      const filePath = path.join(__dirname, file.file);
      if (file.type === 'delete') {
        await fs.remove(filePath);
      } else {
        await this.git.raw(['show', `HEAD:${file.file}`], (err, result) => {
          if (!err) {
            fs.outputFileSync(filePath, result);
          }
        });
      }

      if (callback) {
        callback(file);
      }
    }
  }
}

const updater = new GitUpdater('https://github.com/your-repo.git', '1.0.0');
if (require.main === module) {
  process.on('message', async (msg) => {
    if (msg === 'update') {
      const needsUpdate = await updater.needsUpdates();
      if (needsUpdate.needsUpdate) {
        await updater.applyUpdates((file) => {
          console.log(`Updated file: ${file.file}`);
        });
      }
      process.exit();
    }
  });

  // Signal parent process that updater is ready
  if (process.send) {
    process.send('ready');
  } else {
    (async () => {
      const needsUpdate = await updater.needsUpdates();
      if (needsUpdate.needsUpdate) {
        await updater.applyUpdates((file) => {
          console.log(`Updated file: ${file.file}`);
        });
      }
    })();
  }
}

module.exports = GitUpdater;
