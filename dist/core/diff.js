"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractChangedFilesFromDiff = extractChangedFilesFromDiff;
exports.prioritizeAndCapFiles = prioritizeAndCapFiles;
exports.prioritizeFiles = prioritizeFiles;
exports.filterDiffByFiles = filterDiffByFiles;
function extractChangedFilesFromDiff(diff) {
    const files = new Set();
    for (const line of diff.split('\n')) {
        const m = /^\+\+\+ b\/(.+)$/.exec(line);
        if (m && m[1] && m[1] !== '/dev/null')
            files.add(m[1]);
    }
    return Array.from(files);
}
function prioritizeAndCapFiles(paths, critical) {
    const scored = paths.map((p) => ({ p, score: critical.some((c) => p.includes(c)) ? 1 : 0 }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 200).map((s) => s.p);
}
function prioritizeFiles(paths, critical) {
    const scored = paths.map((p) => ({ p, score: critical.some((c) => p.includes(c)) ? 1 : 0 }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.p);
}
function filterDiffByFiles(diff, files) {
    if (!diff || files.length === 0)
        return '';
    const fileSet = new Set(files);
    const chunks = [];
    let keep = false;
    for (const line of diff.split('\n')) {
        // Start of a file section is indicated by '+++ b/<path>'
        const m = /^\+\+\+ b\/(.+)$/.exec(line);
        if (m) {
            keep = fileSet.has(m[1]);
        }
        if (keep)
            chunks.push(line);
    }
    return chunks.join('\n');
}
