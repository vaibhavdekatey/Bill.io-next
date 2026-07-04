import { prisma } from './lib/prisma';

async function main() {
  console.log("Testing connection with pg adapter...");
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Success! Found users:", users.length);
  } catch (err: any) {
    console.error("Failed!", err.message);
  }
}
main();
