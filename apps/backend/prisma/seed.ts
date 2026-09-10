import * as bcrypt from 'bcrypt';
import { createPrismaAdapter } from '../src/prisma/prisma-client-adapter.ts';
import { PrismaClient } from '../src/prisma/generated/client.ts';
import usersSeedData from './seed-data/users.ts';
import sessionsSeedData from './seed-data/sessions.ts';
import participantsSeedData from './seed-data/session-participants.ts';
import profilesSeedData from './seed-data/profiles.ts';

// Тот же фактор, что и в AuthService, чтобы сид-хеши были неотличимы
// от реальных регистраций.
const PASSWORD_SALT_ROUNDS = 12;

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(),
});

async function main() {
  console.log('Starting database seed...');

  const userIdByEmail = new Map<string, string>();

  for (const { password, ...eachUser } of usersSeedData) {
    // Сырой пароль из сид-данных хешируем ровно как AuthService.register.
    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const userData = { ...eachUser, passwordHash };

    const user = await prisma.user.upsert({
      where: {
        email: eachUser.email,
      },
      update: userData,
      create: userData,
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

  for (const eachProfile of profilesSeedData) {
    const userId = userIdByEmail.get(eachProfile.email);

    await prisma.profile.upsert({
      where: {
        email: eachProfile.email,
      },
      update: {
        ...eachProfile,
        userId,
      },
      create: {
        ...eachProfile,
        userId,
      },
    });
  }

  console.log(`Seeded ${userIdByEmail.size} users`);
  console.log(`Seeded ${sessionsSeedData.length} sessions`);
  console.log(`Seeded ${participantsSeedData.length} session participants`);
  console.log(`Seeded ${profilesSeedData.length} profiles`);
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
