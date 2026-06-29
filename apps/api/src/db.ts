import { PrismaClient } from "@prisma/client";

// Single Prisma client for the service. broccoli-api is the only writer that
// owns the schema; see PRD §4.
export const prisma = new PrismaClient();
