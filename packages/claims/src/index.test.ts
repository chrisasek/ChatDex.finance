import { describe, expect, it } from 'vitest';
import { ClaimService, MemoryClaimRepository } from './index';

describe('ClaimService', () => {
  it('enforces opaque, expiring, one-time claims', async () => {
    let now = new Date('2026-10-08T08:00:00Z');
    const service = new ClaimService('claim-secret-at-least-32-characters-long', new MemoryClaimRepository(), () => now);
    const created = await service.create({ senderId: 'sender', amount: '25', currency: 'USD', ttlMinutes: 10 });
    expect(created.token).not.toContain('25');
    expect((await service.resolve(created.token)).status).toBe('pending');
    expect((await service.claim(created.token, 'sender')).status).toBe('unavailable');
    expect((await service.claim(created.token, 'recipient')).status).toBe('claimed');
    expect((await service.claim(created.token, 'other')).status).toBe('claimed');
    now = new Date('2026-10-08T09:00:00Z');
    const expiring = await service.create({ senderId: 'sender', amount: '5', currency: 'USD', ttlMinutes: 1 });
    now = new Date('2026-10-08T09:02:00Z');
    expect((await service.resolve(expiring.token)).status).toBe('expired');
  });

  it('rejects invalid amounts and tampered tokens', async () => {
    const service = new ClaimService('claim-secret-at-least-32-characters-long', new MemoryClaimRepository());
    await expect(service.create({ senderId: 'sender', amount: '-1', currency: 'USD' })).rejects.toThrow();
    expect((await service.resolve('tampered.token')).status).toBe('invalid');
  });
});
