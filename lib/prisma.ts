import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Strip quotes if they were accidentally copied into Vercel
  let url = process.env.DATABASE_URL || "";
  if (url.startsWith('"') && url.endsWith('"')) {
    url = url.slice(1, -1);
  }
  
  if (!url || !url.startsWith('postgres')) {
    throw new Error(
      "DATABASE_URL is missing or invalid. Please check Vercel Environment Variables. Value was: " + url
    );
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
