import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// Setup WebSockets for Neon
neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not defined in the environment. Please check Vercel Environment Variables."
    );
  }
  const pool = new Pool({ connectionString });
  // Pool types might mismatch between @neondatabase/serverless and @prisma/adapter-neon
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
