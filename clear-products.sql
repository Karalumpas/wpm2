-- Clear all product data to start fresh
DELETE FROM product_variants;
DELETE FROM product_categories; 
DELETE FROM products;

-- Check the counts
SELECT 'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'product_variants' as table_name, COUNT(*) as count FROM product_variants
UNION ALL  
SELECT 'product_categories' as table_name, COUNT(*) as count FROM product_categories
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as count FROM categories;
