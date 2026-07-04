import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./lib/prisma";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        const account = await prisma.authAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "credentials",
              providerAccountId: credentials.email as string,
            },
          },
          include: { User: true },
        });

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        
        // Ensure we have DB id for Google logins, where user.id might be Google's sub
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
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
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
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
