import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const found = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // To prevent user enumeration, always return 200
    if (!found.length) {
      return NextResponse.json({ ok: true });
    }

    const userId = found[0].id;
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await db.insert(passwordResetTokens).values({ userId, token, expiresAt });

    // In production, you would email the token link to the user.
    // For development, we return the token so it can be used immediately.
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

