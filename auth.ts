import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./lib/prisma";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "f0003b860ab854fc98ef657bc08034db",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const input = (credentials.email as string).trim();

        // 1. Try exact match on providerAccountId
        let account = await prisma.authAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "credentials",
              providerAccountId: input,
            },
          },
          include: { User: true },
        });

        // 2. If not found, try case-insensitive lookup on providerAccountId or User email
        if (!account) {
          account = await prisma.authAccount.findFirst({
            where: {
              provider: "credentials",
              OR: [
                { providerAccountId: { equals: input, mode: "insensitive" } },
                { User: { email: { equals: input, mode: "insensitive" } } },
              ],
            },
            include: { User: true },
          });
        }

        if (!account || !account.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          account.passwordHash
        );
        if (!isValid) return null;

        return {
          id: account.User.id,
          email: account.User.email,
          name: account.User.name,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        let authAccount = await prisma.authAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!authAccount) {
          let dbUser = await prisma.user.findUnique({ where: { email } });
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                id: randomUUID(),
                email,
                name: user.name ?? null,
              },
            });
          }
          await prisma.authAccount.create({
            data: {
              id: randomUUID(),
              userId: dbUser.id,
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        
        // Ensure we have DB id for Google logins, where user.id might be Google's sub
        const dbUser = await prisma.user.findUnique({ where: { email: token.email! } });
        if (dbUser) {
          token.id = dbUser.id;
          if (dbUser.name) token.name = dbUser.name;
          // @ts-ignore
          token.phoneNumber = dbUser.phoneNumber;
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

      if (trigger === "update" && token.id) {
        const [dbUser, orgMember] = await Promise.all([
          prisma.user.findUnique({ where: { id: token.id as string } }),
          prisma.organizationMember.findFirst({
            where: { userId: token.id as string },
            include: { Organization: true },
          }),
        ]);
        if (dbUser) {
          if (dbUser.name) token.name = dbUser.name;
          // @ts-ignore
          token.phoneNumber = dbUser.phoneNumber;
        }
        if (orgMember) {
          token.orgId = orgMember.organizationId;
          token.orgTitle = orgMember.title;
          token.orgRole = orgMember.role;
          token.organization = orgMember;
          token.onBoardingComplete = true;
        }
      }

      // If token says onboarding is not complete, double check the DB
      // just in case they completed it in another tab or the session wasn't updated
      if (!token.onBoardingComplete && token.id) {
        const orgMember = await prisma.organizationMember.findFirst({
          where: { userId: token.id as string },
          include: { Organization: true },
        });
        if (orgMember) {
          token.orgId = orgMember.organizationId;
          token.orgTitle = orgMember.title;
          token.orgRole = orgMember.role;
          token.organization = orgMember;
          token.onBoardingComplete = true;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        // @ts-ignore
        session.user.phoneNumber = token.phoneNumber as string;
        // @ts-ignore
        session.user.orgId = token.orgId as string;
        // @ts-ignore
        session.user.orgTitle = token.orgTitle as string;
        // @ts-ignore
        session.user.orgRole = token.orgRole as string;
        // @ts-ignore
        session.user.organization = token.organization as any;
        // @ts-ignore
        session.user.onBoardingComplete = token.onBoardingComplete as boolean;
      }
      return session;
    },
  },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days — makes it a persistent cookie
      },
    },
  },
  pages: {
    signIn: "/login",
  },
});
