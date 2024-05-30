const { BrowserWindow, app } = require('electron');
const path = require('path');

class ProgressBar {
  constructor(title, message, status, progress, icon) {
    this.title = title || 'Update Progress';
    this.message = message || '';
    this.status = status || '';
    this.progress = progress || 0;
    this.icon = icon || '';
    this.window = null;
  }

  show() {
    this.window = new BrowserWindow({
      width: 600,
      height: 400,
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Electron Download</title>
        <style>
          body {
            background-color: #181818;
            color: #fff;
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }

          .container {
            background-color: #282828;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .download-icon {
            font-size: 32px;
            margin-bottom: 10px;
          }

          .progress-bar {
            width: 80%;
            height: 8px;
            background-color: #333;
            border-radius: 5px;
            margin-bottom: 10px;
            overflow: hidden;
          }

          .progress-bar-fill {
            height: 100%;
            background-color: #4285f4;
            width: 0%;
            transition: width 0.3s ease;
          }

          .progress-text {
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="download-icon" id="logo" src="${this.icon}" alt="Logo">
          <p id="title">${this.title}</p>
          <p id="message">${this.message}</p>
          <div class="progress-bar">
            <div class="progress-bar-fill" id="progress"></div>
          </div>
          <div class="progress-text" id="status">${this.progress}% - ${this.status}</div>
        </div>
        <script>
          const { ipcRenderer } = require('electron');

          ipcRenderer.on('update-progress', (event, data) => {
            const progressBarFill = document.querySelector('.progress-bar-fill');
            const progressText = document.getElementById('status');

            progressBarFill.style.width = data.progress + '%';
            progressText.textContent = data.progress + '% - ' + data.status;
          });
        </script>
      </body>
      </html>
    `;

    this.window.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(htmlContent));

    this.window.once('ready-to-show', () => {
      this.window.show();
    });
  }

  hide() {
    if (this.window) {
      this.window.hide();
    }
  }

  close() {
    if (this.window) {
      this.window.close();
    }
  }

  setProgress(progress) {
    this.progress = progress;
    if (this.progress === 0) {
      app.setProgressBar(-1); // Remove progress bar
    } else {
      app.setProgressBar(this.progress / 100); // Set progress bar value between 0 and 1
    }
    this.updateUI();
  }

  setTitle(title) {
    this.title = title;
    this.updateUI();
  }

  setMessage(message) {
    this.message = message;
    this.updateUI();
  }

  setStatus(status) {
    this.status = status;
    this.updateUI();
  }

  setIcon(icon) {
    this.icon = icon;
    this.updateUI();
  }

  updateUI() {
    if (this.window) {
      this.window.webContents.send('update-progress', {
        title: this.title,
        message: this.message,
        status: this.status,
        progress: this.progress
      });
      if (this.icon) {
        this.window.webContents.send('update-icon', {
          icon: this.icon
        });
      }
    }
  }
}

module.exports = ProgressBar;