-- Add pg_trgm extension for better text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes for text search on product fields
CREATE INDEX CONCURRENTLY products_name_trgm_idx ON products USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY products_sku_trgm_idx ON products USING gin (sku gin_trgm_ops);
