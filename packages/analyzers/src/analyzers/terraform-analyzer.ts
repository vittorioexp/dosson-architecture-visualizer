import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';

export class TerraformAnalyzer implements IAnalyzer {
  readonly name = 'TerraformAnalyzer';
  readonly priority = 75;
  readonly description = 'Detects Terraform infrastructure as code';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const terraform: PartialAnalysisResult['terraform'] = [];
    const evidence: string[] = [];

    const tfFiles = context.getFilesByExtension(['.tf', '.tfvars', '.hcl']);
    if (tfFiles.length > 0) {
      evidence.push(`${tfFiles.length} Terraform file(s)`);
      const providers = new Set<string>();
      for (const file of tfFiles) {
        const providerMatches = file.content.matchAll(/provider\s+"(\w+)"/g);
        for (const match of providerMatches) providers.add(match[1]);
      }
      if (providers.size > 0) evidence.push(`providers: ${Array.from(providers).join(', ')}`);
    }

    if (context.fileExists('terraform.tfstate') || context.getFilesMatching(/\.tfstate\.backup/).length > 0) {
      evidence.push('terraform state files');
    }

    if (evidence.length > 0) {
      terraform.push({
        name: 'Terraform',
        category: 'infrastructure',
        confidence: Math.min(evidence.length * 0.3, 1),
        evidence,
      });
    }

    return { terraform };
  }
}
