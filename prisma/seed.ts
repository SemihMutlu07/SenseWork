import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin", 10);

  await prisma.user.upsert({
    where: { email: "admin" },
    update: {
      firstName: "Admin",
      lastName: "User",
      age: 30,
      password: passwordHash,
    },
    create: {
      firstName: "Admin",
      lastName: "User",
      email: "admin",
      age: 30,
      password: passwordHash,
    },
  });

  console.log("Seeded default user: username/email=admin, password=admin");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
