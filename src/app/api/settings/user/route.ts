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
  currencyPosition: z
    .enum(['left', 'right', 'left_space', 'right_space'])
    .optional(),
  productsPerPage: z.number().min(1).max(100).optional(),
  defaultViewMode: z.enum(['grid', 'list']).optional(),
  theme: z.enum(['ocean', 'sunset', 'forest', 'royal', 'neutral', 'midnight', 'emerald']).optional(),
  colorMode: z.enum(['light', 'dark', 'auto']).optional(),
  font: z.enum(['sans', 'serif', 'mono']).optional(),
  largeText: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  compactMode: z.boolean().optional(),
});

/**
 * GET /api/settings/user
 * Get user settings
 */
export async function GET() {
  try {
    // Check authentication - temporarily disabled for testing
    // const session = await auth();
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Use temporary settings for testing
    const defaultSettings = {
      currency: 'DKK',
      currencySymbol: 'kr',
      currencyPosition: 'right_space' as const,
      productsPerPage: 25,
      defaultViewMode: 'grid' as const,
      theme: 'ocean' as const,
      colorMode: 'auto' as const,
      font: 'sans' as const,
      largeText: false,
      reducedMotion: false,
      compactMode: false,
    };

    return NextResponse.json(defaultSettings);
  } catch (error: unknown) {
    console.error('Failed to get user settings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
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
    // Check authentication - temporarily disabled for testing
    // const session = await auth();
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // For testing, just return the updated settings
    const updatedSettings = {
      currency: validatedData.currency || 'DKK',
      currencySymbol: validatedData.currencySymbol || 'kr',
      currencyPosition: validatedData.currencyPosition || 'right_space',
      productsPerPage: validatedData.productsPerPage || 25,
      defaultViewMode: validatedData.defaultViewMode || 'grid',
      theme: validatedData.theme || 'ocean',
      font: validatedData.font || 'sans',
      largeText: validatedData.largeText ?? false,
    };

    return NextResponse.json(updatedSettings);
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
