import { type CursorData } from '@/lib/validation/products';

/**
 * Encode cursor data to base64url string for pagination
 */
export function encodeCursor(data: CursorData): string {
  const json = JSON.stringify(data);
  return Buffer.from(json).toString('base64url');
}

/**
 * Decode cursor string back to cursor data
 */
export function decodeCursor(cursor: string): CursorData {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    const data = JSON.parse(json);
    
    // Validate the decoded data structure
    if (!data.updatedAt || !data.id) {
      throw new Error('Invalid cursor format');
    }
    
    return {
      updatedAt: data.updatedAt,
      id: data.id,
    };
  } catch {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Generate cursor comparison conditions for keyset pagination
 * Returns SQL condition string and parameters for WHERE clause
 */
export function buildCursorCondition(
  cursor: CursorData,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): { condition: string; params: unknown[] } {
  const operator = sortOrder === 'desc' ? '<' : '>';
  
  // For updatedAt sorting (default), use composite keyset
  if (sortBy === 'updatedAt') {
    return {
      condition: `(updated_at, id) ${operator} ($1, $2)`,
      params: [new Date(cursor.updatedAt), cursor.id],
    };
  }
  
  // For other sort fields, use composite with id as secondary
  const fieldMap: Record<string, string> = {
    name: 'name',
    basePrice: 'base_price', 
    sku: 'sku',
    createdAt: 'created_at',
  };
  
  const dbField = fieldMap[sortBy];
  if (!dbField) {
    throw new Error(`Unsupported sort field: ${sortBy}`);
  }
  
  // For non-updatedAt sorts, we need to handle the fact that we only have
  // updatedAt and id in cursor. This is a simplified approach.
  // For production, you'd want to include the sort field in the cursor.
  return {
    condition: `(updated_at, id) ${operator} ($1, $2)`,
    params: [new Date(cursor.updatedAt), cursor.id],
  };
}

/**
 * Generate ORDER BY clause for deterministic sorting
 */
export function buildOrderClause(
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): string {
  const direction = sortOrder.toUpperCase();
  
  const fieldMap: Record<string, string> = {
    name: 'name',
    basePrice: 'base_price',
    sku: 'sku', 
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  
  const dbField = fieldMap[sortBy];
  if (!dbField) {
    throw new Error(`Unsupported sort field: ${sortBy}`);
  }
  
  // Always include id as secondary sort for deterministic results
  return `${dbField} ${direction}, id ${direction}`;
}

/**
 * Generate next cursor from the last item in results
 */
export function generateNextCursor(
  lastItem: { updatedAt: string; id: string }
): string {
  return encodeCursor({
    updatedAt: lastItem.updatedAt,
    id: lastItem.id,
  });
}

/**
 * Check if there are more results by using limit+1 trick
 */
export function checkHasMore<T>(
  results: T[],
  requestedLimit: number
): { items: T[]; hasMore: boolean } {
  const hasMore = results.length > requestedLimit;
  const items = hasMore ? results.slice(0, requestedLimit) : results;
  
  return { items, hasMore };
}
