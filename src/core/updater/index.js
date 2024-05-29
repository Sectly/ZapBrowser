const { fork } = require('child_process');
const path = require('path');

const updaterPath = path.join(__dirname, 'GitUpdater.js');
const child = fork(updaterPath);

child.on('message', (msg) => {
  if (msg === 'ready') {
    child.send('update');
  }
});
