export async function gitDiff(base: string, head: string): Promise<string> {
  const { execSync } = await import('child_process');
  try {
    return execSync(`git diff --unified=0 ${base} ${head}`, { encoding: 'utf-8' });
  } catch {
    return '';
  }
}


