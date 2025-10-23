export interface DiffPatchInputs {
    token: string;
    repository: string;
    prNumber: number;
    contextPath: string;
    baseSha: string;
    headSha: string;
    chunkingEnabled: boolean;
    maxDiffLinesPerChunk: number;
    maxFilesPerChunk: number;
    includeGlobsCsv: string;
    excludeGlobsCsv: string;
    criticalPathsJson: string;
}
export declare function getActionInputs(): DiffPatchInputs;
