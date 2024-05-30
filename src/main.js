const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
let package = require("./../package.json");

let errorMessages = [
    "The browser cannot function without coffee. Please provide caffeine and try again.",
    "We detected a cat on your keyboard. Remove the feline and restart.",
    "Your browser took a wrong turn and got lost. Send a search party and try again.",
    "The hamster powering your browser has gone on strike. Please negotiate and retry.",
    "Your browser is feeling sleepy. Let it take a nap and try again later.",
    "The browser tried to start, but fun was not found. Please inject some fun and retry.",
    "Your browser stumbled upon your search history and needs a moment to recover.",
    "The penguin managing your browser went on strike. Offer fish and try again.",
    "Your browser is entangled in quantum states. Resolve the paradox and retry.",
    "Gremlins have invaded your browser's code. Exterminate and restart.",
    "Your browser disrupted the space-time continuum. Fix the rift and try again.",
    "Your browser encountered a joke it couldn't handle. Give it time to recover and retry.",
    "Aliens have taken over your browser. Negotiate with the extraterrestrials and restart.",
    "The Y2K bug finally caught up with us. Travel back to 1999 and try again.",
]

process["on"]("multipleResolves", (type, reason, promise) => {
    console.log(
        `multipleResolves Error: ${type} | Reason: ${JSON.stringify(
            reason
        )} | Promise: ${promise}`
    );
});

process["on"]("unhandRejection", (reason, promise) => {
    console.log(
        `unhandRejection Error: ${JSON.stringify(reason)} | Promise: ${promise}`
    );
});

process["on"]("uncaughtException", (error, origin) => {
    console.log(
        `uncaughtException Error: ${error}, ${error.stack} | Orgin: ${origin}`
    );
});

process["on"]("uncaughtExceptionMonitor", (error, origin) => {
    console.log(
        `uncaughtExceptionMonitor Error: ${error}, ${error.stack} | Orgin: ${origin}`
    );
});

try {
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    const core = require('./core/index');

    core(core, package, errorMessages);
} catch (error) {
    dialog.showErrorBox("Fatal Error: Zap Browser", `Whoops, ${errorMessages[Math.floor(Math.random() * errorMessages.length)]}\n\nError:\n${error.stack ? error.stack : error}\n\nEvent: Initialize.`);

    console.log(`[Zap Browser] [Initialize: main.js] Fatal Error: ${error.stack ? error.stack : error}.`);
}