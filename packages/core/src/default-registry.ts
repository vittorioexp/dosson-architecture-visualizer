import { AnalyzerRegistry } from '@dosson-architecture-visualizer/plugin-sdk';
import {
  LanguageDetector,
  FrameworkDetector,
  DependencyAnalyzer,
  ArchitectureStyleDetector,
  ImportAnalyzer,
  EnvironmentAnalyzer,
  ApiAnalyzer,
  DatabaseAnalyzer,
  InfrastructureAnalyzer,
  DockerAnalyzer,
  TerraformAnalyzer,
  GitAnalyzer,
  ReadmeAnalyzer,
  SecurityAnalyzer,
  ComplexityAnalyzer,
  DocumentationAnalyzer,
} from '@dosson-architecture-visualizer/analyzers';

export function createDefaultRegistry(): AnalyzerRegistry {
  const registry = new AnalyzerRegistry();
  registry.register(new LanguageDetector());
  registry.register(new FrameworkDetector());
  registry.register(new DependencyAnalyzer());
  registry.register(new ArchitectureStyleDetector());
  registry.register(new ImportAnalyzer());
  registry.register(new EnvironmentAnalyzer());
  registry.register(new ApiAnalyzer());
  registry.register(new DatabaseAnalyzer());
  registry.register(new InfrastructureAnalyzer());
  registry.register(new DockerAnalyzer());
  registry.register(new TerraformAnalyzer());
  registry.register(new GitAnalyzer());
  registry.register(new ReadmeAnalyzer());
  registry.register(new SecurityAnalyzer());
  registry.register(new ComplexityAnalyzer());
  registry.register(new DocumentationAnalyzer());
  return registry;
}
