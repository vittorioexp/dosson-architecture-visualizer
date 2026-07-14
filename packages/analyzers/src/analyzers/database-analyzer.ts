import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '../core/types';

const DB_INDICATORS: Array<{ type: string; patterns: RegExp[]; orm?: string }> = [
  { type: 'PostgreSQL', patterns: [/postgres(ql)?/i, /pg\./i, /DATABASE_URL.*postgres/i], orm: 'Prisma' },
  { type: 'MySQL', patterns: [/mysql/i, /mariadb/i], orm: 'TypeORM' },
  { type: 'MongoDB', patterns: [/mongodb/i, /mongoose/i], orm: 'Mongoose' },
  { type: 'SQLite', patterns: [/sqlite/i], orm: 'Prisma' },
  { type: 'Redis', patterns: [/redis/i, /ioredis/i], orm: undefined },
  { type: 'Elasticsearch', patterns: [/elasticsearch/i, /@elastic/i] },
  { type: 'DynamoDB', patterns: [/dynamodb/i, /@aws-sdk\/client-dynamodb/i] },
];

const ORM_PATTERNS: Array<{ orm: string; patterns: RegExp[] }> = [
  { orm: 'Prisma', patterns: [/prisma/i, /@prisma\/client/, /schema\.prisma/] },
  { orm: 'TypeORM', patterns: [/typeorm/i, /@Entity\(/] },
  { orm: 'Sequelize', patterns: [/sequelize/i] },
  { orm: 'Drizzle', patterns: [/drizzle-orm/i] },
  { orm: 'Mongoose', patterns: [/mongoose/i, /Schema\(/] },
  { orm: 'SQLAlchemy', patterns: [/sqlalchemy/i] },
  { orm: 'Hibernate', patterns: [/hibernate/i, /@Entity/] },
  { orm: 'Entity Framework', patterns: [/EntityFramework/i, /DbContext/] },
];

export class DatabaseAnalyzer implements IAnalyzer {
  readonly name = 'DatabaseAnalyzer';
  readonly priority = 60;
  readonly description = 'Detects databases, ORMs, and data stores';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    const databases: PartialAnalysisResult['databases'] = [];
    const allContent = context.files.map((f) => f.content).join('\n');

    for (const db of DB_INDICATORS) {
      const evidence: string[] = [];
      for (const pattern of db.patterns) {
        if (pattern.test(allContent)) {
          evidence.push(pattern.source);
        }
      }
      if (evidence.length > 0) {
        let orm = db.orm;
        for (const ormConfig of ORM_PATTERNS) {
          if (ormConfig.patterns.some((p) => p.test(allContent))) {
            orm = ormConfig.orm;
            break;
          }
        }

        const tables = this.extractTables(context);
        databases.push({
          type: db.type,
          orm,
          tables: tables.length > 0 ? tables : undefined,
        });
      }
    }

    return { databases };
  }

  private extractTables(context: AnalysisContext): string[] {
    const tables: string[] = [];
    const prismaFiles = context.getFilesMatching(/schema\.prisma/);
    for (const file of prismaFiles) {
      const modelMatches = file.content.matchAll(/model\s+(\w+)\s*{/g);
      for (const match of modelMatches) {
        tables.push(match[1]);
      }
    }
    return tables;
  }
}
