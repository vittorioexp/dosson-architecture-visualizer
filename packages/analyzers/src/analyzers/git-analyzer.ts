import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';

const CI_CD_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
  { name: 'GitHub Actions', patterns: [/^\.github\/workflows\//] },
  { name: 'GitLab CI', patterns: [/^\.gitlab-ci\.yml$/] },
  { name: 'CircleCI', patterns: [/^\.circleci\/config\.yml$/] },
  { name: 'Jenkins', patterns: [/Jenkinsfile/] },
  { name: 'Azure Pipelines', patterns: [/azure-pipelines\.yml/] },
  { name: 'Travis CI', patterns: [/^\.travis\.yml$/] },
  { name: 'Bitbucket Pipelines', patterns: [/^bitbucket-pipelines\.yml$/] },
];

export class GitAnalyzer implements IAnalyzer {
  readonly name = 'GitAnalyzer';
  readonly priority = 80;
  readonly description = 'Analyzes Git repository structure and CI/CD configuration';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const cicd: PartialAnalysisResult['cicd'] = [];

    for (const ci of CI_CD_PATTERNS) {
      const matching = context.files.filter((f) =>
        ci.patterns.some((p) => p.test(f.relativePath)),
      );
      if (matching.length > 0) {
        cicd.push({
          name: ci.name,
          category: 'cicd',
          confidence: 0.9,
          evidence: matching.map((f) => f.relativePath),
        });
      }
    }

    return { cicd };
  }
}
