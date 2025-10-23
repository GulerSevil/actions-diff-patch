export type FileSize = {
    path: string;
    size: number;
};
export type Chunk = {
    id: number;
    files: string[];
    size: number;
};
export declare function computeFileSizes(baseSha: string, headSha: string, candidateFiles: string[]): FileSize[];
export declare function sortByCriticalAndSize(fileSizes: FileSize[], criticalGlobs: string[]): FileSize[];
export declare function binPackFiles(fileSizes: FileSize[], maxDiffLinesPerChunk: number, maxFilesPerChunk: number): Chunk[];
export declare function writeChunkManifests(chunks: Chunk[], baseSha: string, headSha: string): {
    manifestDir: string;
};
