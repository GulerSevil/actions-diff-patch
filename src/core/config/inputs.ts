import * as core from '@actions/core';

export interface DiffPatchInputs {
  token: string;
  repository: string;
  prNumber: number;
  contextPath: string;
  baseSha: string;
  headSha: string;
  chunkingEnabled: boolean;
  maxDiffLinesPerChunk: number;
  maxFilesPerChunk: number; // 0 means no cap
  includeGlobsCsv: string;
  excludeGlobsCsv: string;
  criticalPathsJson: string;
}

export function getActionInputs(): DiffPatchInputs {
  const token = core.getInput('token');
  const repository = core.getInput('repository');
  const prNumberStr = core.getInput('pr_number');
  const prNumber = prNumberStr ? Number(prNumberStr) : 0;
  const contextPath = core.getInput('context_path');
  const baseSha = core.getInput('base_sha');
  const headSha = core.getInput('head_sha');

  const chunkingEnabled = (core.getInput('chunking_enabled') || 'false').toLowerCase() === 'true';
  const maxDiffLinesPerChunk = Math.max(1, Number(core.getInput('max_diff_lines_per_chunk') || '1500') || 1500);
  const maxFilesPerChunkStr = core.getInput('max_files_per_chunk') || '';
  const maxFilesPerChunk = maxFilesPerChunkStr ? Math.max(1, Number(maxFilesPerChunkStr) || 1) : 0; // 0 == no cap
  const includeGlobsCsv = core.getInput('include_globs') || '';
  const excludeGlobsCsv = core.getInput('exclude_globs') || '';
  const criticalPathsJson = core.getInput('critical_paths_json') || '';

  return {
    token,
    repository,
    prNumber,
    contextPath,
    baseSha,
    headSha,
    chunkingEnabled,
    maxDiffLinesPerChunk,
    maxFilesPerChunk,
    includeGlobsCsv,
    excludeGlobsCsv,
    criticalPathsJson,
  };
}
