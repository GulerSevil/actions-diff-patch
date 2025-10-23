import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@actions/core', () => {
  const inputs: Record<string, string> = {};
  return {
    getInput: (name: string, opts?: { required?: boolean }) => {
      const val = inputs[name] ?? '';
      if (opts?.required && !val) throw new Error(`Missing required input ${name}`);
      return val;
    },
    setOutput: vi.fn(),
    setFailed: vi.fn(),
    warning: vi.fn(),
    __inputs: inputs,
  };
});

import * as core from '@actions/core';
import { getActionInputs } from '../../src/core/config/inputs';

const mockedCore = core as unknown as { __inputs: Record<string, string> } & typeof core;

describe('getActionInputs', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockedCore.__inputs)) delete mockedCore.__inputs[key];
  });

  afterEach(() => {
    for (const key of Object.keys(mockedCore.__inputs)) delete mockedCore.__inputs[key];
  });

  it('reads required inputs and applies defaults', () => {
    mockedCore.__inputs.token = 'tkn';
    mockedCore.__inputs.repository = 'owner/repo';
    const res = getActionInputs();
    expect(res.token).toBe('tkn');
    expect(res.repository).toBe('owner/repo');
    expect(res.prNumber).toBe(0);
    expect(res.contextPath).toBe('');
    expect(res.baseSha).toBe('');
    expect(res.headSha).toBe('');
  });

  it('parses numeric pr number', () => {
    mockedCore.__inputs.token = 'tkn';
    mockedCore.__inputs.repository = 'owner/repo';
    mockedCore.__inputs.pr_number = '42';
    const res = getActionInputs();
    expect(res.prNumber).toBe(42);
  });
});


