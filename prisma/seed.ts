import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const password = await hashPassword("admin");

  await prisma.user.upsert({
    where: { email: "admin" },
    update: {
      firstName: "Admin",
      lastName: "User",
      age: 30,
      password,
    },
    create: {
      firstName: "Admin",
      lastName: "User",
      email: "admin",
      age: 30,
      password,
    },
  });

  console.log("Seeded admin user (email: admin / password: admin)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
