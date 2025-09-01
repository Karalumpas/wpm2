import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, productCategories } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { updateCategorySchema } from '@/lib/validation/categories';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateCategorySchema.parse(body);

    // Generate slug if provided name but no slug
    const slug = data.slug
      ? data.slug
      : data.name
        ? data.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
        : undefined;

    // Prevent self‑parenting
    if (data.parentId && data.parentId === id) {
      return NextResponse.json(
        { error: 'A category cannot be its own parent.' },
        { status: 400 }
      );
    }

    // Enforce unique (name + parentId) if name/parent changed
    if (data.name !== undefined || data.parentId !== undefined) {
      const current = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);
      if (!current.length)
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const nextParent =
        (data.parentId !== undefined
          ? data.parentId
          : (current[0].parentId as string | null)) ?? null;
      const nextName = data.name !== undefined ? data.name : current[0].name;

      // parent condition must allow NULL comparisons; construct conditional
      const parentCondition =
        nextParent === null
          ? sql`categories.parent_id IS NULL`
          : eq(categories.parentId, nextParent);

      const conflict = await db
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(eq(categories.name, nextName), parentCondition, sql`id <> ${id}`)
        )
        .limit(1);
      if (conflict.length) {
        return NextResponse.json(
          {
            error:
              'A category with this name already exists under the same parent.',
          },
          { status: 400 }
        );
      }

      // Prevent cycles: ensure nextParent is not a descendant of id
      if (nextParent) {
        let cursor: string | null = nextParent as string;
        const visited = new Set<string>();
        while (cursor) {
          if (visited.has(cursor)) break; // safety
          visited.add(cursor);
          if (cursor === id) {
            return NextResponse.json(
              { error: 'Invalid parent: would create a cycle.' },
              { status: 400 }
            );
          }
          const row = await db
            .select({ pid: categories.parentId })
            .from(categories)
            .where(eq(categories.id, cursor))
            .limit(1);
          cursor = (row[0]?.pid as string | null) ?? null;
        }
      }
    }

    const [updated] = await db
      .update(categories)
      .set({
        name: data.name,
        slug: slug,
        description: data.description,
        parentId: data.parentId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    let moveToCategoryId: string | undefined;
    try {
      const body = await _request.json();
      moveToCategoryId = body?.moveToCategoryId;
    } catch {}

    // If used by products, either move to target or block
    const refs = await db
      .select({ c: sql<number>`count(*)` })
      .from(productCategories)
      .where(eq(productCategories.categoryId, id));
    const countUsed = Number(refs[0]?.c || 0);
    if (countUsed > 0 && !moveToCategoryId) {
      return NextResponse.json(
        {
          error: `Category used by ${countUsed} products. Provide moveToCategoryId to migrate products before delete.`,
        },
        { status: 400 }
      );
    }
    if (countUsed > 0 && moveToCategoryId) {
      // Move associations, avoiding duplicates
      await db.execute(sql`
        INSERT INTO product_categories (product_id, category_id)
        SELECT product_id, ${moveToCategoryId}::uuid FROM product_categories WHERE category_id = ${id}::uuid
        ON CONFLICT (product_id, category_id) DO NOTHING
      `);
      await db.execute(
        sql`DELETE FROM product_categories WHERE category_id = ${id}::uuid`
      );
    }

    // Reparent children to this category's parent (or null)
    const parentRow = await db
      .select({ parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    const parentId = parentRow[0]?.parentId ?? null;
    await db
      .update(categories)
      .set({ parentId: parentId, updatedAt: new Date() })
      .where(eq(categories.parentId, id));

    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
