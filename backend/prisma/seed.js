import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.gradeSystem.findFirst({ where: { name: "5.0 Scale" } });
  if (existing) {
    console.log("Grade system already seeded, skipping.");
    return;
  }

  await prisma.gradeSystem.create({
    data: {
      name: "5.0 Scale",
      maxPoint: 5,
      scales: {
        create: [
          { letter: "A", point: 5 },
          { letter: "B", point: 4 },
          { letter: "C", point: 3 },
          { letter: "D", point: 2 },
          { letter: "E", point: 1 },
          { letter: "F", point: 0 },
        ],
      },
    },
  });

  console.log("Seeded default 5.0 grading scale.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
