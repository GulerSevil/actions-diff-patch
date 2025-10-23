import * as core from '@actions/core';
import { fetchPrDiff } from './adapters/http';
import { gitDiff } from './adapters/git';
import { loadContext } from './core/io/context';
import { extractChangedFilesFromDiff } from './core/diff/diff';
import { getOctokit } from '@actions/github';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getActionInputs } from './core/config/inputs';
import { parseCsvGlobs, applyIncludeExclude } from './core/filters/globs';
import {
  computeFileSizes,
  sortByCriticalAndSize,
  binPackFiles,
  writeChunkManifests,
} from './core/chunking/chunking';

function jsonStringLiteral(text: string): string {
  return JSON.stringify(text);
}

async function run(): Promise<void> {
  try {
    const inputs = getActionInputs();

    const contextJson = inputs.contextPath ? loadContext(inputs.contextPath) : '{}';
    core.setOutput('CONTEXT', contextJson);

    // Determine repository
    const repositoryFull = inputs.repository || process.env.GITHUB_REPOSITORY || '';
    const [owner, repo] = repositoryFull.split('/', 2);

    // Collect base/head and files depending on mode
    let resolvedBase = inputs.baseSha || '';
    let resolvedHead = inputs.headSha || '';
    let filesForChunking: string[] = [];
    let diff = '';

    if (inputs.prNumber) {
      if (!owner || !repo) throw new Error('repository is not provided');
      if (!inputs.token) throw new Error('token is required when pr_number is provided');

      const octokit = getOctokit(inputs.token);
      const pr = await octokit.rest.pulls.get({ owner, repo, pull_number: inputs.prNumber });
      resolvedBase = pr.data.base.sha;
      resolvedHead = pr.data.head.sha;

      const perPage = 100;
      let page = 1;
      for (;;) {
        const res = await octokit.rest.pulls.listFiles({ owner, repo, pull_number: inputs.prNumber, per_page: perPage, page });
        const pageFiles = res.data.map((f) => f.filename).filter(Boolean);
        filesForChunking.push(...pageFiles);
        if (res.data.length < perPage) break;
        page += 1;
      }

      // Prefer local git diff for DIFF; fallback to HTTP endpoints if needed
      diff = await gitDiff(resolvedBase, resolvedHead);
      if (!diff) {
        const endpoints = [
          'https://api.github.com',
          'https://patch-diff.githubusercontent.com',
          'https://github.com',
        ];
        for (const serverUrl of endpoints) {
          try {
            diff = await fetchPrDiff(inputs.token, inputs.prNumber, serverUrl, owner, repo);
            if (diff) break;
          } catch {
            // try next endpoint
          }
        }
      }
    } else {
      if (!resolvedBase || !resolvedHead) {
        core.info('base_sha/head_sha not provided; CHUNKING will be skipped for non-PR mode.');
      }
      if (resolvedBase && resolvedHead) {
        try {
          const nameOnly = execSync(`git diff --name-only ${resolvedBase}...${resolvedHead}`, { encoding: 'utf-8' });
          filesForChunking = nameOnly.split('\n').map((s) => s.trim()).filter(Boolean);
        } catch {
          filesForChunking = [];
        }
        diff = await gitDiff(resolvedBase, resolvedHead);
      }
    }


    const filesAll = extractChangedFilesFromDiff(diff);
    core.setOutput('TOTAL_FILES', String(filesAll.length));
    core.setOutput('CHANGED_FILES', jsonStringLiteral(filesAll.join('\n')));
    core.setOutput('DIFF', jsonStringLiteral(diff || ''));

    if (!inputs.chunkingEnabled) {
      return;
    }

    if (!resolvedBase || !resolvedHead) {
      core.warning('Chunking enabled but base/head SHAs are missing; skipping chunking.');
      core.setOutput('CHUNK_COUNT', '0');
      core.setOutput('CHUNK_IDS_JSON', jsonStringLiteral('[]'));
      core.setOutput('CHUNK_MANIFEST_DIR', '');
      return;
    }

    // Apply include/exclude globs
    const includeGlobs = parseCsvGlobs(inputs.includeGlobsCsv);
    const excludeGlobs = parseCsvGlobs(inputs.excludeGlobsCsv);
    const candidates = applyIncludeExclude(filesForChunking, includeGlobs, excludeGlobs);

    // Compute per-file sizes via numstat
    const fileSizes = computeFileSizes(resolvedBase, resolvedHead, candidates);

    // Parse critical globs and sort accordingly
    let criticalGlobs: string[] = [];
    try {
      criticalGlobs = inputs.criticalPathsJson ? (JSON.parse(inputs.criticalPathsJson) as string[]) : [];
      if (!Array.isArray(criticalGlobs)) criticalGlobs = [];
    } catch {
      criticalGlobs = [];
    }
    const sorted = sortByCriticalAndSize(fileSizes, criticalGlobs);

    // Greedy bin-pack
    const chunks = binPackFiles(sorted, inputs.maxDiffLinesPerChunk, inputs.maxFilesPerChunk);

    // Materialize manifests
    const { manifestDir } = writeChunkManifests(chunks, resolvedBase, resolvedHead);

    const chunkIds = chunks.map((c) => String(c.id));
    core.setOutput('CHUNK_COUNT', String(chunks.length));
    core.setOutput('CHUNK_IDS_JSON', JSON.stringify(chunkIds));
    core.setOutput('CHUNK_MANIFEST_DIR', manifestDir);
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();


