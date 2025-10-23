import { isMatch } from 'picomatch';

export function parseCsvGlobs(csv: string): string[] {
  return (csv || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function applyIncludeExclude(files: string[], includeGlobs: string[], excludeGlobs: string[]): string[] {
  let candidates = files.slice();
  if (includeGlobs.length > 0) {
    const includedSet = new Set<string>();
    for (const g of includeGlobs) {
      for (const f of candidates) {
        if (isMatch(f, g)) includedSet.add(f);
      }
    }
    candidates = Array.from(includedSet);
  }
  if (excludeGlobs.length > 0) {
    candidates = candidates.filter((f) => !excludeGlobs.some((g) => isMatch(f, g)));
  }
  return candidates;
}

export function isCriticalPath(filePath: string, criticalGlobs: string[]): boolean {
  return criticalGlobs.some((g) => isMatch(filePath, g));
}
