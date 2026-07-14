import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '../core/types';
import type { DetectedApi } from '@dosson-architecture-visualizer/shared';

const API_PATTERNS: Array<{
  framework: string;
  patterns: RegExp[];
  methodGroup?: number;
  pathGroup?: number;
}> = [
  {
    framework: 'NestJS',
    patterns: [
      /@(Get|Post|Put|Patch|Delete|All)\s*\(\s*['"`]([^'"`]*?)['"`]?\s*\)/g,
      /@Controller\s*\(\s*['"`]([^'"`]*?)['"`]?\s*\)/g,
    ],
    methodGroup: 1,
    pathGroup: 2,
  },
  {
    framework: 'Express',
    patterns: [
      /(?:app|router)\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    ],
    methodGroup: 1,
    pathGroup: 2,
  },
  {
    framework: 'FastAPI',
    patterns: [
      /@(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    ],
    methodGroup: 1,
    pathGroup: 2,
  },
  {
    framework: 'Django',
    patterns: [
      /path\s*\(\s*['"`]([^'"`]+)['"`]/g,
    ],
    pathGroup: 1,
  },
  {
    framework: 'Spring Boot',
    patterns: [
      /@(Get|Post|Put|Patch|Delete|Request)Mapping\s*\(\s*(?:value\s*=\s*)?['"`]([^'"`]+)['"`]/g,
    ],
    methodGroup: 1,
    pathGroup: 2,
  },
  {
    framework: 'Next.js',
    patterns: [
      /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(/g,
    ],
    methodGroup: 1,
  },
];

export class ApiAnalyzer implements IAnalyzer {
  readonly name = 'ApiAnalyzer';
  readonly priority = 50;
  readonly description = 'Detects API routes and endpoints';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const apis: DetectedApi[] = [];
    const codeFiles = context.getFilesByExtension(['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs']);

    for (const file of codeFiles) {
      for (const config of API_PATTERNS) {
        for (const pattern of config.patterns) {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;
          while ((match = regex.exec(file.content)) !== null) {
            const method = config.methodGroup ? (match[config.methodGroup]?.toUpperCase() || 'GET') : 'GET';
            const apiPath = config.pathGroup ? match[config.pathGroup] : file.relativePath;

            if (config.framework === 'Next.js' && file.relativePath.includes('route.')) {
              const routePath = this.inferNextJsRoute(file.relativePath);
              apis.push({
                method,
                path: routePath,
                file: file.relativePath,
                framework: config.framework,
              });
            } else if (apiPath) {
              apis.push({
                method,
                path: apiPath,
                file: file.relativePath,
                framework: config.framework,
              });
            }
          }
        }
      }
    }

    return { apis: this.deduplicateApis(apis) };
  }

  private inferNextJsRoute(filePath: string): string {
    const match = filePath.match(/app\/(.+)\/route\./);
    if (match) return '/' + match[1].replace(/\[([^\]]+)\]/g, ':$1');
    const pagesMatch = filePath.match(/pages\/api\/(.+)\./);
    if (pagesMatch) return '/api/' + pagesMatch[1].replace(/\[([^\]]+)\]/g, ':$1');
    return filePath;
  }

  private deduplicateApis(apis: DetectedApi[]): DetectedApi[] {
    const seen = new Set<string>();
    return apis.filter((api) => {
      const key = `${api.method}:${api.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
