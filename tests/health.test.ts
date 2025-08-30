import { describe, it, expect, vi } from 'vitest';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    execute: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: vi.fn(),
}));

// Import after mocking
const { GET } = await import('@/app/api/health/route');

describe('/api/health', () => {
  it('should return healthy status when database is accessible', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.db).toBe('ok');
    expect(data.version).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it('should return error status when database is not accessible', async () => {
    const mockDb = vi.mocked(await import('@/db')).db;
    mockDb.execute.mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.status).toBe('error');
    expect(data.db).toBe('error');
    expect(data.error).toBe('Database connection failed');
  });
});
