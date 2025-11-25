import { compare, hash } from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true },
        });

        if (!user) {
          console.log(`❌ User not found: ${credentials.email}`);
          return null;
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);

        if (!isValid) {
          console.log(`❌ Invalid password for: ${credentials.email}`);
          return null;
        }

        // Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        console.log(`✅ Login successful: ${user.email} (${user.role})`);
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
        session.user.organizationId = token.organizationId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      organization: true,
    },
  });
}

export async function createUser(
  email: string,
  password: string,
  role: UserRole = "BD",
  organizationId: string
) {
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      organizationId,
    },
  });
}

export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

export function isManager(role: UserRole): boolean {
  return role === "MANAGER" || role === "ADMIN";
}

