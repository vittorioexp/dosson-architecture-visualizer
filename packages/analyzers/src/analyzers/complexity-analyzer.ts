import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';
import type { ModuleInfo } from '@dosson-architecture-visualizer/shared';

export class ComplexityAnalyzer implements IAnalyzer {
  readonly name = 'ComplexityAnalyzer';
  readonly priority = 95;
  readonly description = 'Calculates code complexity and maintainability metrics';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cs', '.php', '.rb'];
    const codeFiles = context.getFilesByExtension(codeExtensions);

    let totalLines = 0;
    let totalComplexity = 0;
    let maxComplexity = 0;

    const moduleMap = new Map<string, { files: number; lines: number; complexity: number; imports: Set<string>; exports: Set<string> }>();

    for (const file of codeFiles) {
      totalLines += file.lineCount;
      const complexity = this.cyclomaticComplexity(file.content);
      totalComplexity += complexity;
      maxComplexity = Math.max(maxComplexity, complexity);

      const modulePath = this.getModulePath(file.relativePath);
      const existing = moduleMap.get(modulePath) || { files: 0, lines: 0, complexity: 0, imports: new Set(), exports: new Set() };
      existing.files++;
      existing.lines += file.lineCount;
      existing.complexity += complexity;

      const imports = file.content.match(/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g) || [];
      imports.forEach((imp) => existing.imports.add(imp));
      moduleMap.set(modulePath, existing);
    }

    const avgComplexity = codeFiles.length > 0 ? totalComplexity / codeFiles.length : 0;
    const modules: ModuleInfo[] = Array.from(moduleMap.entries()).map(([name, data]) => ({
      name,
      path: name,
      files: data.files,
      lines: data.lines,
      imports: Array.from(data.imports),
      exports: [],
      complexity: data.complexity,
      coupling: data.imports.size,
    })).sort((a, b) => b.complexity - a.complexity);

    const afferent: Record<string, number> = {};
    const efferent: Record<string, number> = {};
    for (const mod of modules) {
      efferent[mod.name] = mod.imports.length;
      afferent[mod.name] = modules.filter((m) => m.imports.some((i) => i.includes(mod.name))).length;
    }

    const maintainabilityScore = Math.max(0, Math.min(100,
      100 - avgComplexity * 2 - (maxComplexity > 50 ? 20 : 0) - (codeFiles.length > 500 ? 15 : 0),
    ));

    return {
      modules,
      complexity: {
        totalFiles: codeFiles.length,
        totalLines,
        averageComplexity: Math.round(avgComplexity * 100) / 100,
        maxComplexity,
        cyclomaticComplexity: totalComplexity,
      },
      coupling: {
        afferentCoupling: afferent,
        efferentCoupling: efferent,
        mostCoupled: modules
          .map((m) => ({ module: m.name, score: (afferent[m.name] || 0) + (efferent[m.name] || 0) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10),
      },
      scores: {
        architecture: 0,
        complexity: Math.max(0, 100 - Math.min(avgComplexity * 5, 80)),
        maintainability: Math.round(maintainabilityScore),
        security: 0,
        testCoverage: 0,
        documentation: 0,
        dependencyHealth: 0,
      },
    };
  }

  private cyclomaticComplexity(content: string): number {
    const patterns = [/\bif\b/g, /\belse\s+if\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g, /\bcatch\b/g, /\b\?\s*:/g, /\b&&\b/g, /\b\|\|\b/g];
    let complexity = 1;
    for (const p of patterns) {
      const m = content.match(p);
      if (m) complexity += m.length;
    }
    return complexity;
  }

  private getModulePath(filePath: string): string {
    const parts = filePath.split('/');
    if (parts.length <= 2) return parts[0] || 'root';
    return parts.slice(0, 2).join('/');
  }
}
