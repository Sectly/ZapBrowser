const { Worker, isMainThread, parentPort } = require('worker_threads');

class Updater {
  constructor(repoURL, currentVersion, targetDirectory, branch = 'main') {
    this.repoURL = repoURL;
    this.currentVersion = currentVersion;
    this.targetDirectory = targetDirectory;
    this.branch = branch;
  }

  async runWorker(operation) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename);

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });

      worker.postMessage({ operation, repoURL: this.repoURL, currentVersion: this.currentVersion, targetDirectory: this.targetDirectory, branch: this.branch });
    });
  }

  async getUpdateLog() {
    return this.runWorker('getUpdateLog');
  }

  async needsUpdate() {
    return this.runWorker('needsUpdate');
  }

  async applyUpdate() {
    return this.runWorker('applyUpdate');
  }

  async verifyIntegrity() {
    return this.runWorker('verifyIntegrity');
  }
}

if (!isMainThread) {
  const GitUpdater = require('./GitUpdater');
  parentPort.on('message', async (message) => {
    const { operation, repoURL, currentVersion, targetDirectory, branch } = message;
    const updater = new GitUpdater(repoURL, currentVersion, targetDirectory, branch);

    switch (operation) {
      case 'getUpdateLog':
        parentPort.postMessage(await updater.getUpdateLog());
        break;
      case 'needsUpdate':
        parentPort.postMessage(await updater.needsUpdate());
        break;
      case 'applyUpdate':
        parentPort.postMessage(await updater.applyUpdate());
        break;
      case 'verifyIntegrity':
        parentPort.postMessage(await updater.verifyIntegrity());
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  });
}

module.exports = Updater;
