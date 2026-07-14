import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';

export class ReadmeAnalyzer implements IAnalyzer {
  readonly name = 'ReadmeAnalyzer';
  readonly priority = 85;
  readonly description = 'Analyzes README and documentation quality';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const readmeFiles = context.getFilesMatching(/^readme/i);
    const docFiles = context.getFilesMatching(/\.(md|rst|adoc)$/i);
    const hasReadme = readmeFiles.length > 0;
    const hasContributing = context.fileExists('CONTRIBUTING.md');
    const hasChangelog = context.getFilesMatching(/changelog/i).length > 0;
    const hasLicense = context.getFilesMatching(/^license/i).length > 0;
    const hasDocsFolder = context.listDirectories().some((d) => d === 'docs' || d.startsWith('docs/'));

    let docScore = 0;
    if (hasReadme) docScore += 30;
    if (hasContributing) docScore += 15;
    if (hasChangelog) docScore += 15;
    if (hasLicense) docScore += 10;
    if (hasDocsFolder) docScore += 20;
    if (docFiles.length > 5) docScore += 10;

    const readmeContent = readmeFiles[0]?.content || '';
    const hasInstallSection = /##?\s*(install|setup|getting started)/i.test(readmeContent);
    const hasUsageSection = /##?\s*(usage|quick start|examples)/i.test(readmeContent);
    const hasApiDocs = /##?\s*(api|reference|documentation)/i.test(readmeContent);

    if (hasInstallSection) docScore += 5;
    if (hasUsageSection) docScore += 5;
    if (hasApiDocs) docScore += 5;

    return {
      scores: {
        architecture: 0,
        complexity: 0,
        maintainability: 0,
        security: 0,
        testCoverage: 0,
        documentation: Math.min(docScore, 100),
        dependencyHealth: 0,
      },
    };
  }
}
