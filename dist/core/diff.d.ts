export declare function extractChangedFilesFromDiff(diff: string): string[];
export declare function prioritizeAndCapFiles(paths: string[], critical: string[]): string[];
export declare function prioritizeFiles(paths: string[], critical: string[]): string[];
export declare function filterDiffByFiles(diff: string, files: string[]): string;
