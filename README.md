# action-diff-patch

Prepare CONTEXT, FILES, and DIFF for downstream automation by fetching a PR .diff from GitHub or falling back to a plain `git diff` between SHAs. Returns prioritized file lists and batch metadata as action outputs.

## Features
- PR mode: Fetches `pull/<pr_number>.diff` via HTTPS using a token
- Non‑PR mode: Falls back to `git diff <base_sha> <head_sha>`
- Extracts changed files from the diff
- Optional prioritization via "critical paths" in the provided context JSON
- Outputs minified context JSON and diff as JSON string literals for safe downstream consumption

## Inputs
- `token` (required): GitHub token for API requests
- `repository` (required): `owner/repo` (override; e.g. `org/repo`)
- `pr_number` (optional): PR number override; if empty, falls back to SHAs
- `context_path` (optional): Path to a JSON file with optional `critical_paths` array
- `base_sha` (optional): Base commit SHA for non‑PR mode
- `head_sha` (optional): Head commit SHA for non‑PR mode


## Outputs
- `CONTEXT`: Minified JSON string of the provided context file (or `{}`)
- `TOTAL_FILES`: Total changed files count
- `BATCH_COUNT`: Number of batches, `ceil(TOTAL_FILES / batch_size)`
- `CHANGED_FILES`: Newline‑joined list of changed files (prioritized by critical paths if provided)
- `DIFF`: JSON string literal of the full diff content (may be large)

## Usage
### PR mode (HTTPS .diff)
```yaml
- name: Prepare diff/context
  uses: GulerSevil/actions-diff-patch@<ref>
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    repository: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    context_path: .github/prompts/ios-risk-context.json
```

### Non‑PR mode (git diff SHAs)
```yaml
- name: Prepare diff/context
  uses: GulerSevil/actions-diff-patch@<ref>
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    repository: ${{ github.repository }}
    base_sha: ${{ github.sha }}^     # example: previous commit
    head_sha: ${{ github.sha }}
    context_path: .github/prompts/ios-risk-context.json
```

### Consuming outputs
```yaml
- name: Print summary
  id: diff
  run: |
    echo "TOTAL_FILES=${{ steps.diff.outputs.TOTAL_FILES }}"
    echo "BATCH_COUNT=${{ steps.diff.outputs.BATCH_COUNT }}"
    echo "CHANGED_FILES=${{ steps.diff.outputs.CHANGED_FILES }}"
    echo "CONTEXT=${{ steps.diff.outputs.CONTEXT }}"
    # DIFF may be large; treat carefully
```

## Context JSON and critical paths
If the context file contains a top‑level `critical_paths` array, files containing any of those substrings are prioritized first in the `CHANGED_FILES` output. Example:
```json
{
  "critical_paths": ["src/core/", "infrastructure/"]
}
```

## Local development
Requirements: Node 20+

- Install: `npm install`
- Build: `npm run build`
- Test: `npm run test` or `npm run test:watch`

The TypeScript sources are under `src/`. Tests live under `tests/` and are executed with Vitest.

## Notes
- If `pr_number` is provided, the action attempts to fetch the `.diff` via HTTPS first; on failure, it falls back to `git diff` if `base_sha` and `head_sha` are provided.
- Ensure the token has permission to access the PR if using private repositories.
