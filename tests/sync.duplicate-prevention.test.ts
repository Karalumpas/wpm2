import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { shops, products, productVariants } from '@/db/schema';

// Basic shop fixtures
const shopA = {
  id: 'shop-a',
  name: 'Shop A',
  url: 'https://shopa.example',
  consumerKeyEnc: 'key-a',
  consumerSecretEnc: 'secret-a',
};
const shopB = {
  id: 'shop-b',
  name: 'Shop B',
  url: 'https://shopb.example',
  consumerKeyEnc: 'key-b',
  consumerSecretEnc: 'secret-b',
};

describe('WooCommerce sync duplicate prevention', () => {
  beforeEach(async () => {
    // Clean relevant tables
    await db.delete(productVariants);
    await db.delete(products);
    await db.delete(shops);

    await db.insert(shops).values([shopA, shopB]);
  });

  it('prevents duplicate products within the same shop', async () => {
    await db.insert(products).values({
      id: 'prod-1',
      sku: 'SKU-1',
      name: 'Product 1',
      status: 'draft',
      type: 'simple',
      shopId: shopA.id,
      wooCommerceId: 'wc-1',
    });

    await expect(
      db.insert(products).values({
        id: 'prod-2',
        sku: 'SKU-2',
        name: 'Product 2',
        status: 'draft',
        type: 'simple',
        shopId: shopA.id,
        wooCommerceId: 'wc-1',
      })
    ).rejects.toThrow();

    await expect(
      db.insert(products).values({
        id: 'prod-3',
        sku: 'SKU-3',
        name: 'Product 3',
        status: 'draft',
        type: 'simple',
        shopId: shopB.id,
        wooCommerceId: 'wc-1',
      })
    ).resolves.toBeDefined();
  });

  it('prevents duplicate variants within the same shop', async () => {
    // Create products in each shop
    await db.insert(products).values([
      {
        id: 'prod-a',
        sku: 'SKU-A',
        name: 'Product A',
        status: 'draft',
        type: 'simple',
        shopId: shopA.id,
        wooCommerceId: 'wc-prod',
      },
      {
        id: 'prod-b',
        sku: 'SKU-B',
        name: 'Product B',
        status: 'draft',
        type: 'simple',
        shopId: shopB.id,
        wooCommerceId: 'wc-prod',
      },
    ]);

    await db.insert(productVariants).values({
      id: 'var-1',
      productId: 'prod-a',
      shopId: shopA.id,
      sku: 'VSKU-1',
      wooCommerceId: 'wc-var',
      attributes: {},
    });

    await expect(
      db.insert(productVariants).values({
        id: 'var-2',
        productId: 'prod-a',
        shopId: shopA.id,
        sku: 'VSKU-2',
        wooCommerceId: 'wc-var',
        attributes: {},
      })
    ).rejects.toThrow();

    await expect(
      db.insert(productVariants).values({
        id: 'var-3',
        productId: 'prod-b',
        shopId: shopB.id,
        sku: 'VSKU-3',
        wooCommerceId: 'wc-var',
        attributes: {},
      })
    ).resolves.toBeDefined();
  });
});
