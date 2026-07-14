import type { IAnalyzer, AnalyzerResult, PartialAnalysisResult, AnalysisContext } from './types';

export class AnalyzerRegistry {
  private analyzers: Map<string, IAnalyzer> = new Map();

  register(analyzer: IAnalyzer): void {
    this.analyzers.set(analyzer.name, analyzer);
  }

  unregister(name: string): void {
    this.analyzers.delete(name);
  }

  get(name: string): IAnalyzer | undefined {
    return this.analyzers.get(name);
  }

  getAll(): IAnalyzer[] {
    return Array.from(this.analyzers.values()).sort((a, b) => a.priority - b.priority);
  }

  async runAll(context: AnalysisContext): Promise<{
    results: AnalyzerResult[];
    merged: PartialAnalysisResult;
  }> {
    const results: AnalyzerResult[] = [];
    const merged: PartialAnalysisResult = {};

    for (const analyzer of this.getAll()) {
      const start = Date.now();
      try {
        const result = await analyzer.analyze(context);
        results.push({ analyzer: analyzer.name, duration: Date.now() - start, result });
        Object.assign(merged, result);
      } catch (error) {
        results.push({
          analyzer: analyzer.name,
          duration: Date.now() - start,
          result: {},
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { results, merged };
  }
}
