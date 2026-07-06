import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-safe NextAuth instance for middleware (no Credentials/Prisma).
export const { auth } = NextAuth(authConfig);
