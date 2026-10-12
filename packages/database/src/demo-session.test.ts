import { describe, expect, it, vi } from 'vitest';
import { PostgresDemoSessionRepository } from './index';

describe('PostgresDemoSessionRepository', () => {
  it('creates an isolated user and seeded NVDA position in one transaction', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const release = vi.fn();
    const repository = new PostgresDemoSessionRepository({ connect: async () => ({ query, release }) } as never);

    const userId = await repository.createFresh();

    expect(userId).toMatch(/^[0-9a-f-]{36}$/);
    expect(query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/).slice(0, 3).join(' '))).toEqual([
      'BEGIN', 'INSERT INTO users', 'INSERT INTO positions', 'COMMIT'
    ]);
    expect(query.mock.calls[1][1]).toEqual([userId, `demo:${userId}`]);
    expect(query.mock.calls[2][1]).toEqual([userId]);
    expect(release).toHaveBeenCalledOnce();
  });

  it('rolls back and releases the connection when seeding fails', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error('seed failed'))
      .mockResolvedValueOnce({ rows: [] });
    const release = vi.fn();
    const repository = new PostgresDemoSessionRepository({ connect: async () => ({ query, release }) } as never);

    await expect(repository.createFresh()).rejects.toThrow('seed failed');
    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(release).toHaveBeenCalledOnce();
  });
});
