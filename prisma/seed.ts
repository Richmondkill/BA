import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "super@bank.test";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "super1234";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Seeded super admin:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
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
