import { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      avatar: string | null;
      organizationId: string;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    avatar: string | null;
    organizationId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    avatar: string | null;
    organizationId: string;
  }
}

