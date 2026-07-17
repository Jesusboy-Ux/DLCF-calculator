import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Usage: node prisma/promote-admin.js you@example.com
const email = process.argv[2];

async function main() {
  if (!email) {
    console.log("Usage: node prisma/promote-admin.js youremail@example.com");
    return;
  }
  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });
  console.log(`${user.email} is now an ADMIN.`);
}

main()
  .catch((e) => console.error("Failed:", e.message))
  .finally(() => prisma.$disconnect());
