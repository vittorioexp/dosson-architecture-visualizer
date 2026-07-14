import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';
import type { FileInfo } from '@dosson-architecture-visualizer/shared';

const IMPORT_PATTERNS = [
  /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
  /import\s+['"]([^'"]+)['"]/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /from\s+(\S+)\s+import/g, // Python
  /use\s+([^;]+);/g, // Rust/PHP
];

const EXPORT_PATTERNS = [
  /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+(\w+)/g,
  /export\s+{\s*([^}]+)\s*}/g,
  /module\.exports\s*=/g,
];

export class ImportAnalyzer implements IAnalyzer {
  readonly name = 'ImportAnalyzer';
  readonly priority = 40;
  readonly description = 'Analyzes import/export relationships between files';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const files: FileInfo[] = [];
    const importGraph = new Map<string, Set<string>>();

    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cs', '.php', '.rb'];

    for (const file of context.getFilesByExtension(codeExtensions)) {
      const imports: string[] = [];
      const exports: string[] = [];

      for (const pattern of IMPORT_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(file.content)) !== null) {
          const imp = match[1]?.trim();
          if (imp && !imp.startsWith('.') && imp !== 'type') {
            imports.push(imp);
          } else if (imp?.startsWith('.')) {
            imports.push(imp);
          }
        }
      }

      for (const pattern of EXPORT_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(file.content)) !== null) {
          if (match[1]) exports.push(match[1].trim());
        }
      }

      const complexity = this.calculateComplexity(file.content);

      files.push({
        path: file.relativePath,
        language: file.extension.replace('.', ''),
        lines: file.lineCount,
        complexity,
        imports: [...new Set(imports)],
        exports: [...new Set(exports)],
      });

      importGraph.set(file.relativePath, new Set(imports));
    }

    const circularDependencies = this.detectCircularDeps(importGraph);

    return { files, circularDependencies };
  }

  private calculateComplexity(content: string): number {
    const patterns = [
      /\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g,
      /\bswitch\b/g, /\bcase\b/g, /\bcatch\b/g, /\b\?\s*:/g,
      /\b&&\b/g, /\b\|\|\b/g,
    ];
    let complexity = 1;
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    }
    return complexity;
  }

  private detectCircularDeps(graph: Map<string, Set<string>>) {
    const cycles: Array<{ cycle: string[]; severity: 'low' | 'medium' | 'high' }> = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (stack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart >= 0) {
          const cycle = path.slice(cycleStart);
          cycles.push({
            cycle,
            severity: cycle.length <= 2 ? 'high' : cycle.length <= 4 ? 'medium' : 'low',
          });
        }
        return;
      }
      if (visited.has(node)) return;

      visited.add(node);
      stack.add(node);

      const deps = graph.get(node);
      if (deps) {
        for (const dep of deps) {
          if (dep.startsWith('.')) {
            const resolved = this.resolveImport(node, dep);
            if (resolved && graph.has(resolved)) {
              dfs(resolved, [...path, node]);
            }
          }
        }
      }

      stack.delete(node);
    };

    for (const node of graph.keys()) {
      dfs(node, []);
    }

    return cycles.slice(0, 20);
  }

  private resolveImport(from: string, importPath: string): string | null {
    const parts = from.split('/');
    parts.pop();
    const resolved = [...parts, ...importPath.split('/')].reduce((acc: string[], part) => {
      if (part === '..') acc.pop();
      else if (part !== '.') acc.push(part);
      return acc;
    }, []);
    const base = resolved.join('/');
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
    for (const ext of extensions) {
      if (ext) return base + ext;
    }
    return base;
  }
}
