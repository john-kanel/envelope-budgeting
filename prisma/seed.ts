import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "demo@envelope.local";
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  const categoryNames = [
    "Housing",
    "Transportation",
    "Food",
    "Utilities",
    "Health",
    "Personal",
  ];

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: {
        userId_name: { userId: user.id, name },
      },
      update: {},
      create: {
        userId: user.id,
        name,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
