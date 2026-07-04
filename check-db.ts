import { prisma } from './lib/prisma';

async function check() {
  const users = await prisma.user.findMany({
    include: {
      OrganizationMember: true,
      AuthAccount: true
    }
  });
  console.dir(users, { depth: null });
}
check();
