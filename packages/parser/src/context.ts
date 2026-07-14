import * as fs from 'fs';
import * as path from 'path';
import type { AnalysisContext, IndexedFile, PackageJson } from '@dosson-architecture-visualizer/plugin-sdk';

export interface ScanOptions {
  maxFileSize?: number;
  ignoredDirs?: Set<string>;
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.turbo',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  'target',
  'bin',
  'obj',
  '.idea',
  '.vscode',
]);

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.pyw', '.pyi', '.go', '.rs', '.java',
  '.cs', '.csx', '.php', '.rb', '.rake',
  '.json', '.yaml', '.yml', '.toml', '.xml',
  '.md', '.txt', '.env', '.sql', '.graphql',
  '.dockerfile', '.sh', '.bash', '.zsh',
  '.html', '.css', '.scss', '.less',
  '.prisma', '.proto', '.gradle', '.properties',
]);

function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (base === 'dockerfile' || base.startsWith('dockerfile.')) return true;
  if (base === 'makefile' || base === 'gemfile' || base === 'rakefile') return true;
  return false;
}

function walkDirectory(dir: string, rootPath: string, files: IndexedFile[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      walkDirectory(fullPath, rootPath, files);
    } else if (entry.isFile() && isTextFile(fullPath)) {
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        files.push({
          path: fullPath,
          relativePath,
          extension: path.extname(entry.name).toLowerCase(),
          size: stat.size,
          content,
          lines,
          lineCount: lines.length,
        });
      } catch {
        // Skip unreadable files
      }
    }
  }
}

function parsePackageJson(content: string): PackageJson | null {
  try {
    return JSON.parse(content) as PackageJson;
  } catch {
    return null;
  }
}

export function createAnalysisContext(rootPath: string): AnalysisContext {
  const resolvedRoot = path.resolve(rootPath);
  const files: IndexedFile[] = [];
  walkDirectory(resolvedRoot, resolvedRoot, files);

  const packageJsonFiles: Array<{ path: string; data: PackageJson }> = [];
  for (const file of files) {
    if (path.basename(file.relativePath) === 'package.json') {
      const data = parsePackageJson(file.content);
      if (data) {
        packageJsonFiles.push({ path: file.relativePath, data });
      }
    }
  }

  return {
    rootPath: resolvedRoot,
    files,
    packageJsonFiles,
    getFilesByExtension(extensions: string[]) {
      const extSet = new Set(extensions.map((e) => e.toLowerCase()));
      return files.filter((f) => extSet.has(f.extension));
    },
    getFilesMatching(pattern: RegExp) {
      return files.filter((f) => pattern.test(f.relativePath) || pattern.test(f.content));
    },
    readFile(relativePath: string) {
      const file = files.find((f) => f.relativePath === relativePath);
      return file?.content ?? null;
    },
    fileExists(relativePath: string) {
      return files.some((f) => f.relativePath === relativePath);
    },
    listDirectories() {
      const dirs = new Set<string>();
      for (const file of files) {
        const dir = path.dirname(file.relativePath);
        if (dir !== '.') dirs.add(dir);
        const parts = dir.split('/');
        for (let i = 1; i < parts.length; i++) {
          dirs.add(parts.slice(0, i).join('/'));
        }
      }
      return Array.from(dirs).sort();
    },
  };
}
