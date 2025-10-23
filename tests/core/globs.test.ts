import { describe, it, expect, vi } from 'vitest';

vi.mock('minimatch', () => {
  const minimatch = (p: string, pattern: string) => {
    if (pattern === '**/*.ts' || pattern === '*.ts') return p.endsWith('.ts');
    if (pattern === '**/*.js' || pattern === '*.js') return p.endsWith('.js');
    if (pattern === 'sub/**') return p.startsWith('sub/');
    if (pattern === '**/critical/**') return p.includes('/critical/');
    if (pattern === '**/core/**') return p.includes('/core/');
    return p === pattern;
  };
  return { minimatch };
});

describe('globs utilities', () => {
  it('parseCsvGlobs trims and filters empty', async () => {
    const { parseCsvGlobs } = await import('../../src/core/filters/globs');
    expect(parseCsvGlobs('  *.ts, ,**/*.js  ')).toEqual(['*.ts', '**/*.js']);
  });

  it('applyIncludeExclude includes first then excludes', async () => {
    const { applyIncludeExclude } = await import('../../src/core/filters/globs');
    const files = ['a.ts', 'b.js', 'c.ts', 'sub/x.ts'];
    const included = applyIncludeExclude(files, ['**/*.ts'], ['sub/**']);
    expect(included.sort()).toEqual(['a.ts', 'c.ts']);
  });

  it('isCriticalPath matches any critical glob', async () => {
    const { isCriticalPath } = await import('../../src/core/filters/globs');
    expect(isCriticalPath('src/core/a.ts', ['**/core/**'])).toBe(true);
    expect(isCriticalPath('src/other/a.ts', ['**/core/**'])).toBe(false);
  });
});


