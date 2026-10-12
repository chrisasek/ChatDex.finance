import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getTradeHandoffService } from '@/lib/whatsapp-runtime';
import { ActionReview } from './action-review';
import styles from './action.module.css';

export const dynamic = 'force-dynamic';

export default async function ActionPage({ params }: PageProps<'/action/[token]'>) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();
  const session = await getSession();
  if (!session) {
    return <main className={styles.page}><section className={styles.stateCard}><span className={styles.demo}>DEMO</span><p className={styles.eyebrow}>Review & Buy</p><h1>Sign in to continue</h1><p>Verify access before viewing or confirming this prepared order.</p><form action="/api/auth/demo" method="post"><input type="hidden" name="continue" value={`/action/${token}`} /><button className={styles.primary}>Continue in demo mode</button></form><small>Demo authentication is a hackathon fallback. No real money can move.</small></section></main>;
  }
  const handoff = await getTradeHandoffService().resolve(token);
  if (handoff.status === 'invalid') notFound();
  if (handoff.status !== 'pending') {
    return <main className={styles.page}><section className={styles.stateCard}><span className={styles.demo}>DEMO</span><p className={styles.eyebrow}>Review & Buy</p><h1>{handoff.status === 'expired' ? 'This link has expired' : 'This order was already confirmed'}</h1><p>{handoff.status === 'expired' ? 'Return to WhatsApp and prepare a new order.' : 'Open your activity to view the receipt.'}</p></section></main>;
  }
  return <ActionReview token={token} preview={handoff.preview} />;
}
