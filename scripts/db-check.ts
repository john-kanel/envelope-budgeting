import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

async function main() {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    console.error("Missing environment variables:", missing.join(", "));
    process.exit(1);
  }

  console.log("Environment variables OK");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.$queryRaw`SELECT 1`;

    const [users, categories, expenses, incomes, goals] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.expense.count(),
      prisma.income.count(),
      prisma.goal.count(),
    ]);

    console.log("Database connected.");
    console.log("Users:", users);
    console.log("Categories:", categories);
    console.log("Expenses:", expenses);
    console.log("Incomes:", incomes);
    console.log("Goals:", goals);
  } catch (error) {
    console.error("Database connection failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
