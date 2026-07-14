import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const demoEmail = 'demo@dosson-architecture.dev';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'Demo User',
        emailVerified: true,
      },
    });

    const token = createHash('sha256').update('demo-session-token-archviz-2024').digest('hex');
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log('Seed complete:');
    console.log(`  Demo user: ${demoEmail}`);
    console.log(`  Session token: ${token}`);
    console.log('  Use this token as Bearer auth for API testing');
  } else {
    console.log('Seed already applied, skipping.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
