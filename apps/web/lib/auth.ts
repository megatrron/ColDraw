/* eslint-disable turbo/no-undeclared-env-vars */
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/db/config";
import { hash, compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
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
          console.log('Attempting to authenticate user:', email);
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });
          console.log('User found:', !!existingUser);

          // Existing user with credentials flow
          if (existingUser && existingUser.password) {
            const isValid = await compare(password, existingUser.password);
            console.log('Password validation result:', isValid);
            if (!isValid) return null;
            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
            };
          }

          // Prevent logging in with credentials for OAuth-only accounts
          if (existingUser && !existingUser.password) {
            return null;
          }

          // Create a new user (sign-up) when no user exists yet
          const hashedPassword = await hash(password, 10);
          const newUser = await prisma.user.create({
            data: {
              email,
              name:
                name ||
                (typeof email === "string" ? email.split("@")[0] : "User"),
              password: hashedPassword,
            },
          });
          return { id: newUser.id, name: newUser.name, email: newUser.email };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
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
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Important for Vercel deployment
};
