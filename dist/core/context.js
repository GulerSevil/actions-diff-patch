"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContext = loadContext;
const fs_1 = require("fs");
function loadContext(path) {
    try {
        const raw = (0, fs_1.readFileSync)(path, 'utf-8');
        const obj = JSON.parse(raw);
        return JSON.stringify(obj);
    }
    catch {
        return '{}';
    }
}
