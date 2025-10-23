import { readFileSync, writeFileSync } from 'fs';

export function writeText(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
}

export function writeBytes(path: string, bytes: Buffer): void {
  writeFileSync(path, bytes);
}

export function readText(path: string): string {
  return readFileSync(path, 'utf-8');
}
