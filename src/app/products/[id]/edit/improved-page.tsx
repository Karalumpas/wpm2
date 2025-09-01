import { notFound } from 'next/navigation';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ImprovedProductEditor from '../components/ImprovedProductEditor';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ImprovedEditProductPage({ params }: PageProps) {
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return notFound();

  const dimensions = (product.dimensions || {}) as {
    length?: string;
    width?: string;
    height?: string;
  };

  const initial = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    basePrice: product.basePrice ? String(product.basePrice) : null,
    regularPrice: product.regularPrice ? String(product.regularPrice) : null,
    salePrice: product.salePrice ? String(product.salePrice) : null,
    status: product.status as 'published' | 'draft' | 'private',
    type: product.type as 'simple' | 'variable' | 'grouped',
    stockStatus: product.stockStatus ?? null,
    dimensions,
    description: product.description ?? null,
    shortDescription: product.shortDescription ?? null,
  } as const;

  return <ImprovedProductEditor initial={initial} />;
}
