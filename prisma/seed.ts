import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const userData = [
  {
    username: 'Alice',
    email: 'alice@prisma.io',
  },
  {
    username: 'Nilu',
    email: 'nilu@prisma.io',
  },
  {
    username: 'Mahmoud',
    email: 'mahmoud@prisma.io',
  },
] satisfies Prisma.UserCreateInput[];

async function main() {
  console.log(`Start seeding ...`);
  for (const u of userData) {
    const user = await prisma.user.create({
      data: u,
    });
    console.log(`Created user with id: ${user.id}`);
  }
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
