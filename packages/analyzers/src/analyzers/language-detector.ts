import {
  LANGUAGE_EXTENSIONS,
  LANGUAGE_DISPLAY_NAMES,
  type SupportedLanguage,
} from '@dosson-architecture-visualizer/shared';
import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '../core/types';

export class LanguageDetector implements IAnalyzer {
  readonly name = 'LanguageDetector';
  readonly priority = 10;
  readonly description = 'Detects programming languages used in the project';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const counts: Record<string, number> = {};

    for (const file of context.files) {
      for (const [lang, extensions] of Object.entries(LANGUAGE_EXTENSIONS)) {
        if (extensions.includes(file.extension)) {
          counts[lang] = (counts[lang] || 0) + 1;
        }
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const languages = Object.entries(counts)
      .map(([lang, count]) => ({
        name: LANGUAGE_DISPLAY_NAMES[lang as SupportedLanguage] || lang,
        category: 'language',
        confidence: Math.round((count / total) * 100) / 100,
        evidence: [`${count} files`],
      }))
      .sort((a, b) => b.confidence - a.confidence);

    return { languages };
  }
}
