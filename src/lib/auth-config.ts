import NextAuth, { type NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';

// NextAuth v4-compatible configuration and helpers
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user.length) {
            return null;
          }

          const isValid = await verifyPassword(password, user[0].passwordHash);

          if (!isValid) {
            return null;
          }

          return {
            id: user[0].id,
            email: user[0].email,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user && typeof (user as { id?: unknown }).id === 'string') {
        token.id = (user as { id?: string }).id as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

// Route handlers for App Router (GET/POST)
const handler = NextAuth(authOptions);
export const GET = handler;
export const POST = handler;

// Maintain the previous import style used by route.ts
export const handlers = { GET, POST } as const;

// Server-side session helper used across RSC and Route Handlers
export function auth() {
  return getServerSession(authOptions);
}
