import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  API_PORT: z.coerce.number().default(4000),
  API_URL: z.string().default('http://localhost:4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  BETTER_AUTH_SECRET: z.string().min(32),
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./storage'),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().default('dosson-architecture-visualizer'),
  S3_REGION: z.string().default('us-east-1'),
  AI_DEFAULT_PROVIDER: z.string().default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().default('https://api.anthropic.com/v1'),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-haiku-20241022'),
  GITHUB_TOKEN: z.string().optional(),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(100),
  MAX_ZIP_ENTRIES: z.coerce.number().default(10000),
  MAX_ZIP_UNCOMPRESSED_MB: z.coerce.number().default(500),
  ANALYSIS_SANDBOX_PATH: z.string().default('./sandbox'),
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  OTEL_ENABLED: z.coerce.boolean().default(false),
  OTEL_SERVICE_NAME: z.string().default('dosson-architecture-visualizer-api'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}
