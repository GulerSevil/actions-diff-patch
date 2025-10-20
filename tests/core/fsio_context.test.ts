import { describe, it, expect } from 'vitest';
import { writeText, writeBytes, readText } from '../../src/core/fsio';
import { loadContext } from '../../src/core/context';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('fsio and context', () => {
  it('writeText/readText roundtrip', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fsio-'));
    const file = join(dir, 'a.txt');
    writeText(file, 'hello');
    expect(readText(file)).toBe('hello');
    rmSync(dir, { recursive: true, force: true });
  });

  it('writeBytes writes binary data', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fsio-'));
    const file = join(dir, 'a.bin');
    const buf = Buffer.from([0, 1, 2]);
    writeBytes(file, buf);
    rmSync(dir, { recursive: true, force: true });
  });

  it('loadContext returns minified JSON or {} on error', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ctx-'));
    const file = join(dir, 'context.json');
    writeText(file, JSON.stringify({ a: 1, nested: { b: 2 } }, null, 2));
    const loaded = loadContext(file);
    expect(loaded).toBe('{"a":1,"nested":{"b":2}}');
    const missing = join(dir, 'missing.json');
    const fallback = loadContext(missing);
    expect(fallback).toBe('{}');
    rmSync(dir, { recursive: true, force: true });
  });
});


