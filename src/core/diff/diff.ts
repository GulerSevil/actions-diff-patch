export function extractChangedFilesFromDiff(diff: string): string[] {
  const files = new Set<string>();
  for (const line of diff.split('\n')) {
    const m = /^\+\+\+ b\/(.+)$/.exec(line);
    if (m && m[1] && m[1] !== '/dev/null') files.add(m[1]);
  }
  return Array.from(files);
}

export function prioritizeAndCapFiles(paths: string[], critical: string[]): string[] {
  const scored = paths.map((p) => ({ p, score: critical.some((c) => p.includes(c)) ? 1 : 0 }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 200).map((s) => s.p);
}

export function filterDiffByFiles(diff: string, files: string[]): string {
  if (!diff || files.length === 0) return '';
  const fileSet = new Set(files);
  const chunks: string[] = [];
  let keep = false;
  for (const line of diff.split('\n')) {
    // Start of a file section is indicated by '+++ b/<path>'
    const m = /^\+\+\+ b\/(.+)$/.exec(line);
    if (m) {
      keep = fileSet.has(m[1]);
    }
    if (keep) chunks.push(line);
  }
  return chunks.join('\n');
}

// Added to satisfy tests: prioritize files by presence of any critical substrings
export function prioritizeFiles(paths: string[], critical: string[]): string[] {
  const scored = paths.map((p) => ({ p, score: critical.some((c) => p.includes(c)) ? 1 : 0 }));
  scored.sort((a, b) => b.score - a.score || a.p.localeCompare(b.p));
  return scored.map((s) => s.p);
}
