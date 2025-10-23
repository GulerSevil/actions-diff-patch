export declare function parseCsvGlobs(csv: string): string[];
export declare function applyIncludeExclude(files: string[], includeGlobs: string[], excludeGlobs: string[]): string[];
export declare function isCriticalPath(filePath: string, criticalGlobs: string[]): boolean;
