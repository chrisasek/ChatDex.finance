import { getSession } from '@/lib/session';
import { env } from '@/lib/env';
import { getClaimService } from '@/lib/whatsapp-runtime';
import { ClaimReview } from './claim-review';
import styles from './claim.module.css';

export const dynamic = 'force-dynamic';

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getClaimService().resolve(token);
  if (result.status !== 'pending') {
    const title = result.status === 'claimed' ? 'This claim was collected' : result.status === 'expired' ? 'This claim has expired' : 'This claim is unavailable';
    const detail = result.status === 'claimed' ? 'A claim can be completed only once.' : result.status === 'expired' ? 'Ask the sender to create a new claim.' : 'Check the private link and try again.';
    return <main className={styles.page}><section className={styles.shell}><header><span className={styles.mark}>C</span><div><b>ChatDex</b><small>Private claim</small></div><span className={styles.demo}>DEMO</span></header><div className={styles.content}><p className={styles.eyebrow}>Claim status</p><h1>{title}</h1><div className={styles.notice}>{detail} No demo funds were moved.</div><a className={styles.secondary} href="/app">Return to ChatDex</a></div></section></main>;
  }
  const session = await getSession();
  const preview = {
    reference: `CLM-${result.claim.id.slice(0, 8).toUpperCase()}`,
    senderName: result.claim.senderName ?? 'A ChatDex user', amount: result.claim.amount,
    currency: result.claim.currency, expiresAt: result.claim.expiresAt,
    canClaim: Boolean(session && session.userId !== result.claim.senderId),
    signedInAsSender: Boolean(session && session.userId === result.claim.senderId),
    demoMode: env.DEMO_MODE === 'true'
  };
  return <ClaimReview token={token} preview={preview} />;
}
