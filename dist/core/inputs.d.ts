export interface DiffPatchInputs {
    token: string;
    repository: string;
    prNumber: number;
    contextPath: string;
    baseSha: string;
    headSha: string;
}
export declare function getActionInputs(): DiffPatchInputs;
