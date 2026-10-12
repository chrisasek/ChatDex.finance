import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type ClaimRecord = {
  id: string; tokenHash: string; senderId: string; recipientPhone?: string;
  amount: string; currency: string; status: 'pending' | 'claimed' | 'expired' | 'cancelled';
  expiresAt: string; claimedBy?: string; claimedAt?: string; senderName?: string;
};

export interface ClaimRepository {
  create(record: ClaimRecord): Promise<void>;
  find(tokenHash: string): Promise<ClaimRecord | null>;
  claim(tokenHash: string, userId: string, now: Date): Promise<ClaimRecord | null>;
}

export class MemoryClaimRepository implements ClaimRepository {
  private readonly records = new Map<string, ClaimRecord>();
  async create(record: ClaimRecord) { this.records.set(record.tokenHash, structuredClone(record)); }
  async find(tokenHash: string) { return structuredClone(this.records.get(tokenHash) ?? null); }
  async claim(tokenHash: string, userId: string, now: Date) {
    const record = this.records.get(tokenHash);
    if (!record || record.status !== 'pending' || new Date(record.expiresAt) <= now) return null;
    record.status = 'claimed'; record.claimedBy = userId; record.claimedAt = now.toISOString();
    return structuredClone(record);
  }
}

export class ClaimService {
  constructor(private readonly secret: string, private readonly repository: ClaimRepository, private readonly now = () => new Date()) {
    if (secret.length < 32) throw new Error('Claim token secret must contain at least 32 characters');
  }

  async create(input: { senderId: string; recipientPhone?: string; amount: string; currency: string; ttlMinutes?: number }) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(input.amount) || Number(input.amount) <= 0) throw new Error('Invalid claim amount');
    if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error('Invalid claim currency');
    const body = randomBytes(32).toString('base64url');
    const signature = createHmac('sha256', this.secret).update(body).digest('base64url');
    const token = `${body}.${signature}`;
    const record: ClaimRecord = {
      id: crypto.randomUUID(), tokenHash: createHash('sha256').update(token).digest('hex'),
      senderId: input.senderId, recipientPhone: input.recipientPhone,
      amount: Number(input.amount).toFixed(2), currency: input.currency, status: 'pending',
      expiresAt: new Date(this.now().getTime() + (input.ttlMinutes ?? 30) * 60_000).toISOString()
    };
    await this.repository.create(record);
    return { token, claim: record };
  }

  async resolve(token: string) {
    if (!this.valid(token)) return { status: 'invalid' as const };
    const record = await this.repository.find(createHash('sha256').update(token).digest('hex'));
    if (!record) return { status: 'invalid' as const };
    if (record.status !== 'pending' || new Date(record.expiresAt) <= this.now()) return { status: record.status === 'claimed' ? 'claimed' as const : 'expired' as const };
    return { status: 'pending' as const, claim: record };
  }

  async claim(token: string, userId: string) {
    const resolved = await this.resolve(token);
    if (resolved.status !== 'pending') return resolved;
    if (resolved.claim.senderId === userId) return { status: 'unavailable' as const };
    const record = await this.repository.claim(resolved.claim.tokenHash, userId, this.now());
    return record ? { status: 'claimed' as const, claim: record } : { status: 'unavailable' as const };
  }

  private valid(token: string) {
    const [body, supplied] = token.split('.');
    if (!body || !supplied) return false;
    const expected = createHmac('sha256', this.secret).update(body).digest('base64url');
    return supplied.length === expected.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  }
}
