import { describe, it, expect, vi } from 'vitest';
import { binPackFiles, sortByCriticalAndSize, writeChunkManifests, FileSize } from '../../src/core/chunking/chunking';
import { mkdtempSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

vi.mock('minimatch', () => {
  const minimatch = (p: string, pattern: string) => {
    if (pattern === '**/critical/**') return p.includes('critical/');
    return p === pattern;
  };
  return { minimatch };
});

vi.mock('child_process', async () => {
  return { execSync: () => '' };
});

describe('chunking', () => {
  it('sortByCriticalAndSize prioritizes critical then size', () => {
    const files: FileSize[] = [
      { path: 'a.ts', size: 10 },
      { path: 'b.ts', size: 100 },
      { path: 'critical/c.ts', size: 1 },
    ];
    const sorted = sortByCriticalAndSize(files, ['**/critical/**']);
    expect(sorted[0].path).toBe('critical/c.ts');
    expect(sorted[1].path).toBe('b.ts');
  });

  it('binPackFiles respects size budget and file cap', () => {
    const files: FileSize[] = [
      { path: 'big.ts', size: 10 },
      { path: 'mid.ts', size: 5 },
      { path: 'sm.ts', size: 3 },
    ];
    const chunks = binPackFiles(files, 8, 2);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('writeChunkManifests writes files and empty patch with mocked git', () => {
    const dir = mkdtempSync(join(tmpdir(), 'chunking-'));
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      const { manifestDir } = writeChunkManifests(
        [
          { id: 0, files: ['x.ts'], size: 1 },
          { id: 1, files: [], size: 0 },
        ],
        'deadbeef',
        'cafebabe',
      );
      const f0 = readFileSync(join(manifestDir, 'files.0.txt'), 'utf-8');
      expect(f0.trim()).toBe('x.ts');
      const p0 = readFileSync(join(manifestDir, 'diff.0.patch'), 'utf-8');
      expect(p0).toBe('');
    } finally {
      process.chdir(cwd);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});


