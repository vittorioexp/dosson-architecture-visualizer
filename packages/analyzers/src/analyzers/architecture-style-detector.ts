import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '../core/types';

export class ArchitectureStyleDetector implements IAnalyzer {
  readonly name = 'ArchitectureStyleDetector';
  readonly priority = 45;
  readonly description = 'Detects architecture patterns and styles';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const dirs = context.listDirectories();
    const allContent = context.files.map((f) => f.content).join('\n');

    const styles: Array<{ style: string; score: number }> = [];

    // Clean Architecture / DDD
    const cleanArchDirs = ['domain', 'application', 'infrastructure', 'presentation', 'entities', 'use-cases', 'repositories'];
    const cleanArchScore = cleanArchDirs.filter((d) => dirs.some((dir) => dir.includes(d))).length;
    if (cleanArchScore >= 2) styles.push({ style: 'Clean Architecture', score: cleanArchScore });

    // MVC
    if (dirs.some((d) => /controllers?/i.test(d)) && dirs.some((d) => /models?/i.test(d))) {
      styles.push({ style: 'MVC', score: 3 });
    }

    // Microservices
    const dockerCompose = context.readFile('docker-compose.yml') || context.readFile('docker-compose.yaml');
    if (dockerCompose) {
      const services = (dockerCompose.match(/^\s{2}(\w+):/gm) || []).length;
      if (services >= 3) styles.push({ style: 'Microservices', score: services });
    }

    // Monolith
    if (styles.length === 0) styles.push({ style: 'Monolithic', score: 1 });

    // Serverless
    if (/vercel\.json|serverless\.yml|@vercel\/node|aws-lambda/i.test(allContent)) {
      styles.push({ style: 'Serverless', score: 2 });
    }

    // Event-driven
    if (/event.*bus|event.*emitter|publish.*subscribe|@nestjs\/microservices/i.test(allContent)) {
      styles.push({ style: 'Event-Driven', score: 2 });
    }

    // Layered
    if (dirs.some((d) => /services?/i.test(d)) && dirs.some((d) => /repositories?/i.test(d))) {
      styles.push({ style: 'Layered Architecture', score: 2 });
    }

    const best = styles.sort((a, b) => b.score - a.score)[0];

    // Detect services
    const services: PartialAnalysisResult['services'] = [];
    if (dockerCompose) {
      const serviceMatches = dockerCompose.matchAll(/^\s{2}(\w+):/gm);
      for (const match of serviceMatches) {
        services.push({ name: match[1], type: 'docker-service' });
      }
    }

    for (const { data, path: pkgPath } of context.packageJsonFiles) {
      if (data.name) {
        services.push({
          name: data.name,
          type: 'package',
          path: pkgPath,
        });
      }
    }

    // Monorepo detection
    const monorepo = this.detectMonorepo(context);

    // Architecture score
    const archScore = Math.min(
      50 + cleanArchScore * 10 + (monorepo.isMonorepo ? 10 : 0) + (services.length > 1 ? 10 : 0),
      100,
    );

    return {
      architectureStyle: best?.style || 'Unknown',
      services,
      monorepo,
      folderStructure: this.buildFolderStructure(context),
      scores: {
        architecture: archScore,
        complexity: 0,
        maintainability: 0,
        security: 0,
        testCoverage: 0,
        documentation: 0,
        dependencyHealth: 0,
      },
    };
  }

  private detectMonorepo(context: AnalysisContext) {
    const hasWorkspaces = context.packageJsonFiles.some(
      ({ data }) => data.workspaces && (Array.isArray(data.workspaces) ? data.workspaces.length > 0 : true),
    );
    const hasLerna = context.fileExists('lerna.json');
    const hasNx = context.fileExists('nx.json');
    const hasTurbo = context.fileExists('turbo.json');
    const hasPnpmWorkspace = context.fileExists('pnpm-workspace.yaml');

    const tool = hasTurbo ? 'Turborepo' : hasNx ? 'Nx' : hasLerna ? 'Lerna' : hasPnpmWorkspace ? 'pnpm workspaces' : hasWorkspaces ? 'npm workspaces' : undefined;

    const packages: string[] = [];
    if (hasPnpmWorkspace) {
      const content = context.readFile('pnpm-workspace.yaml');
      if (content) {
        const matches = content.matchAll(/-\s*['"]?([^'"\n]+)['"]?/g);
        for (const m of matches) packages.push(m[1]);
      }
    }

    return {
      isMonorepo: !!(tool || context.packageJsonFiles.length > 1),
      tool,
      packages: packages.length > 0 ? packages : undefined,
    };
  }

  private buildFolderStructure(context: AnalysisContext) {
    const dirs = context.listDirectories();
    const topLevel = new Map<string, number>();

    for (const dir of dirs) {
      const top = dir.split('/')[0];
      topLevel.set(top, (topLevel.get(top) || 0) + 1);
    }

    return Array.from(topLevel.entries())
      .map(([path, children]) => ({ path, type: 'directory', children }))
      .sort((a, b) => (b.children || 0) - (a.children || 0));
  }
}
