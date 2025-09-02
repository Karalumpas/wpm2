import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-utils';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { field, value } = body;

    if (!field || value === undefined) {
      return NextResponse.json({ error: 'Field and value are required' }, { status: 400 });
    }

    // Validate field and prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    switch (field) {
      case 'name':
        updateData.name = String(value);
        break;
      case 'basePrice':
        updateData.basePrice = value ? String(value) : null;
        break;
      case 'regularPrice':
        updateData.regularPrice = value ? String(value) : null;
        break;
      case 'salePrice':
        updateData.salePrice = value ? String(value) : null;
        break;
      case 'status':
        if (!['published', 'draft', 'private'].includes(value)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        updateData.status = value as 'published' | 'draft' | 'private';
        break;
      case 'type':
        if (!['simple', 'variable', 'grouped'].includes(value)) {
          return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
        updateData.type = value as 'simple' | 'variable' | 'grouped';
        break;
      case 'stockStatus':
        updateData.stockStatus = value;
        break;
      case 'shortDescription':
        updateData.shortDescription = value ? String(value) : null;
        break;
      case 'description':
        updateData.description = value ? String(value) : null;
        break;
      default:
        return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    // Update the product
    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${field} opdateret succesfuldt`,
      updatedField: field,
      newValue: value,
    });
  } catch (error) {
    console.error('Error updating product field:', error);
    return NextResponse.json(
      { error: 'Failed to update product field' },
      { status: 500 }
    );
  }
}
