import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';
import type { DetectedEnvVar } from '@dosson-architecture-visualizer/shared';

export class EnvironmentAnalyzer implements IAnalyzer {
  readonly name = 'EnvironmentAnalyzer';
  readonly priority = 55;
  readonly description = 'Detects environment variables and configuration';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const envVars = new Map<string, DetectedEnvVar>();

    const envExample = context.readFile('.env.example') || context.readFile('.env.sample') || context.readFile('.env.template');
    if (envExample) {
      for (const line of envExample.split('\n')) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*(?:=\s*(.*))?/);
        if (match) {
          const [, name, value] = match;
          envVars.set(name, {
            name,
            required: !value || value === '',
            defaultValue: value || undefined,
            sensitive: /secret|password|key|token|credential/i.test(name),
          });
        }
      }
    }

    const envUsagePattern = /process\.env\.([A-Z_][A-Z0-9_]*)|os\.environ(?:\.get)?\s*\[\s*['"]([A-Z_][A-Z0-9_]*)['"]\s*\]|os\.getenv\s*\(\s*['"]([A-Z_][A-Z0-9_]*)['"]\s*\)/g;
    for (const file of context.files) {
      let match;
      const regex = new RegExp(envUsagePattern.source, envUsagePattern.flags);
      while ((match = regex.exec(file.content)) !== null) {
        const name = match[1] || match[2] || match[3];
        if (name && !envVars.has(name)) {
          envVars.set(name, {
            name,
            required: true,
            sensitive: /secret|password|key|token|credential/i.test(name),
          });
        }
      }
    }

    return { environmentVariables: Array.from(envVars.values()) };
  }
}
