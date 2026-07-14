import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';

export class DockerAnalyzer implements IAnalyzer {
  readonly name = 'DockerAnalyzer';
  readonly priority = 70;
  readonly description = 'Detects Docker configuration and containerization';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const docker: PartialAnalysisResult['docker'] = [];
    const evidence: string[] = [];

    const dockerfiles = context.getFilesMatching(/dockerfile/i);
    if (dockerfiles.length > 0) {
      evidence.push(`${dockerfiles.length} Dockerfile(s)`);
      for (const df of dockerfiles) {
        const fromMatches = df.content.match(/FROM\s+(\S+)/gi);
        if (fromMatches) {
          evidence.push(`base images: ${fromMatches.join(', ')}`);
        }
      }
    }

    if (context.fileExists('docker-compose.yml') || context.fileExists('docker-compose.yaml')) {
      evidence.push('docker-compose.yml');
      const compose = context.readFile('docker-compose.yml') || context.readFile('docker-compose.yaml');
      if (compose) {
        const services = compose.match(/^\s{2}(\w+):/gm);
        if (services) evidence.push(`services: ${services.map((s) => s.trim().replace(':', '')).join(', ')}`);
      }
    }

    if (context.fileExists('.dockerignore')) evidence.push('.dockerignore');

    if (evidence.length > 0) {
      docker.push({
        name: 'Docker',
        category: 'containerization',
        confidence: Math.min(evidence.length * 0.25, 1),
        evidence,
      });
    }

    return { docker };
  }
}
