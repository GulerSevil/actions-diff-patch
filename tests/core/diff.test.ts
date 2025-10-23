import { describe, it, expect } from 'vitest';
import { extractChangedFilesFromDiff, prioritizeFiles, prioritizeAndCapFiles, filterDiffByFiles } from '../../src/core/diff/diff';

const sampleDiff = [
  'diff --git a/README.md b/README.md',
  'index e69de29..4b825dc 100644',
  '--- a/README.md',
  '+++ b/README.md',
  '@@ -0,0 +1,2 @@',
  '+Hello',
  '+World',
  'diff --git a/src/a.ts b/src/a.ts',
  'index e69de29..4b825dc 100644',
  '--- a/src/a.ts',
  '+++ b/src/a.ts',
  '@@ -0,0 +1,1 @@',
  '+export const a = 1;',
  'diff --git a/src/b.ts b/src/b.ts',
  'index e69de29..4b825dc 100644',
  '--- a/src/b.ts',
  '+++ b/src/b.ts',
  '@@ -0,0 +1,1 @@',
  '+export const b = 2;',
].join('\n');

describe('diff utilities', () => {
  it('extractChangedFilesFromDiff returns files from +++ lines', () => {
    const files = extractChangedFilesFromDiff(sampleDiff);
    expect(files).toEqual(['README.md', 'src/a.ts', 'src/b.ts']);
  });

  it('prioritizeFiles sorts by presence of critical substrings', () => {
    const files = ['src/a.ts', 'src/b.ts', 'README.md'];
    const prioritized = prioritizeFiles(files, ['b.ts']);
    expect(prioritized[0]).toBe('src/b.ts');
  });

  it('prioritizeAndCapFiles caps at 200 and prioritizes', () => {
    const files = Array.from({ length: 250 }, (_, i) => `file-${i}.ts`);
    const res = prioritizeAndCapFiles(files, ['file-199']);
    expect(res.length).toBe(200);
    expect(res[0]).toBe('file-199.ts');
  });

  it('filterDiffByFiles keeps only chunks for selected files', () => {
    const filtered = filterDiffByFiles(sampleDiff, ['src/b.ts']);
    expect(filtered).toContain('+++ b/src/b.ts');
    expect(filtered).not.toContain('+++ b/src/a.ts');
  });
});


