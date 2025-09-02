import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-utils';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
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

    // Get the original product
    const [originalProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!originalProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create a duplicate with modified name and new ID
    const duplicatedProduct = {
      ...originalProduct,
      id: undefined, // Let the database generate a new ID
      name: `${originalProduct.name} (kopi)`,
      sku: `${originalProduct.sku}-copy-${Date.now()}`,
      wooCommerceId: null, // Reset WooCommerce connection
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Remove undefined id field for insert
    const { id: _, ...productToInsert } = duplicatedProduct;

    // Insert the duplicate
    const [newProduct] = await db
      .insert(products)
      .values(productToInsert)
      .returning();

    return NextResponse.json({
      success: true,
      newProductId: newProduct.id,
      message: 'Produkt duplikeret succesfuldt',
    });
  } catch (error) {
    console.error('Error duplicating product:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate product' },
      { status: 500 }
    );
  }
}
