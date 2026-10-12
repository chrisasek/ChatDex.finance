import 'server-only';

type Bucket = { count: number; resetsAt: number };
const buckets = new Map<string, Bucket>();

export function allowRequest(request: Request, scope: string, limit: number, windowMs = 60_000) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const client = forwarded || request.headers.get('cf-connecting-ip') || 'unknown';
  const key = `${scope}:${client}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetsAt <= now) {
    buckets.set(key, { count: 1, resetsAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
