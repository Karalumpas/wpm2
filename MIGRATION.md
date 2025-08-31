# Migration Notes

This document highlights changes that may require action when upgrading.

## Image Normalization & Gallery Backfill

- Variant images are now normalized to MinIO during WooCommerce sync and saved as central URLs on each variant.
- If a product has no gallery, variant images (deduped by filename) are used to backfill the product gallery, and are registered in `media_files`.

### What you need to do

1. Ensure `.env.local` has a valid base64 32‑byte `ENCRYPTION_KEY` and MinIO variables.
2. Run a background sync for each shop to normalize images:
   - `POST /api/shops/sync/background` with `{ "shopId": "<id>" }`
   - Poll `GET /api/shops/sync/background?jobId=<jobId>`
3. Verify product galleries now include variant images where appropriate.

## Product Details Lightbox Removed

- The product details page uses a modern swipe slider (no lightbox). This avoids gesture conflicts and improves performance.

No database migrations are required for the above.
