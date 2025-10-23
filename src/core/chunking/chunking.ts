import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { writeText } from '../io/fsio';
import { isCriticalPath } from '../filters/globs';

export type FileSize = { path: string; size: number };
export type Chunk = { id: number; files: string[]; size: number };

export function computeFileSizes(
  baseSha: string,
  headSha: string,
  candidateFiles: string[],
): FileSize[] {
  const fileSizes: FileSize[] = [];
  if (candidateFiles.length === 0) return fileSizes;
  try {
    const cmd = `git diff --numstat ${baseSha}...${headSha} -- ${candidateFiles
      .map((f) => `'${f.replace(/'/g, "'\\''")}'`)
      .join(' ')}`;
    const out = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
    const map = new Map<string, number>();
    for (const line of out.split('\n')) {
      if (!line.trim()) continue;
      const parts = line.split('\t');
      if (parts.length < 3) continue;
      const added = parts[0];
      const deleted = parts[1];
      const file = parts.slice(2).join('\t');
      const a = added === '-' ? 1 : Number(added) || 0;
      const d = deleted === '-' ? 1 : Number(deleted) || 0;
      map.set(file, a + d);
    }
    for (const f of candidateFiles) {
      const size = map.has(f) ? (map.get(f) as number) : 1; // default small size
      fileSizes.push({ path: f, size });
    }
  } catch {
    for (const f of candidateFiles) fileSizes.push({ path: f, size: 1 });
  }
  return fileSizes;
}

export function sortByCriticalAndSize(fileSizes: FileSize[], criticalGlobs: string[]): FileSize[] {
  const out = fileSizes.slice();
  out.sort((a, b) => {
    const ac = isCriticalPath(a.path, criticalGlobs) ? 1 : 0;
    const bc = isCriticalPath(b.path, criticalGlobs) ? 1 : 0;
    if (ac !== bc) return bc - ac; // critical first
    if (a.size !== b.size) return b.size - a.size; // larger first to pack efficiently
    return a.path.localeCompare(b.path);
  });
  return out;
}

export function binPackFiles(
  fileSizes: FileSize[],
  maxDiffLinesPerChunk: number,
  maxFilesPerChunk: number,
): Chunk[] {
  const chunks: Chunk[] = [];
  let current: Chunk | null = null;
  const withinFileCap = (chunk: Chunk, additionalFiles: number) =>
    maxFilesPerChunk === 0 || chunk.files.length + additionalFiles <= maxFilesPerChunk;

  for (const { path: f, size } of fileSizes) {
    const tooBigForBudget = size > maxDiffLinesPerChunk;
    if (!current) {
      current = { id: chunks.length, files: [], size: 0 };
    }
    const fits = current.size + size <= maxDiffLinesPerChunk && withinFileCap(current, 1);
    if (fits && !tooBigForBudget) {
      current.files.push(f);
      current.size += size;
      continue;
    }
    if (current.files.length === 0) {
      current.files.push(f);
      current.size += size;
      chunks.push(current);
      current = null;
      continue;
    }
    chunks.push(current);
    current = { id: chunks.length, files: [f], size };
    if (tooBigForBudget) {
      chunks.push(current);
      current = null;
    }
  }
  if (current && current.files.length > 0) chunks.push(current);
  return chunks;
}

export function writeChunkManifests(
  chunks: Chunk[],
  baseSha: string,
  headSha: string,
): { manifestDir: string } {
  const manifestDir = path.resolve(process.cwd(), 'chunks');
  if (!fs.existsSync(manifestDir)) fs.mkdirSync(manifestDir, { recursive: true });
  for (const c of chunks) {
    const filesPath = path.join(manifestDir, `files.${c.id}.txt`);
    writeText(filesPath, c.files.join('\n'));
    let chunkDiff = '';
    if (c.files.length > 0) {
      try {
        const cmd = `git diff --unified=0 ${baseSha}...${headSha} -- ${c.files
          .map((f) => `'${f.replace(/'/g, "'\\''")}'`)
          .join(' ')}`;
        chunkDiff = execSync(cmd, { encoding: 'utf-8' });
      } catch {
        chunkDiff = '';
      }
    }
    const patchPath = path.join(manifestDir, `diff.${c.id}.patch`);
    writeText(patchPath, chunkDiff);
  }
  return { manifestDir };
}
