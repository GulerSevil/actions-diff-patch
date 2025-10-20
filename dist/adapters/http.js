"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPrDiff = fetchPrDiff;
const https_1 = require("https");
async function fetchPrDiff(token, prNumber, serverUrl, owner, repo) {
    return new Promise((resolve, reject) => {
        const url = `${serverUrl}/${owner}/${repo}/pull/${prNumber}.diff`;
        const req = (0, https_1.request)(url, { headers: { Authorization: `Bearer ${token}` }, method: 'GET' }, (res) => {
            if ((res.statusCode || 0) >= 400) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            let data = '';
            res.setEncoding('utf-8');
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.end();
    });
}
