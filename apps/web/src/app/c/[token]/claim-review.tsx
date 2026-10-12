'use client';

import { useState } from 'react';
import styles from './claim.module.css';

type Preview = { reference: string; senderName: string; amount: string; currency: string; expiresAt: string; canClaim: boolean; signedInAsSender: boolean; demoMode: boolean };

export function ClaimReview({ token, preview }: { token: string; preview: Preview }) {
  const [state, setState] = useState<'ready' | 'loading' | 'success' | 'error'>('ready');
  const [message, setMessage] = useState('');
  async function complete() {
    if (state === 'loading') return;
    setState('loading'); setMessage('');
    try {
      const response = await fetch(`/api/claims/${encodeURIComponent(token)}/claim`, { method: 'POST' });
      const envelope = await response.json() as { data: { status: string } | null; error: { message: string } | null };
      if (!response.ok || envelope.data?.status !== 'claimed') throw new Error(envelope.error?.message ?? 'The demo claim could not be completed.');
      setState('success');
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The demo claim could not be completed.'); setState('error'); }
  }
  const money = `${preview.currency === 'USD' ? '$' : `${preview.currency} `}${Number(preview.amount).toFixed(2)}`;
  return <main className={styles.page}><section className={styles.shell}><header><span className={styles.mark}>C</span><div><b>ChatDex</b><small>Private claim</small></div><span className={styles.demo}>DEMO</span></header><div className={styles.content}>
    {state === 'success' ? <><div className={styles.success}><span>✓</span><p className={styles.eyebrow}>Claim completed</p><h1>{money} added to your demo balance.</h1></div><div className={styles.face}><small>DEMO CLAIM · {preview.currency}</small><strong>{money}</strong><span>Claimed · Demo</span><em>{preview.reference}</em></div><a className={styles.primary} href="/app">View demo portfolio</a></> : <><p className={styles.eyebrow}>Claim invitation</p><h1>{preview.senderName} sent you a claim.</h1><div className={styles.face}><small>DEMO CLAIM · {preview.currency}</small><strong>{money}</strong><span>Pending</span><em>{preview.reference}</em></div><div className={styles.card}><dl><div><dt>Expires</dt><dd>{new Date(preview.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</dd></div><div><dt>Settlement</dt><dd>Demo balance only</dd></div></dl>{preview.canClaim ? <><button className={styles.primary} onClick={() => void complete()} disabled={state === 'loading'}>{state === 'loading' ? 'Checking claim…' : `Claim ${money} demo funds`}</button><small>This one-time action cannot be repeated.</small></> : preview.demoMode ? <form action="/api/auth/demo" method="post"><input type="hidden" name="continue" value={`/c/${token}`} /><input type="hidden" name="identity" value="claim-recipient" /><button className={styles.primary}>{preview.signedInAsSender ? 'Continue as Demo Recipient' : 'Sign in as Demo Recipient'}</button><small>Recipient authentication is required before the claim can be completed.</small></form> : <div className={styles.notice}>Sign in to ChatDex with the intended recipient account.</div>}</div>{state === 'error' && <div className={styles.error} role="alert">{message}<button onClick={() => setState('ready')}>Try again</button></div>}</>}
  </div></section></main>;
}
