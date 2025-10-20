"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const http_1 = require("./adapters/http");
const git_1 = require("./adapters/git");
const context_1 = require("./core/context");
const diff_1 = require("./core/diff");
const inputs_1 = require("./core/inputs");
function jsonStringLiteral(text) {
    return JSON.stringify(text);
}
async function run() {
    try {
        const { token, repository, prNumber, contextPath, baseSha, headSha, batchSize } = (0, inputs_1.getActionInputs)();
        const contextJson = contextPath ? (0, context_1.loadContext)(contextPath) : '{}';
        core.setOutput('CONTEXT', contextJson);
        let diff = '';
        if (prNumber) {
            try {
                const serverUrl = 'https://github.com';
                const repoFull = repository;
                const [owner, repo] = repoFull.split('/', 2);
                if (!owner || !repo)
                    throw new Error('repository is not provided');
                diff = await (0, http_1.fetchPrDiff)(token, prNumber, serverUrl, owner, repo);
            }
            catch (e) {
                core.warning(`Failed to fetch PR .diff via API: ${String(e)}. Falling back to git diff.`);
            }
        }
        if (!diff && baseSha && headSha) {
            diff = await (0, git_1.gitDiff)(baseSha, headSha);
        }
        const filesAll = (0, diff_1.extractChangedFilesFromDiff)(diff);
        const contextObj = JSON.parse(contextJson);
        const critical = Array.isArray(contextObj.critical_paths) ? contextObj.critical_paths : [];
        const filesPrioritized = (0, diff_1.prioritizeFiles)(filesAll, critical);
        core.setOutput('TOTAL_FILES', String(filesAll.length));
        const batchCount = Math.max(1, Math.ceil(filesAll.length / batchSize));
        core.setOutput('BATCH_COUNT', String(batchCount));
        core.setOutput('CHANGED_FILES', jsonStringLiteral(filesAll.join('\n')));
        core.setOutput('DIFF', jsonStringLiteral(diff || ''));
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
