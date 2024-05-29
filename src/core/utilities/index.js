const fs = require('fs');
const path = require('path');
const util = require('util');
const os = require('os');
const logcon = require('logcon');
const suchdb = require('@sectly-studios/suchdb');

const directoryPath = __dirname;
const files = fs.readdirSync(directoryPath).filter((file) => file !== 'index.js');

const modules = files.map((file) => {
    const filePath = path.join(directoryPath, file);
    const module = require(filePath);

    return { [file]: module };
});

function addCustomModule(name, module) {
    modules.push({ [name]: module });
}

let sessionId = null;
let logFile = null;

function ensureLogDir() {
    const logDir = path.join(os.homedir(), 'ZapBrowser', 'logs');

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    return logDir;
}

function startSession() {
    if (!sessionId) {
        sessionId = `${new Date().toISOString().replace(/:/g, '-').replace(/\..*/, '')}`;
        logFile = path.join(ensureLogDir(), `${sessionId}.log`);

        fs.writeFileSync(logFile, `Log file for ZapBrowser session ${sessionId}\n\n+${"=-".repeat(8)}=+\n\n`);
    }

    return sessionId;
}

function formatLog(type, message) {
    const timestamp = new Date().toISOString();
    const timeDiff = lastLogTime > 0 ? ` (+${Math.floor((new Date() - lastLogTime) / 1000)}s)` : '';

    lastLogTime = new Date();

    const formattedMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;

    return `[${timestamp}] [${type}] ${formattedMessage}${timeDiff}\n`;
}

function addToLog(type, message) {
    if (!sessionId) {
        startSession();
    }

    const logEntry = formatLog(type, message);

    fs.appendFileSync(logFile, logEntry);
}

const wrappedLogcon = {};

Object.keys(logcon).forEach((key) => {
    if (typeof logcon[key] === 'function') {
        wrappedLogcon[key] = function (...args) {
            addToLog(key, args);

            return logcon[key](...args);
        };
    } else {
        wrappedLogcon[key] = logcon[key];
    }
});

const wrappedSuchDB = function (name, key) {
    return new suchdb.SuchDB({
        master: `${modules.fs.getAppPath()}/${name}`,
        autosave: true,
        autoload: true,
        encrypt: {
            enabled: true,
            key: `${key}`,
        },
        autobackup: true,
    });
}

addCustomModule("util", util);
addCustomModule("logcon", wrappedLogcon);
addCustomModule("suchdb", wrappedSuchDB);

module.exports = { ...Object.assign({}, ...modules ), addCustomModule };