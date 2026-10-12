import { getDatabaseFailureCode, getPortfolioSnapshot } from '@/lib/whatsapp-runtime';
import { getSession } from '@/lib/session';
import { ChatFinanceApp } from './chat-finance-app';
import styles from './app.module.css';

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const session = await getSession();
  if (!session) return <main className={styles.page}><section className={styles.signIn}><span>DEMO</span><p>ChatDex portfolio</p><h1>Sign in to continue</h1><p>Your positions, activity and receipts are private.</p><form action="/api/auth/demo" method="post"><input type="hidden" name="continue" value="/app" /><button>Continue in demo mode</button></form></section></main>;
  let snapshot;
  try {
    snapshot = await getPortfolioSnapshot(session.userId);
  } catch (error) {
    const reference = getDatabaseFailureCode(error);
    console.error('Portfolio snapshot failed', { reference });
    return <main className={styles.page}><section className={styles.signIn}><span>DEMO</span><p>Portfolio unavailable</p><h1>We couldn’t load your portfolio</h1><p>Check the database connection and try again.</p><small>Reference: {reference}</small><a href="/app">Try again</a></section></main>;
  }
  return <ChatFinanceApp snapshot={snapshot} demoSessionId={session.userId} />;
}
