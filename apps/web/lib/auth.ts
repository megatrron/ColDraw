/* eslint-disable turbo/no-undeclared-env-vars */
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/db/config";
import { hash, compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const { email, password, name } = credentials ?? {};
        if (!email || !password) return null;
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });
          if (existingUser?.password) {
            const isValid = await compare(password, existingUser.password);
            if (!isValid) return null;

            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
            };
          }
        } catch {
          // Sign-up fallback (optional, use with caution)
          const hashedPassword = await hash(password, 10);
          const newUser = await prisma.user.create({
            data: {
              email,
              name: name || email.split("@")[0],
              password: hashedPassword,
            },
          });

          return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.uid,
      },
    }),
    jwt: ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
};
