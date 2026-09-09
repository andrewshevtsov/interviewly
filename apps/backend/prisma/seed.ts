import { createPrismaAdapter } from '../src/prisma/prisma-client-adapter.ts';
import { PrismaClient } from '../src/prisma/generated/client.ts';
import usersSeedData from './seed-data/users.ts';
import sessionsSeedData from './seed-data/sessions.ts';
import participantsSeedData from './seed-data/session-participants.ts';

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(),
});

async function main() {
  console.log('Starting database seed...');

  const userIdByEmail = new Map<string, string>();

  for (const eachUser of usersSeedData) {
    const user = await prisma.user.upsert({
      where: {
        email: eachUser.email,
      },
      update: eachUser,
      create: eachUser,
    });

    userIdByEmail.set(user.email, user.id);
  }

  for (const eachSession of sessionsSeedData) {
    const ownerId = userIdByEmail.get(eachSession.ownerEmail);

    if (!ownerId) {
      throw new Error(
        `Seed session owner was not found: ${eachSession.ownerEmail}`,
      );
    }

    const { ownerEmail, ...sessionData } = eachSession;

    await prisma.session.upsert({
      where: {
        id: eachSession.id,
      },
      update: {
        ownerId,
        ...sessionData,
      },
      create: {
        ownerId,
        ...sessionData,
      },
    });
  }

  for (const eachParticipant of participantsSeedData) {
    const userId = userIdByEmail.get(eachParticipant.userEmail);

    if (!userId) {
      throw new Error(
        `Seed session participant was not found: ${eachParticipant.userEmail}`,
      );
    }

    const { userEmail, sessionId, ...participantData } = eachParticipant;

    await prisma.sessionParticipant.upsert({
      where: {
        userId_sessionId: {
          userId,
          sessionId,
        },
      },
      update: participantData,
      create: {
        userId,
        sessionId,
        ...participantData,
      },
    });
  }

  console.log(`Seeded ${userIdByEmail.size} users`);
  console.log(`Seeded ${sessionsSeedData.length} sessions`);
  console.log(`Seeded ${participantsSeedData.length} session participants`);
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
