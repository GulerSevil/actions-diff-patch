import { request } from 'https';

export async function fetchPrDiff(
  token: string,
  prNumber: number,
  serverUrl: string,
  owner: string,
  repo: string,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // Support multiple endpoints:
    // - GitHub API: https://api.github.com/repos/{owner}/{repo}/pulls/{number} with diff Accept header
    // - Patch host: https://patch-diff.githubusercontent.com/raw/{owner}/{repo}/pull/{number}.diff
    // - Web URL:    https://github.com/{owner}/{repo}/pull/{number}.diff
    let url: string;
    const headers: Record<string, string> = { 'User-Agent': 'action-diff-patch' };
    const lower = serverUrl.toLowerCase();
    if (lower.includes('api.github')) {
      url = `${serverUrl.replace(/\/$/, '')}/repos/${owner}/${repo}/pulls/${prNumber}`;
      headers['Accept'] = 'application/vnd.github.v3.diff';
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } else if (lower.includes('patch-diff.githubusercontent')) {
      url = `${serverUrl.replace(/\/$/, '')}/raw/${owner}/${repo}/pull/${prNumber}.diff`;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } else {
      url = `${serverUrl.replace(/\/$/, '')}/${owner}/${repo}/pull/${prNumber}.diff`;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const req = request(
      url,
      { headers, method: 'GET' },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          // Follow one redirect
          const redirected = request(
            res.headers.location,
            { headers, method: 'GET' },
            (r2) => {
              const s2 = r2.statusCode || 0;
              if (s2 >= 400) {
                reject(new Error(`HTTP ${s2}`));
                return;
              }
              let data = '';
              r2.setEncoding('utf-8');
              r2.on('data', (chunk) => (data += chunk));
              r2.on('end', () => resolve(data));
            },
          );
          redirected.on('error', reject);
          redirected.end();
          return;
        }
        if (status >= 400) {
          reject(new Error(`HTTP ${status}`));
          return;
        }
        let data = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      },
    );
    req.on('error', reject);
    req.end();
  });
}


