# action-diff-patch

Prepare CONTEXT, FILES, and DIFF for downstream automation by preferring a local `git diff` between PR base/head (or provided SHAs), and falling back to fetching a PR `.diff` over HTTPS when necessary. Returns prioritized file lists and batch metadata as action outputs.

Now supports optional adaptive chunking of changed files for large diffs.

## Features
- PR mode: Prefer local git diff between PR base/head; fallback to HTTPS `.diff`
- Non‑PR mode: Use `git diff <base_sha> <head_sha>`
- Extracts changed files from the diff
- Optional chunk prioritization via `critical_paths_json` glob patterns
- Outputs minified context JSON; `CHANGED_FILES` and `DIFF` as JSON string literals; also writes file outputs under `.ai/`

## Inputs
- `token` (optional; required in PR mode): GitHub token for API requests
- `repository` (optional): `owner/repo` override (defaults to `GITHUB_REPOSITORY`)
- `pr_number` (optional): PR number override; if empty, falls back to SHAs
- `context_path` (optional): Path to a JSON file with optional `critical_paths` array
- `base_sha` (optional): Base commit SHA for non‑PR mode
- `head_sha` (optional): Head commit SHA for non‑PR mode

### Chunking (optional)
- `chunking_enabled`: "true" to enable adaptive chunking (default: "false")
- `max_diff_lines_per_chunk`: integer budget for added+deleted per chunk (default: "1500")
- `max_files_per_chunk`: optional cap on number of files per chunk (default: unset)
- `include_globs`: CSV of globs to include (e.g., `*.swift,*.m`)
- `exclude_globs`: CSV of globs to exclude
- `critical_paths_json`: JSON array of globs to prioritize earlier (e.g., `["**/Payments/**"]`)


## Outputs
- `CONTEXT`: Minified JSON string of the provided context file (or `{}`)
- `TOTAL_FILES`: Total changed files count
- `CHANGED_FILES`: JSON string literal of the newline‑joined list of changed files
- `DIFF`: JSON string literal of the full diff content (may be large)
- `DIFF_FILE`: Absolute path to the full unified diff file (e.g., `.ai/diff.all.patch`)
- `CHANGED_FILES_FILE`: Absolute path to the newline‑joined changed files file (e.g., `.ai/files.all.txt`)

When chunking is enabled, additional outputs are provided:
- `CHUNK_COUNT`: Number of generated chunks
- `CHUNK_IDS_JSON`: JSON array of chunk IDs as strings, e.g., `["0","1"]`
- `CHUNK_MANIFEST_DIR`: Directory path containing manifests:
  - `files.<id>.txt`: newline‑joined files in the chunk
  - `diff.<id>.patch`: unified diff for those files

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
    chunking_enabled: "true"
    max_diff_lines_per_chunk: "1500"
    include_globs: "*.swift,*.m"
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
    chunking_enabled: "true"
```

### Matrix example with AI inference
```yaml
- name: Prepare diff/context
  id: prep
  uses: GulerSevil/actions-diff-patch@<ref>
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    repository: ${{ github.repository }}
    pr_number: ${{ github.event.pull_request.number }}
    chunking_enabled: "true"

- name: Run AI for each chunk
  if: steps.prep.outputs.CHUNK_COUNT != '0'
  uses: some/ai-action@v1
  with:
    manifest_dir: ${{ steps.prep.outputs.CHUNK_MANIFEST_DIR }}
    chunk_ids_json: ${{ steps.prep.outputs.CHUNK_IDS_JSON }}
```

### Consuming outputs
```yaml
- name: Print summary
  id: prep
  run: |
    echo "TOTAL_FILES=${{ steps.prep.outputs.TOTAL_FILES }}"
    echo "CHUNK_COUNT=${{ steps.prep.outputs.CHUNK_COUNT }}"
    echo "CHANGED_FILES=${{ steps.prep.outputs.CHANGED_FILES }}"
    echo "CONTEXT=${{ steps.prep.outputs.CONTEXT }}"
    # DIFF may be large; treat carefully
    echo "DIFF_FILE=${{ steps.prep.outputs.DIFF_FILE }}"
    echo "CHANGED_FILES_FILE=${{ steps.prep.outputs.CHANGED_FILES_FILE }}"
    # Example: consume file outputs safely
    head -n 100 "${{ steps.prep.outputs.DIFF_FILE }}" || true
```

## Critical paths
Provide `critical_paths_json` as a JSON array of globs (e.g., `["**/Payments/**", "**/*.swift"]`). These globs are used to prioritize files into earlier chunks when chunking is enabled. This does not change the order of `CHANGED_FILES`.

```json
["src/core/**", "infrastructure/**"]
```

## Architecture
- `src/core/config/inputs.ts`: parses all action inputs (including chunking and globs)
- `src/core/filters/globs.ts`: CSV parsing, include/exclude filtering, critical-path checks
- `src/core/chunking/chunking.ts`: file size computation, sorting, bin packing, manifest writing
- `src/core/diff/diff.ts`: diff utilities (file extraction, filtering, prioritization helpers)
- `src/core/io/fsio.ts` and `src/core/io/context.ts`: file I/O utilities and context loader
- `src/adapters/http.ts` and `src/adapters/git.ts`: network and git adapters
- `src/index.ts`: orchestration using the modules above

## Local development
Requirements: Node 20+

- Install: `npm install`
- Build: `npm run build`
- Test: `npm run test` or `npm run test:watch`

The TypeScript sources are under `src/`. Tests live under `tests/` and are executed with Vitest.

## Notes
- If `pr_number` is provided, the action attempts to fetch the `.diff` via HTTPS first; on failure, it falls back to `git diff` if `base_sha` and `head_sha` are provided.
- Ensure the token has permission to access the PR if using private repositories.
- Chunking is disabled by default and does not affect legacy outputs when off.
