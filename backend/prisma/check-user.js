import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const email = process.argv[2];

async function main() {
  if (!email) {
    console.log("Usage: node prisma/check-user.js youremail@example.com");
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`No user found with email: ${email}`);
  } else {
    console.log("Found user:", { email: user.email, role: user.role, id: user.id });
  }
}

main()
  .catch((e) => console.error("Failed:", e.message))
  .finally(() => prisma.$disconnect());
