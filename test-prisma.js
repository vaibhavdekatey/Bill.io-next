const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient();
  console.log("Success with empty");
} catch(e) {
  console.error("Empty failed:", e.message);
  try {
    const prisma2 = new PrismaClient({ log: ['info'] });
    console.log("Success with non-empty");
  } catch(e2) {
    console.error("Non-empty failed:", e2.message);
  }
}
