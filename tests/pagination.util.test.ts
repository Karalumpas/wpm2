import { describe, it, expect } from 'vitest';
import {
  encodeCursor,
  decodeCursor,
  buildCursorCondition,
  buildOrderClause,
  generateNextCursor,
  checkHasMore,
} from '@/lib/utils/pagination';

describe('Pagination utilities', () => {
  describe('encodeCursor and decodeCursor', () => {
    it('should encode and decode cursor data correctly', () => {
      const cursorData = {
        updatedAt: '2025-08-28T10:15:00.000Z',
        id: 'test-uuid-123',
      };

      const encoded = encodeCursor(cursorData);
      expect(encoded).toBeTypeOf('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual(cursorData);
    });

    it('should handle special characters in cursor data', () => {
      const cursorData = {
        updatedAt: '2025-08-28T10:15:00.000Z',
        id: 'test-uuid-with-special-chars-äöü',
      };

      const encoded = encodeCursor(cursorData);
      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual(cursorData);
    });

    it('should throw error for invalid cursor format', () => {
      expect(() => decodeCursor('invalid-cursor')).toThrow(
        'Invalid cursor format'
      );
      expect(() => decodeCursor('dGVzdA==')).toThrow('Invalid cursor format'); // base64 but invalid JSON
    });

    it('should throw error for cursor missing required fields', () => {
      const invalidCursor = btoa(JSON.stringify({ onlyId: 'test' }));
      expect(() => decodeCursor(invalidCursor)).toThrow(
        'Invalid cursor format'
      );
    });
  });

  describe('buildCursorCondition', () => {
    const testCursor = {
      updatedAt: '2025-08-28T10:15:00.000Z',
      id: 'test-uuid-123',
    };

    it('should build DESC condition for updatedAt sort', () => {
      const result = buildCursorCondition(testCursor, 'updatedAt', 'desc');

      expect(result.condition).toBe('(updated_at, id) < ($1, $2)');
      expect(result.params).toHaveLength(2);
      expect(result.params[0]).toBeInstanceOf(Date);
      expect(result.params[1]).toBe('test-uuid-123');
    });

    it('should build ASC condition for updatedAt sort', () => {
      const result = buildCursorCondition(testCursor, 'updatedAt', 'asc');

      expect(result.condition).toBe('(updated_at, id) > ($1, $2)');
      expect(result.params).toHaveLength(2);
    });

    it('should handle other sort fields', () => {
      const result = buildCursorCondition(testCursor, 'name', 'desc');

      // For now, fallback to updatedAt-based cursor
      expect(result.condition).toBe('(updated_at, id) < ($1, $2)');
      expect(result.params).toHaveLength(2);
    });

    it('should throw error for unsupported sort fields', () => {
      expect(() =>
        buildCursorCondition(testCursor, 'unsupported_field', 'desc')
      ).toThrow('Unsupported sort field: unsupported_field');
    });
  });

  describe('buildOrderClause', () => {
    it('should build correct ORDER BY for updatedAt DESC', () => {
      const result = buildOrderClause('updatedAt', 'desc');
      expect(result).toBe('updated_at DESC, id DESC');
    });

    it('should build correct ORDER BY for name ASC', () => {
      const result = buildOrderClause('name', 'asc');
      expect(result).toBe('name ASC, id ASC');
    });

    it('should build correct ORDER BY for basePrice DESC', () => {
      const result = buildOrderClause('basePrice', 'desc');
      expect(result).toBe('base_price DESC, id DESC');
    });

    it('should throw error for unsupported sort fields', () => {
      expect(() => buildOrderClause('unsupported_field', 'desc')).toThrow(
        'Unsupported sort field: unsupported_field'
      );
    });
  });

  describe('generateNextCursor', () => {
    it('should generate cursor from last item', () => {
      const lastItem = {
        updatedAt: '2025-08-28T10:15:00.000Z',
        id: 'test-uuid-123',
      };

      const cursor = generateNextCursor(lastItem);
      expect(cursor).toBeTypeOf('string');

      const decoded = decodeCursor(cursor);
      expect(decoded).toEqual(lastItem);
    });
  });

  describe('checkHasMore', () => {
    it('should return hasMore=true when results exceed limit', () => {
      const results = [1, 2, 3, 4, 5, 6]; // 6 items
      const limit = 5;

      const { items, hasMore } = checkHasMore(results, limit);

      expect(hasMore).toBe(true);
      expect(items).toHaveLength(5);
      expect(items).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return hasMore=false when results equal limit', () => {
      const results = [1, 2, 3, 4, 5]; // 5 items
      const limit = 5;

      const { items, hasMore } = checkHasMore(results, limit);

      expect(hasMore).toBe(false);
      expect(items).toHaveLength(5);
      expect(items).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return hasMore=false when results less than limit', () => {
      const results = [1, 2, 3]; // 3 items
      const limit = 5;

      const { items, hasMore } = checkHasMore(results, limit);

      expect(hasMore).toBe(false);
      expect(items).toHaveLength(3);
      expect(items).toEqual([1, 2, 3]);
    });

    it('should handle empty results', () => {
      const results: unknown[] = [];
      const limit = 5;

      const { items, hasMore } = checkHasMore(results, limit);

      expect(hasMore).toBe(false);
      expect(items).toHaveLength(0);
    });
  });

  describe('Deterministic pagination', () => {
    it('should ensure deterministic sorting with secondary ID field', () => {
      // Test that ORDER BY always includes id as secondary sort
      const orderClauses = [
        buildOrderClause('updatedAt', 'desc'),
        buildOrderClause('name', 'asc'),
        buildOrderClause('basePrice', 'desc'),
        buildOrderClause('sku', 'asc'),
      ];

      orderClauses.forEach((clause) => {
        expect(clause).toMatch(/,\s*id\s+(ASC|DESC)$/);
      });
    });

    it('should generate consistent cursors for same input', () => {
      const item = {
        updatedAt: '2025-08-28T10:15:00.000Z',
        id: 'test-uuid-123',
      };

      const cursor1 = generateNextCursor(item);
      const cursor2 = generateNextCursor(item);

      expect(cursor1).toBe(cursor2);
    });
  });
});
