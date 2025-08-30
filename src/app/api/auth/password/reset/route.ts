import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { token, password } = (await request.json()) as {
      token?: string;
      password?: string;
    };

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const matches = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!matches.length) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const userId = matches[0].userId;
    const passwordHash = await hashPassword(password);

    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    // Consume the token
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, matches[0].id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
