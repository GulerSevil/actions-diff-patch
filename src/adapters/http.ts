import { request } from 'https';

export async function fetchPrDiff(
  token: string,
  prNumber: number,
  serverUrl: string,
  owner: string,
  repo: string,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const url = `${serverUrl}/${owner}/${repo}/pull/${prNumber}.diff`;
    const req = request(
      url,
      { headers: { Authorization: `Bearer ${token}` }, method: 'GET' },
      (res) => {
        if ((res.statusCode || 0) >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
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


