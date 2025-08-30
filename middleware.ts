import { withAuth } from 'next-auth/middleware';

// Enforce authentication for all app routes, with explicit public exclusions.
export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ req, token }) => {
      const { pathname } = req.nextUrl;

      // Public routes that should not require auth
      const publicPrefixes = ['/api/auth', '/_next/static', '/_next/image'];
      const publicExact = ['/login', '/favicon.ico'];

      if (publicExact.includes(pathname)) return true;
      if (publicPrefixes.some((p) => pathname.startsWith(p))) return true;

      // Require auth everywhere else
      return !!token;
    },
  },
});

export const config = {
  // Match all paths; callback decides what to exclude
  matcher: ['/:path*'],
};
