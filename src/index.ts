import * as core from '@actions/core';
import { writeText } from './core/fsio';
import { fetchPrDiff } from './adapters/http';
import { gitDiff } from './adapters/git';
import { loadContext } from './core/context';
import { extractChangedFilesFromDiff, prioritizeFiles } from './core/diff';
import { getActionInputs } from './core/inputs';

function jsonStringLiteral(text: string): string {
  return JSON.stringify(text);
}

async function run(): Promise<void> {
  try {
    const { token, repository, prNumber, contextPath, baseSha, headSha, batchSize } = getActionInputs();

    const contextJson = contextPath ? loadContext(contextPath) : '{}';
    core.setOutput('CONTEXT', contextJson);

    let diff = '';
    if (prNumber) {
      try {
        const serverUrl = 'https://github.com';
        const repoFull = repository;
        const [owner, repo] = repoFull.split('/', 2);
        if (!owner || !repo) throw new Error('repository is not provided');
        diff = await fetchPrDiff(token, prNumber, serverUrl, owner, repo);
      } catch (e) {
        core.warning(`Failed to fetch PR .diff via API: ${String(e)}. Falling back to git diff.`);
      }
    }
    if (!diff && baseSha && headSha) {
      diff = await gitDiff(baseSha, headSha);
    }
    
    const filesAll = extractChangedFilesFromDiff(diff);
    const contextObj = JSON.parse(contextJson);
    const critical: string[] = Array.isArray(contextObj.critical_paths) ? contextObj.critical_paths : [];
    const filesPrioritized = prioritizeFiles(filesAll, critical);


    core.setOutput('TOTAL_FILES', String(filesPrioritized.length));
    const batchCount = Math.max(1, Math.ceil(filesAll.length / batchSize));
    core.setOutput('BATCH_COUNT', String(batchCount));
    core.setOutput('CHANGED_FILES', jsonStringLiteral(filesPrioritized.join('\n')));
    core.setOutput('DIFF', jsonStringLiteral(diff || ''));
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();


