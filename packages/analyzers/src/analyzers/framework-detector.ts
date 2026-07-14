import {
  FRAMEWORK_DISPLAY_NAMES,
  FRAMEWORK_INDICATORS,
  type SupportedFramework,
} from '@dosson-architecture-visualizer/shared';
import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';

export class FrameworkDetector implements IAnalyzer {
  readonly name = 'FrameworkDetector';
  readonly priority = 20;
  readonly description = 'Detects frameworks and libraries used in the project';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const detected = new Map<string, { confidence: number; evidence: string[] }>();

    const allDeps: Record<string, string> = {};
    for (const { data } of context.packageJsonFiles) {
      Object.assign(allDeps, data.dependencies, data.devDependencies);
    }

    for (const [framework, indicators] of Object.entries(FRAMEWORK_INDICATORS)) {
      const evidence: string[] = [];
      let score = 0;

      for (const indicator of indicators) {
        if (allDeps[indicator]) {
          evidence.push(`dependency: ${indicator}`);
          score += 0.4;
        }
        const matchingFiles = context.getFilesMatching(new RegExp(indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        if (matchingFiles.length > 0) {
          evidence.push(`found in ${matchingFiles.length} file(s)`);
          score += 0.2;
        }
      }

      if (score > 0) {
        detected.set(framework, {
          confidence: Math.min(score, 1),
          evidence,
        });
      }
    }

    // Check config files
    const configChecks: Array<{ file: RegExp; framework: SupportedFramework }> = [
      { file: /next\.config/, framework: 'nextjs' },
      { file: /angular\.json/, framework: 'angular' },
      { file: /vue\.config/, framework: 'vue' },
      { file: /nest-cli\.json/, framework: 'nestjs' },
      { file: /manage\.py/, framework: 'django' },
      { file: /requirements\.txt/, framework: 'fastapi' },
      { file: /pom\.xml|build\.gradle/, framework: 'spring-boot' },
      { file: /artisan/, framework: 'laravel' },
      { file: /Gemfile/, framework: 'rails' },
      { file: /go\.mod/, framework: 'gin' },
    ];

    for (const { file, framework } of configChecks) {
      if (context.getFilesMatching(file).length > 0) {
        const existing = detected.get(framework);
        detected.set(framework, {
          confidence: Math.min((existing?.confidence || 0) + 0.5, 1),
          evidence: [...(existing?.evidence || []), `config file match`],
        });
      }
    }

    const frameworks = Array.from(detected.entries())
      .map(([fw, data]) => ({
        name: FRAMEWORK_DISPLAY_NAMES[fw as SupportedFramework] || fw,
        category: 'framework',
        confidence: Math.round(data.confidence * 100) / 100,
        evidence: data.evidence,
      }))
      .sort((a, b) => b.confidence - a.confidence);

    return { frameworks };
  }
}
