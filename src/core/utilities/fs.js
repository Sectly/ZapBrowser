const fs = require('fs');
const path = require('path');

const fsWrapper = {
  ensurePath: async (path) => {
    if (!fs.existsSync(path)) {
      await fs.promises.mkdir(path, { recursive: true });
    }
  },

  bulkCreateFiles: async (files) => {
    for (const file of files) {
      await fs.promises.writeFile(file, '');
    }
  },

  bulkDeleteFiles: async (files) => {
    for (const file of files) {
      await fs.promises.unlink(file);
    }
  },

  bulkModifyFiles: async (files, modifyFunc) => {
    for (const file of files) {
      const contents = await fs.promises.readFile(file, 'utf8');
      const modifiedContents = modifyFunc(contents);
      await fs.promises.writeFile(file, modifiedContents);
    }
  },

  getTempPath: async () => {
    return process.platform === 'win32' ? path.join(app.getPath('temp'), 'zapbrowser') : path.join(app.getPath('temp'), '.zapbrowser');
  },

  getLogsPath: async () => {
    return process.platform === 'win32' ? path.join(app.getPath('logs'), 'zapbrowser') : path.join(app.getPath('logs'), '.zapbrowser');
  },

  getAppPath: async () => {
    return path.join(app.getPath('appData'), 'zapbrowser')
  },

  validatePath: async (path) => {
    if (!path) {
      throw new Error('Path is required');
    }

    if (!path.startsWith('/')) {
      throw new Error('Path must be absolute');
    }
  },
};

module.exports = fsWrapper;