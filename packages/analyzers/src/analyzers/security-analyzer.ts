import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '../core/types';
import type { SecurityFinding } from '@dosson-architecture-visualizer/shared';

const SECURITY_PATTERNS: Array<{
  type: string;
  pattern: RegExp;
  severity: SecurityFinding['severity'];
  message: string;
}> = [
  { type: 'hardcoded_secret', pattern: /(?:password|secret|api_key|apikey|token)\s*[:=]\s*['"][^'"]{8,}['"]/i, severity: 'high', message: 'Potential hardcoded secret detected' },
  { type: 'aws_key', pattern: /AKIA[0-9A-Z]{16}/, severity: 'critical', message: 'AWS access key detected' },
  { type: 'private_key', pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, severity: 'critical', message: 'Private key detected in source' },
  { type: 'sql_injection', pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE)/i, severity: 'medium', message: 'Potential SQL injection via string interpolation' },
  { type: 'eval_usage', pattern: /\beval\s*\(/, severity: 'high', message: 'eval() usage detected' },
  { type: 'innerHTML', pattern: /\.innerHTML\s*=/, severity: 'medium', message: 'Direct innerHTML assignment (XSS risk)' },
  { type: 'disabled_ssl', pattern: /rejectUnauthorized\s*:\s*false/, severity: 'high', message: 'SSL certificate validation disabled' },
  { type: 'debug_mode', pattern: /DEBUG\s*=\s*True/i, severity: 'low', message: 'Debug mode enabled' },
];

export class SecurityAnalyzer implements IAnalyzer {
  readonly name = 'SecurityAnalyzer';
  readonly priority = 90;
  readonly description = 'Scans for security vulnerabilities and risks';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const securityFindings: SecurityFinding[] = [];
    const codeFiles = context.files.filter(
      (f) => !f.relativePath.includes('.env') && !f.relativePath.includes('node_modules'),
    );

    for (const file of codeFiles) {
      for (const check of SECURITY_PATTERNS) {
        const lines = file.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (check.pattern.test(lines[i])) {
            securityFindings.push({
              type: check.type,
              severity: check.severity,
              message: check.message,
              file: file.relativePath,
              line: i + 1,
            });
          }
        }
      }
    }

    const criticalCount = securityFindings.filter((f) => f.severity === 'critical').length;
    const highCount = securityFindings.filter((f) => f.severity === 'high').length;
    const securityScore = Math.max(0, 100 - criticalCount * 25 - highCount * 10 - securityFindings.length * 2);

    return {
      securityFindings: securityFindings.slice(0, 50),
      scores: {
        architecture: 0,
        complexity: 0,
        maintainability: 0,
        security: securityScore,
        testCoverage: 0,
        documentation: 0,
        dependencyHealth: 0,
      },
    };
  }
}
