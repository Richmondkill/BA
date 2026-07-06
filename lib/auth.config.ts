import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

/**
 * Edge-safe Auth.js config. Contains NO Prisma / bcrypt imports so it can run
 * inside middleware. The Credentials provider (which needs the DB) is added
 * only in lib/auth.ts, which runs in the Node runtime.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/admin") || pathname.startsWith("/client");
      if (isProtected) return isLoggedIn; // redirects to signIn page when false
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
