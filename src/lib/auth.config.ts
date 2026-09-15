import type { NextAuthConfig } from "next-auth";

// Edge-safe config shared between middleware and the full server-side auth
// instance. Providers that depend on Node APIs (e.g. our Credentials
// provider, which hashes passwords with node:crypto) live only in auth.ts so
// they never get bundled into the edge middleware.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) return isLoggedIn;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
