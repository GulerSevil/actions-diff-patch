export interface DiffPatchInputs {
    token: string;
    repository: string;
    prNumber: number;
    contextPath: string;
    baseSha: string;
    headSha: string;
    batchSize: number;
}
export declare function getActionInputs(): DiffPatchInputs;
