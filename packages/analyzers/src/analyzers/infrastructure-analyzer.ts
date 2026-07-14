import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '../core/types';

const INFRA_PATTERNS: Record<string, Array<{ name: string; patterns: RegExp[] }>> = {
  queues: [
    { name: 'BullMQ', patterns: [/bullmq/i, /@nestjs\/bullmq/] },
    { name: 'RabbitMQ', patterns: [/amqplib/i, /rabbitmq/i] },
    { name: 'Kafka', patterns: [/kafkajs/i, /kafka/i] },
    { name: 'SQS', patterns: [/@aws-sdk\/client-sqs/i, /aws-sdk.*SQS/i] },
    { name: 'Celery', patterns: [/celery/i] },
  ],
  caches: [
    { name: 'Redis', patterns: [/ioredis/i, /redis/i] },
    { name: 'Memcached', patterns: [/memcached/i] },
    { name: 'ElastiCache', patterns: [/elasticache/i] },
  ],
  authentication: [
    { name: 'Better Auth', patterns: [/better-auth/i] },
    { name: 'NextAuth', patterns: [/next-auth/i] },
    { name: 'Auth0', patterns: [/auth0/i, /@auth0/] },
    { name: 'Passport', patterns: [/passport/i] },
    { name: 'JWT', patterns: [/jsonwebtoken/i, /jose/i] },
    { name: 'OAuth', patterns: [/oauth/i] },
    { name: 'Firebase Auth', patterns: [/firebase.*auth/i] },
    { name: 'Keycloak', patterns: [/keycloak/i] },
  ],
  externalServices: [
    { name: 'Stripe', patterns: [/stripe/i] },
    { name: 'SendGrid', patterns: [/sendgrid/i, /@sendgrid/] },
    { name: 'Twilio', patterns: [/twilio/i] },
    { name: 'AWS S3', patterns: [/@aws-sdk\/client-s3/i, /aws-sdk.*S3/i] },
    { name: 'OpenAI', patterns: [/openai/i] },
    { name: 'Sentry', patterns: [/@sentry/i] },
    { name: 'Datadog', patterns: [/dd-trace/i, /datadog/i] },
    { name: 'Slack', patterns: [/@slack/i] },
  ],
  cloudProviders: [
    { name: 'AWS', patterns: [/@aws-sdk/i, /aws-sdk/i, /amazonaws/i] },
    { name: 'Google Cloud', patterns: [/@google-cloud/i, /googleapis/i] },
    { name: 'Azure', patterns: [/@azure/i, /azure/i] },
    { name: 'Vercel', patterns: [/vercel/i, /@vercel/] },
    { name: 'Netlify', patterns: [/netlify/i] },
    { name: 'Heroku', patterns: [/heroku/i] },
    { name: 'DigitalOcean', patterns: [/digitalocean/i] },
    { name: 'Cloudflare', patterns: [/cloudflare/i, /@cloudflare/] },
  ],
};

export class InfrastructureAnalyzer implements IAnalyzer {
  readonly name = 'InfrastructureAnalyzer';
  readonly priority = 65;
  readonly description = 'Detects queues, caches, auth, external services, and cloud providers';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const allContent = context.files.map((f) => f.content).join('\n');
    const result: PartialAnalysisResult = {
      queues: [],
      caches: [],
      authentication: [],
      externalServices: [],
      cloudProviders: [],
      kubernetes: [],
    };

    for (const [category, items] of Object.entries(INFRA_PATTERNS)) {
      for (const item of items) {
        const evidence: string[] = [];
        for (const pattern of item.patterns) {
          if (pattern.test(allContent)) {
            const matchingFiles = context.getFilesMatching(pattern);
            if (matchingFiles.length > 0) {
              evidence.push(...matchingFiles.slice(0, 3).map((f) => f.relativePath));
            } else {
              evidence.push(pattern.source);
            }
          }
        }
        if (evidence.length > 0) {
          const entry = {
            name: item.name,
            category,
            confidence: Math.min(evidence.length * 0.3, 1),
            evidence: [...new Set(evidence)],
          };
          const key = category as keyof typeof result;
          if (Array.isArray(result[key])) {
            (result[key] as typeof entry[]).push(entry);
          }
        }
      }
    }

    // Kubernetes
    const k8sFiles = context.getFilesMatching(/\.(yaml|yml)$/);
    const k8sEvidence: string[] = [];
    for (const file of k8sFiles) {
      if (/kind:\s*(Deployment|Service|Ingress|ConfigMap|Secret|Pod)/i.test(file.content)) {
        k8sEvidence.push(file.relativePath);
      }
    }
    if (context.getFilesMatching(/k8s\//).length > 0 || context.getFilesMatching(/kubernetes\//).length > 0) {
      k8sEvidence.push('k8s/ directory');
    }
    if (k8sEvidence.length > 0) {
      result.kubernetes = [{
        name: 'Kubernetes',
        category: 'orchestration',
        confidence: Math.min(k8sEvidence.length * 0.3, 1),
        evidence: k8sEvidence,
      }];
    }

    return result;
  }
}
