import type { AnalysisResult } from '@dosson-architecture-visualizer/shared';

export interface IndexedFile {
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  content: string;
  lines: string[];
  lineCount: number;
}

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

export interface AnalysisContext {
  rootPath: string;
  files: IndexedFile[];
  packageJsonFiles: Array<{ path: string; data: PackageJson }>;
  getFilesByExtension: (extensions: string[]) => IndexedFile[];
  getFilesMatching: (pattern: RegExp) => IndexedFile[];
  readFile: (relativePath: string) => string | null;
  fileExists: (relativePath: string) => boolean;
  listDirectories: () => string[];
}

export type PartialAnalysisResult = Partial<AnalysisResult>;

export interface IAnalyzer {
  readonly name: string;
  readonly priority: number;
  readonly description: string;
  analyze(context: AnalysisContext): Promise<PartialAnalysisResult>;
}

export interface AnalyzerResult {
  analyzer: string;
  duration: number;
  result: PartialAnalysisResult;
  error?: string;
}

export interface DossonPlugin {
  name: string;
  version: string;
  analyzers?: IAnalyzer[];
}
