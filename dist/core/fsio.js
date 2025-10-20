"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeText = writeText;
exports.writeBytes = writeBytes;
exports.readText = readText;
const fs_1 = require("fs");
function writeText(path, content) {
    (0, fs_1.writeFileSync)(path, content, 'utf-8');
}
function writeBytes(path, bytes) {
    (0, fs_1.writeFileSync)(path, bytes);
}
function readText(path) {
    return (0, fs_1.readFileSync)(path, 'utf-8');
}
