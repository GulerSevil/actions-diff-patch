import { readFileSync } from 'fs';

export function loadContext(path: string): string {
  try {
    const raw = readFileSync(path, 'utf-8');
    const obj = JSON.parse(raw);
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}


