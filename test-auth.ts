import { authConfig } from './auth-test'; // wait, auth.ts exports NextAuth directly

// let's just copy the callbacks logic to see what it does
import { prisma } from './lib/prisma';

async function test() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log("no user");

  const token: any = { email: user.email };
  
  // mock jwt callback
  console.log("Running mock JWT callback...");
  if (user) {
    token.id = user.id;
    
    const dbUser = await prisma.user.findUnique({ where: { email: token.email! } });
    if (dbUser) {
      token.id = dbUser.id;
    }

    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: token.id as string },
      include: { Organization: true },
    });
    token.orgId = orgMember?.organizationId;
    token.orgTitle = orgMember?.title;
    token.orgRole = orgMember?.role;
    token.organization = orgMember;
    token.onBoardingComplete = !!orgMember;
  }
  
  console.log("Token:", token);

  // mock session callback
  const session: any = { user: { name: user.name, email: user.email } };
  if (token && session.user) {
    session.user.id = token.id as string;
    session.user.orgId = token.orgId as string;
    session.user.orgTitle = token.orgTitle as string;
    session.user.orgRole = token.orgRole as string;
    session.user.organization = token.organization as any;
    session.user.onBoardingComplete = token.onBoardingComplete as boolean;
  }
  
  console.log("Session:", session);
}
test();
