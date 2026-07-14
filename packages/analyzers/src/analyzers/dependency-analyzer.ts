import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '../core/types';

const PACKAGE_MANAGERS: Array<{
  name: string;
  lockFiles: string[];
  configFiles: string[];
}> = [
  { name: 'pnpm', lockFiles: ['pnpm-lock.yaml'], configFiles: ['pnpm-workspace.yaml'] },
  { name: 'npm', lockFiles: ['package-lock.json'], configFiles: [] },
  { name: 'yarn', lockFiles: ['yarn.lock'], configFiles: ['.yarnrc.yml'] },
  { name: 'bun', lockFiles: ['bun.lockb', 'bun.lock'], configFiles: [] },
  { name: 'pip', lockFiles: ['requirements.txt', 'Pipfile.lock'], configFiles: ['Pipfile', 'pyproject.toml'] },
  { name: 'poetry', lockFiles: ['poetry.lock'], configFiles: ['pyproject.toml'] },
  { name: 'go mod', lockFiles: ['go.sum'], configFiles: ['go.mod'] },
  { name: 'cargo', lockFiles: ['Cargo.lock'], configFiles: ['Cargo.toml'] },
  { name: 'maven', lockFiles: [], configFiles: ['pom.xml'] },
  { name: 'gradle', lockFiles: [], configFiles: ['build.gradle', 'build.gradle.kts', 'settings.gradle'] },
  { name: 'composer', lockFiles: ['composer.lock'], configFiles: ['composer.json'] },
  { name: 'bundler', lockFiles: ['Gemfile.lock'], configFiles: ['Gemfile'] },
  { name: 'nuget', lockFiles: ['packages.lock.json'], configFiles: ['*.csproj', '*.sln'] },
];

export class DependencyAnalyzer implements IAnalyzer {
  readonly name = 'DependencyAnalyzer';
  readonly priority = 30;
  readonly description = 'Detects package managers and analyzes dependencies';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const packageManagers: PartialAnalysisResult['packageManagers'] = [];
    const unusedDependencies: string[] = [];

    for (const pm of PACKAGE_MANAGERS) {
      const evidence: string[] = [];
      for (const lock of pm.lockFiles) {
        if (context.fileExists(lock)) evidence.push(lock);
      }
      for (const config of pm.configFiles) {
        if (config.includes('*')) {
          if (context.getFilesMatching(new RegExp(config.replace('*', '.*'))).length > 0) {
            evidence.push(config);
          }
        } else if (context.fileExists(config)) {
          evidence.push(config);
        }
      }
      if (evidence.length > 0) {
        packageManagers.push({
          name: pm.name,
          category: 'package_manager',
          confidence: evidence.length / (pm.lockFiles.length + pm.configFiles.length || 1),
          evidence,
        });
      }
    }

    // Detect unused npm dependencies
    const allImports = new Set<string>();
    for (const file of context.getFilesByExtension(['.ts', '.tsx', '.js', '.jsx'])) {
      const importMatches = file.content.matchAll(/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g);
      for (const match of importMatches) {
        const pkg = match[1].split('/')[0];
        if (!pkg.startsWith('.') && !pkg.startsWith('@/')) {
          allImports.add(pkg.startsWith('@') ? match[1].split('/').slice(0, 2).join('/') : pkg);
        }
      }
    }

    for (const { data } of context.packageJsonFiles) {
      const deps = { ...data.dependencies, ...data.devDependencies };
      for (const dep of Object.keys(deps || {})) {
        if (!allImports.has(dep) && !dep.startsWith('@types/')) {
          unusedDependencies.push(dep);
        }
      }
    }

    return { packageManagers, unusedDependencies };
  }
}
