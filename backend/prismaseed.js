import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Every grading scale a school might use — seeded once, safe to re-run.
const SYSTEMS = [
  {
    name: "5.0 Scale",
    maxPoint: 5,
    scales: [
      { letter: "A", point: 5 },
      { letter: "B", point: 4 },
      { letter: "C", point: 3 },
      { letter: "D", point: 2 },
      { letter: "E", point: 1 },
      { letter: "F", point: 0 },
    ],
  },
  {
    name: "4.0 Scale",
    maxPoint: 4,
    scales: [
      { letter: "A", point: 4 },
      { letter: "B", point: 3 },
      { letter: "C", point: 2 },
      { letter: "D", point: 1 },
      { letter: "F", point: 0 },
    ],
  },
  {
    name: "7.0 Scale",
    maxPoint: 7,
    scales: [
      { letter: "A+", point: 7 },
      { letter: "A", point: 6 },
      { letter: "B", point: 5 },
      { letter: "C", point: 4 },
      { letter: "D", point: 3 },
      { letter: "E", point: 2 },
      { letter: "F", point: 0 },
    ],
  },
];

async function main() {
  for (const system of SYSTEMS) {
    const existing = await prisma.gradeSystem.findFirst({ where: { name: system.name } });
    if (existing) {
      console.log(`${system.name} already seeded, skipping.`);
      continue;
    }
    await prisma.gradeSystem.create({
      data: {
        name: system.name,
        maxPoint: system.maxPoint,
        scales: { create: system.scales },
      },
    });
    console.log(`Seeded ${system.name}.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
