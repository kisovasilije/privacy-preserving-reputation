import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { environment } from '../config/env';

const adapter = new PrismaPg({ connectionString: environment.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  // Query parameters may contain proofs and public signals, so do not log them.
  log: ['error', 'warn'],
});
