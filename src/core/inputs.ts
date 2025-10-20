import * as core from '@actions/core';

export interface DiffPatchInputs {
  token: string;
  repository: string;
  prNumber: number;
  contextPath: string;
  baseSha: string;
  headSha: string;
}

export function getActionInputs(): DiffPatchInputs {
  const token = core.getInput('token', { required: true });
  const repository = core.getInput('repository', { required: true });
  const prNumberStr = core.getInput('pr_number');
  const prNumber = prNumberStr ? Number(prNumberStr) : 0;
  const contextPath = core.getInput('context_path');
  const baseSha = core.getInput('base_sha');
  const headSha = core.getInput('head_sha');

  return { token, repository, prNumber, contextPath, baseSha, headSha };
}


