import { PrismaClient } from "@prisma/client";

// One Prisma client per process — creating a new one per request exhausts
// your DB connection pool fast. Every route file imports this same instance.
export const prisma = new PrismaClient();
