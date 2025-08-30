import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/db';
import { settings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema for validating settings update
const updateSettingsSchema = z.object({
  currency: z.string().min(3).max(3).optional(), // ISO currency codes (DKK, EUR, USD)
  currencySymbol: z.string().min(1).max(3).optional(),
  currencyPosition: z.enum(['left', 'right', 'left_space', 'right_space']).optional(),
  productsPerPage: z.number().min(1).max(100).optional(),
  defaultViewMode: z.enum(['grid', 'list']).optional(),
});

/**
 * GET /api/settings/user
 * Get user settings
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      console.log('User not found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user settings or create default
    let [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, user.id))
      .limit(1);

    // If no settings exist, create defaults
    if (!userSettings) {
      console.log('Creating default settings for user:', user.id);
      [userSettings] = await db
        .insert(settings)
        .values({
          userId: user.id,
          currency: 'DKK',
          currencySymbol: 'kr',
          currencyPosition: 'right_space',
          productsPerPage: '24',
          defaultViewMode: 'grid',
        })
        .returning();
    }

    return NextResponse.json({
      currency: userSettings.currency,
      currencySymbol: userSettings.currencySymbol,
      currencyPosition: userSettings.currencyPosition,
      productsPerPage: parseInt(userSettings.productsPerPage || '24'),
      defaultViewMode: userSettings.defaultViewMode,
    });
  } catch (error: unknown) {
    console.error('Failed to get user settings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/user
 * Update user settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Prepare update data - only include defined fields
    const updateData: Record<string, string | number | Date> = {};
    
    if (validatedData.currency !== undefined) {
      updateData.currency = validatedData.currency;
    }
    if (validatedData.currencySymbol !== undefined) {
      updateData.currencySymbol = validatedData.currencySymbol;
    }
    if (validatedData.currencyPosition !== undefined) {
      updateData.currencyPosition = validatedData.currencyPosition;
    }
    if (validatedData.productsPerPage !== undefined) {
      updateData.productsPerPage = validatedData.productsPerPage.toString();
    }
    if (validatedData.defaultViewMode !== undefined) {
      updateData.defaultViewMode = validatedData.defaultViewMode;
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update or create settings
    const [updatedSettings] = await db
      .insert(settings)
      .values({
        userId: user.id,
        currency: validatedData.currency || 'DKK',
        currencySymbol: validatedData.currencySymbol || 'kr',
        currencyPosition: validatedData.currencyPosition || 'right_space',
        productsPerPage: validatedData.productsPerPage?.toString() || '24',
        defaultViewMode: validatedData.defaultViewMode || 'grid',
      })
      .onConflictDoUpdate({
        target: [settings.userId],
        set: updateData,
      })
      .returning();

    return NextResponse.json({
      currency: updatedSettings.currency,
      currencySymbol: updatedSettings.currencySymbol,
      currencyPosition: updatedSettings.currencyPosition,
      productsPerPage: parseInt(updatedSettings.productsPerPage || '24'),
      defaultViewMode: updatedSettings.defaultViewMode,
    });
  } catch (error: unknown) {
    console.error('Failed to update user settings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
