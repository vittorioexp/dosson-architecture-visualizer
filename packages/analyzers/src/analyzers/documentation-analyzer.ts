import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '../core/types';

export class DocumentationAnalyzer implements IAnalyzer {
  readonly name = 'DocumentationAnalyzer';
  readonly priority = 100;
  readonly description = 'Analyzes test coverage and documentation completeness';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const testPatterns = [
      /\.(test|spec)\.(ts|tsx|js|jsx|py|go|rs|java)$/,
      /^tests?\//,
      /__tests__/,
      /_test\.(go|rs)$/,
    ];

    const testFiles = context.files.filter((f) =>
      testPatterns.some((p) => p.test(f.relativePath)),
    );

    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cs'];
    const codeFiles = context.getFilesByExtension(codeExtensions);
    const sourceFiles = codeFiles.filter(
      (f) => !testPatterns.some((p) => p.test(f.relativePath)),
    );

    const testCoverageEstimate = sourceFiles.length > 0
      ? Math.min(Math.round((testFiles.length / sourceFiles.length) * 100 * 3), 100)
      : 0;

    const unusedFiles: string[] = [];
    const allImports = new Set<string>();
    for (const file of codeFiles) {
      const imports = file.content.match(/(?:import|require)\s*\(?['"](\.[^'"]+)['"]\)?/g) || [];
      imports.forEach((imp) => {
        const match = imp.match(/['"]([^'"]+)['"]/);
        if (match) allImports.add(match[1]);
      });
    }

    for (const file of sourceFiles) {
      const baseName = file.relativePath.replace(/\.[^.]+$/, '');
      const isImported = Array.from(allImports).some(
        (imp) => imp.includes(baseName) || imp.includes(file.relativePath.replace(/\.[^.]+$/, '')),
      );
      const isEntryPoint = /^(index|main|app|server)\./.test(file.relativePath) ||
        file.relativePath.includes('pages/') ||
        file.relativePath.includes('routes/');
      if (!isImported && !isEntryPoint && file.lineCount < 500) {
        unusedFiles.push(file.relativePath);
      }
    }

    return {
      unusedFiles: unusedFiles.slice(0, 30),
      scores: {
        architecture: 0,
        complexity: 0,
        maintainability: 0,
        security: 0,
        testCoverage: testCoverageEstimate,
        documentation: 0,
        dependencyHealth: 0,
      },
    };
  }
}
