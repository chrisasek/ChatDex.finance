'use client';

import { useRef, useState } from 'react';
import type { TradePreview } from '@chatdex/core';
import type { TradeReceipt } from '@chatdex/trading';
import styles from './action.module.css';

export function ActionReview({ token, preview }: { token: string; preview: TradePreview }) {
  const [status, setStatus] = useState<'ready' | 'confirming' | 'completed' | 'error' | 'cancelled'>('ready');
  const [receipt, setReceipt] = useState<TradeReceipt | null>(null);
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);

  async function confirm() {
    if (status === 'confirming' || status === 'completed') return;
    setStatus('confirming'); setMessage('Confirming your paper order…');
    try {
      const response = await fetch(`/api/handoffs/${token}/confirm`, { method: 'POST', headers: { 'content-type': 'application/json' } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? 'Confirmation failed');
      setReceipt(payload.data); setStatus('completed'); setMessage('Paper order completed.');
    } catch (error) {
      setStatus('error'); setMessage(error instanceof Error ? error.message : 'The paper order was not completed');
    }
    requestAnimationFrame(() => heading.current?.focus());
  }

  if (status === 'completed' && receipt) return <main className={styles.page}><section className={styles.stateCard} aria-live="polite"><span className={styles.demo}>DEMO</span><p className={styles.eyebrow}>Receipt</p><h1 ref={heading} tabIndex={-1}>Paper order completed</h1><p>You bought {receipt.quantity} {receipt.symbol} at ${receipt.price} in demo mode.</p><code>{receipt.reference}</code><dl className={styles.receipt}><div><dt>Amount</dt><dd>${receipt.amount}</dd></div><div><dt>Fee</dt><dd>${receipt.fee}</dd></div><div><dt>Status</dt><dd>Completed · Paper</dd></div></dl><a className={styles.homeLink} href="/app">Back to Home</a></section></main>;
  if (status === 'cancelled') return <main className={styles.page}><section className={styles.stateCard}><span className={styles.demo}>DEMO</span><p className={styles.eyebrow}>Review & Buy</p><h1 ref={heading} tabIndex={-1}>Order cancelled</h1><p>The prepared order was not executed.</p><a className={styles.homeLink} href="/app">Back to Home</a></section></main>;

  return <main className={styles.page}>
    <section className={styles.shell} aria-live="polite" aria-busy={status === 'confirming'}>
      <header><span className={styles.mark}>C</span><strong>ChatDex</strong><span className={styles.demo}>DEMO</span></header>
      <div className={styles.content}><p className={styles.eyebrow}>Review & Buy</p><h1 ref={heading} tabIndex={-1}>{status === 'error' ? 'Confirmation failed' : 'Ready to review'}</h1>
        <div className={styles.orderFace}><div className={styles.orderTop}><div><b>{preview.symbol}</b><small>{preview.name}</small></div><strong>Paper trade</strong></div><div className={styles.amount}><small>You’re buying</small><span>${preview.amount}</span></div><dl><div><dt>Demo quote</dt><dd>${preview.quotedPrice}</dd></div><div><dt>Estimated shares</dt><dd>{preview.estimatedQuantity}</dd></div><div><dt>Fee</dt><dd>${preview.fee}</dd></div><div><dt>Order type</dt><dd>Market</dd></div></dl><p>Quote will be refreshed before confirmation · Demo data</p></div>
        {message && <p className={status === 'error' ? styles.error : styles.notice}>{message}</p>}
      </div>
      <footer><button className={styles.primary} disabled={status === 'confirming'} onClick={confirm}>{status === 'confirming' ? 'Confirming…' : status === 'error' ? 'Retry paper buy' : 'Confirm paper buy'}</button><button className={styles.secondary} disabled={status === 'confirming'} onClick={() => setStatus('cancelled')}>Cancel</button><small>By confirming, you place a simulated order. No real money moves.</small></footer>
    </section>
  </main>;
}
