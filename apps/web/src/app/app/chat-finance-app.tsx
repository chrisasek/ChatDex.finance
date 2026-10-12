'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { PortfolioActivity, PortfolioSnapshot } from '@chatdex/database';
import styles from './app.module.css';

type View = 'chat' | 'home' | 'markets' | 'asset' | 'claim' | 'activity';
type MarketQuote = { symbol: string; name: string; price: string; currency: string; changePercent: string; asOf: string; dataMode: 'demo' | 'live' };
type PreparedOrder = { reviewUrl: string; expiresAt: string; preview: { symbol: string; name: string; amount: string; currency: string; quotedPrice: string; estimatedQuantity: string; executionMode: 'paper' } };
type CreatedClaim = { reference: string; amount: string; currency: string; status: 'pending'; expiresAt: string; actionUrl: string; shareText: string };
type ChatCard =
  | { type: 'MARKET'; symbol: string; name: string; price: string; currency: string; changePercent: string; dataMode: 'demo' | 'live' }
  | { type: 'PORTFOLIO'; totalValue: string; unrealizedPnl: string; positions: Array<{ symbol: string; name: string; quantity: string; marketValue: string }>; executionMode: 'paper' }
  | { type: 'ORDER'; symbol: string; amount: string; currency: string; estimatedQuantity: string; quotedPrice: string; executionMode: 'paper'; reviewUrl: string; expiresAt: string };
type ChatResult = { kind: string; reply: string; card?: ChatCard };
type ChatMessage = { id: string; direction: 'incoming' | 'outgoing'; text: string; card?: ChatCard };

const money = (value: string, currency = 'USD') => `${currency === 'USD' ? '$' : `${currency} `}${Number(value).toFixed(2)}`;

const guideSteps = [
  { title: 'Ask about NVDA', copy: 'Use a quick action or type a market question. ChatDex answers with structured demo data.' },
  { title: 'Prepare and review', copy: 'Prepare a paper buy, then inspect the amount and estimated shares before confirming.' },
  { title: 'Find the receipt', copy: 'After confirmation, the paper receipt appears in Chat, Home, and Activity.' }
];

export function ChatFinanceApp({ snapshot, demoSessionId }: { snapshot: PortfolioSnapshot; demoSessionId: string }) {
  const scrollRef = useRef<HTMLElement | null>(null);
  const [view, setView] = useState<View>('chat');
  const [context, setContext] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PortfolioActivity | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [markets, setMarkets] = useState<MarketQuote[]>([]);
  const [marketQuery, setMarketQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MarketQuote | null>(null);
  const [marketBusy, setMarketBusy] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState('50');
  const [orderBusy, setOrderBusy] = useState(false);
  const [preparedOrder, setPreparedOrder] = useState<PreparedOrder | null>(null);
  const [claimAmount, setClaimAmount] = useState('25');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const [createdClaim, setCreatedClaim] = useState<CreatedClaim | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const primaryPosition = snapshot.positions[0];
  const primaryReceipt = snapshot.activity[0];
  const positive = Number(snapshot.unrealizedPnl) >= 0;

  async function loadMarkets(query = '') {
    setMarketBusy(true);
    setMarketError(null);
    try {
      const response = await fetch(`/api/markets?query=${encodeURIComponent(query)}`);
      const envelope = await response.json() as { data: MarketQuote[] | null; error: { message: string } | null };
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? 'Markets could not be loaded.');
      setMarkets(envelope.data);
    } catch (requestError) {
      setMarketError(requestError instanceof Error ? requestError.message : 'Markets could not be loaded.');
    } finally {
      setMarketBusy(false);
    }
  }

  useEffect(() => { queueMicrotask(() => void loadMarkets()); }, []);
  useEffect(() => {
    const key = `chatdex-guide:${demoSessionId}`;
    if (!window.localStorage.getItem(key)) queueMicrotask(() => setGuideStep(0));
  }, [demoSessionId]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' }); }, [view]);

  function chat(symbol?: string) {
    setContext(symbol ?? null);
    setView('chat');
  }

  function openAsset(asset: MarketQuote) {
    setSelectedAsset(asset);
    setPreparedOrder(null);
    setBuyAmount('50');
    setView('asset');
  }

  async function prepareNormalBuy(event: FormEvent) {
    event.preventDefault();
    if (!selectedAsset || orderBusy) return;
    setOrderBusy(true);
    setMarketError(null);
    try {
      const response = await fetch('/api/orders/prepare', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientRequestId: crypto.randomUUID(), symbol: selectedAsset.symbol, amount: buyAmount, currency: 'USD' })
      });
      const envelope = await response.json() as { data: PreparedOrder | null; error: { message: string } | null };
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? 'The paper order could not be prepared.');
      setPreparedOrder(envelope.data);
    } catch (requestError) {
      setMarketError(requestError instanceof Error ? requestError.message : 'The paper order could not be prepared.');
    } finally {
      setOrderBusy(false);
    }
  }

  async function createClaim(event: FormEvent) {
    event.preventDefault();
    if (claimBusy) return;
    setClaimBusy(true); setMarketError(null); setShareFeedback(null);
    try {
      const response = await fetch('/api/claims', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: claimAmount, currency: 'USD', recipientPhone: claimPhone.trim() || undefined })
      });
      const envelope = await response.json() as { data: CreatedClaim | null; error: { message: string } | null };
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? 'The demo claim could not be created.');
      setCreatedClaim(envelope.data);
    } catch (requestError) {
      setMarketError(requestError instanceof Error ? requestError.message : 'The demo claim could not be created.');
    } finally { setClaimBusy(false); }
  }

  async function shareClaim() {
    if (!createdClaim) return;
    const share = Reflect.get(navigator, 'share') as Navigator['share'] | undefined;
    try {
      if (share) await share.call(navigator, { title: 'ChatDex demo claim', text: createdClaim.shareText, url: createdClaim.actionUrl });
      else await navigator.clipboard.writeText(createdClaim.shareText);
      setShareFeedback(share ? 'Share sheet opened.' : 'Claim link copied.');
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
      try { await navigator.clipboard.writeText(createdClaim.actionUrl); setShareFeedback('Claim link copied.'); }
      catch { setShareFeedback('Copy the private link below.'); }
    }
  }

  async function ask(payload: { text?: string; quickAction?: 'markets' | 'portfolio' | 'buy_nvda_50' }, outgoing: string) {
    if (busy) return;
    const clientRequestId = crypto.randomUUID();
    setMessages((current) => [...current, { id: `${clientRequestId}:out`, direction: 'outgoing', text: outgoing }]);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientRequestId, ...payload, context: context ? { symbol: context } : undefined })
      });
      const envelope = await response.json() as { data: ChatResult | null; error: { message: string } | null };
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? 'ChatDex could not complete that request.');
      setMessages((current) => [...current, { id: `${clientRequestId}:in`, direction: 'incoming', text: envelope.data!.reply, card: envelope.data!.card }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'ChatDex could not complete that request.');
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    void ask({ text }, text);
  }

  function renderCard(card: ChatCard) {
    if (card.type === 'MARKET') {
      const change = Number(card.changePercent);
      return <article className={styles.marketCard}><small>{card.dataMode === 'demo' ? 'DEMO MARKET' : 'MARKET'}</small><div><span><b>{card.symbol}</b><em>{card.name}</em></span><strong>{money(card.price, card.currency)}</strong></div><p>{change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}% today</p><button onClick={() => void ask({ quickAction: 'buy_nvda_50' }, `Buy $50 ${card.symbol}`)} disabled={busy}>Prepare $50 paper buy</button></article>;
    }
    if (card.type === 'PORTFOLIO') {
      return <button className={styles.face} onClick={() => setView('home')}><small>Portfolio · Paper</small><strong>{money(card.totalValue)}</strong><span>{card.positions[0] ? `${card.positions[0].quantity} ${card.positions[0].symbol}` : 'No positions yet'} · View portfolio →</span></button>;
    }
    return <article className={styles.orderCard}><span>PAPER ORDER</span><h3>Buy {card.symbol}</h3><strong>{money(card.amount, card.currency)}</strong><p>Estimated {card.estimatedQuantity} shares at {money(card.quotedPrice, card.currency)}.</p><a href={card.reviewUrl}>Review &amp; Buy</a><small>Expires {new Date(card.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. No trade has been placed.</small></article>;
  }

  function closeGuide() {
    window.localStorage.setItem(`chatdex-guide:${demoSessionId}`, 'seen');
    setGuideStep(null);
  }

  return <main className={styles.page}><section className={styles.appShell}>
    <header><span className={styles.mark}>C</span><div><b>ChatDex</b><small>Fresh judge session</small></div><button className={styles.guideButton} onClick={() => setGuideStep(0)}>Guide</button><span className={styles.demo}>DEMO</span></header>
    <nav className={styles.switcher} aria-label="Surface"><button className={view === 'chat' ? styles.active : ''} onClick={() => chat()}>Chat</button><button className={view !== 'chat' ? styles.active : ''} onClick={() => setView('home')}>Home</button></nav>
    {view === 'chat' && <section ref={scrollRef} className={styles.scroll} aria-label="Chat View">
      {context && <div className={styles.context}><small>Current context</small><b>{context}</b><button onClick={() => setContext(null)} aria-label="Clear context">×</button></div>}
      <p className={styles.bubble}>Welcome back. {primaryPosition ? `Your ${primaryPosition.symbol} paper position is available below.` : 'Complete a paper trade to build your demo portfolio.'}</p>
      <button className={styles.face} onClick={() => setView('home')}><small>Portfolio · Paper</small><strong>{money(snapshot.totalValue)}</strong><span>{primaryPosition ? `${primaryPosition.quantity} ${primaryPosition.symbol}` : 'No positions yet'} · View portfolio →</span></button>
      {primaryReceipt && <><p className={styles.bubble}>Your latest paper order completed successfully.</p><button className={styles.receipt} onClick={() => setReceipt(primaryReceipt)}><span>RECEIPT</span><b>Bought {primaryReceipt.quantity} {primaryReceipt.symbol}</b><small>{primaryReceipt.reference} · Completed · Paper</small></button></>}
      {messages.map((message) => <div className={message.direction === 'outgoing' ? styles.messageOut : styles.messageIn} key={message.id}><p>{message.text}</p>{message.card && renderCard(message.card)}</div>)}
      {busy && <div className={styles.typing} role="status" aria-live="polite"><i /><i /><i /><span>ChatDex is responding</span></div>}
      {error && <div className={styles.chatError} role="alert"><span>{error}</span><button onClick={() => setError(null)}>Dismiss</button></div>}
      <div className={styles.chips} aria-label="Quick Actions"><button onClick={() => void ask({ quickAction: 'buy_nvda_50' }, 'Buy $50 NVDA')} disabled={busy}>Buy $50 NVDA</button><button onClick={() => void ask({ quickAction: 'markets' }, 'Show NVDA market')} disabled={busy}>Markets</button><button onClick={() => void ask({ quickAction: 'portfolio' }, 'Show my portfolio')} disabled={busy}>Portfolio</button></div>
      <form className={styles.composer} onSubmit={submit}><label className={styles.srOnly} htmlFor="chat-message">Message ChatDex</label><input id="chat-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder={context ? `Ask about ${context}…` : 'Ask ChatDex…'} maxLength={500} disabled={busy} /><button aria-label="Send message" disabled={busy || !input.trim()}>↑</button></form>
    </section>}
    {view === 'home' && <section ref={scrollRef} className={styles.scroll} aria-label="Home View"><p className={styles.eyebrow}>Portfolio</p><h1>Your money, at a glance.</h1><div className={styles.balance}><small>Demo balance</small><strong>{money(snapshot.totalValue)}</strong><span>{positive ? '↑' : '↓'} {money(Math.abs(Number(snapshot.unrealizedPnl)).toFixed(2))} unrealized</span></div><div className={`${styles.actions} ${styles.fourActions}`}><button onClick={() => setView('markets')}>Buy</button><button onClick={() => setView('markets')}>Markets</button><button onClick={() => { setCreatedClaim(null); setMarketError(null); setView('claim'); }}>Claim</button><button onClick={() => chat(primaryPosition?.symbol)}>Ask</button></div><div className={styles.sectionTitle}><b>Positions</b><span>{snapshot.positions.length} assets</span></div>{snapshot.positions.length ? snapshot.positions.map((position) => <button className={styles.row} key={position.symbol} onClick={() => { const quote = markets.find((item) => item.symbol === position.symbol); if (quote) openAsset(quote); else chat(position.symbol); }}><span className={styles.asset}>{position.symbol.slice(0,2)}</span><span><b>{position.symbol}</b><small>{position.name} · Paper</small></span><span><b>{position.quantity}</b><small>{money(position.marketValue)}</small></span></button>) : <div className={styles.empty}><b>No positions yet</b><span>Your completed paper trades will appear here.</span></div>}<div className={styles.sectionTitle}><b>Markets</b><button onClick={() => setView('markets')}>Explore</button></div>{markets.slice(0, 2).map((asset) => <button className={styles.row} key={asset.symbol} onClick={() => openAsset(asset)}><span className={styles.asset}>{asset.symbol.slice(0,2)}</span><span><b>{asset.symbol}</b><small>{asset.name} · Demo market</small></span><span><b>{money(asset.price, asset.currency)}</b><small>{Number(asset.changePercent) >= 0 ? '↑' : '↓'} {Math.abs(Number(asset.changePercent)).toFixed(2)}%</small></span></button>)}<div className={styles.sectionTitle}><b>Recent activity</b><button onClick={() => setView('activity')}>See all</button></div>{primaryReceipt ? <button className={styles.row} onClick={() => setReceipt(primaryReceipt)}><span className={styles.done}>✓</span><span><b>{primaryReceipt.symbol} buy</b><small>Completed · Paper</small></span><span><b>{money(primaryReceipt.amount)}</b><small>Receipt →</small></span></button> : <div className={styles.empty}><b>No activity yet</b><span>Receipts will appear after confirmation.</span></div>}</section>}
    {view === 'markets' && <section ref={scrollRef} className={styles.scroll} aria-label="Markets View"><button className={styles.back} onClick={() => setView('home')}>← Home</button><p className={styles.eyebrow}>Demo markets</p><h1>Find an asset.</h1><form className={styles.search} onSubmit={(event) => { event.preventDefault(); void loadMarkets(marketQuery); }}><label className={styles.srOnly} htmlFor="market-search">Search markets</label><input id="market-search" value={marketQuery} onChange={(event) => setMarketQuery(event.target.value)} placeholder="Search symbol or company" maxLength={40} /><button disabled={marketBusy}>Search</button></form>{marketError && <div className={styles.inlineError} role="alert">{marketError}<button onClick={() => void loadMarkets(marketQuery)}>Retry</button></div>}{marketBusy ? <div className={styles.loading} role="status">Loading demo markets…</div> : markets.length ? markets.map((asset) => <button className={styles.marketRow} key={asset.symbol} onClick={() => openAsset(asset)}><span className={styles.asset}>{asset.symbol.slice(0,2)}</span><span><b>{asset.symbol}</b><small>{asset.name} · Stock · Demo</small></span><span><b>{money(asset.price, asset.currency)}</b><small>{Number(asset.changePercent) >= 0 ? '↑ Gain' : '↓ Loss'} {Math.abs(Number(asset.changePercent)).toFixed(2)}%</small></span></button>) : <div className={styles.empty}><b>No matching markets</b><span>Try NVDA, Apple, or Microsoft.</span><button onClick={() => { setMarketQuery(''); void loadMarkets(); }}>Clear search</button></div>}</section>}
    {view === 'asset' && selectedAsset && <section ref={scrollRef} className={styles.scroll} aria-label={`${selectedAsset.symbol} Asset Detail`}><button className={styles.back} onClick={() => setView('markets')}>← Markets</button><div className={styles.assetHero}><span className={styles.demo}>DEMO</span><p>{selectedAsset.name}</p><h1>{selectedAsset.symbol}</h1><strong>{money(selectedAsset.price, selectedAsset.currency)}</strong><small>{Number(selectedAsset.changePercent) >= 0 ? '↑ Gain' : '↓ Loss'} {Math.abs(Number(selectedAsset.changePercent)).toFixed(2)}% today</small><div className={styles.chart} aria-label={`${selectedAsset.symbol} illustrative one day price chart`}><i /><i /><i /><i /><i /><i /><i /><i /></div><em>Illustrative demo data · As of {new Date(selectedAsset.asOf).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</em></div><button className={styles.askAsset} onClick={() => chat(selectedAsset.symbol)}>Ask ChatDex about {selectedAsset.symbol}</button>{snapshot.positions.find((position) => position.symbol === selectedAsset.symbol) && <div className={styles.positionCard}><small>Your paper position</small><b>{snapshot.positions.find((position) => position.symbol === selectedAsset.symbol)!.quantity} shares</b><span>{money(snapshot.positions.find((position) => position.symbol === selectedAsset.symbol)!.marketValue)}</span></div>}<form className={styles.buyForm} onSubmit={prepareNormalBuy}><div><span className={styles.eyebrow}>Paper buy</span><b>Prepare an order</b></div><label htmlFor="buy-amount">Amount in USD</label><div className={styles.amountInput}><span>$</span><input id="buy-amount" inputMode="decimal" value={buyAmount} onChange={(event) => { setBuyAmount(event.target.value); setPreparedOrder(null); }} pattern="\d+(\.\d{1,2})?" required /></div><button className={styles.primary} disabled={orderBusy}>{orderBusy ? 'Preparing…' : `Review ${selectedAsset.symbol} paper buy`}</button><small>No trade is placed until you explicitly confirm on the secure review screen.</small></form>{marketError && <div className={styles.inlineError} role="alert">{marketError}</div>}{preparedOrder && <article className={styles.prepared}><span>PAPER ORDER READY</span><b>{money(preparedOrder.preview.amount)} of {preparedOrder.preview.symbol}</b><p>Estimated {preparedOrder.preview.estimatedQuantity} shares at {money(preparedOrder.preview.quotedPrice)}.</p><a href={preparedOrder.reviewUrl}>Continue to Review &amp; Buy</a><small>Expires {new Date(preparedOrder.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</small></article>}</section>}
    {view === 'activity' && <section ref={scrollRef} className={styles.scroll} aria-label="Activity View"><button className={styles.back} onClick={() => setView('home')}>← Home</button><p className={styles.eyebrow}>Activity</p><h1>Receipts and orders.</h1>{snapshot.activity.length ? snapshot.activity.map((item) => <button className={styles.row} key={item.reference} onClick={() => setReceipt(item)}><span className={styles.done}>✓</span><span><b>Bought {item.symbol}</b><small>{new Date(item.executedAt).toLocaleDateString()} · Paper</small></span><span><b>{money(item.amount)}</b><small>View →</small></span></button>) : <div className={styles.empty}><b>No receipts yet</b><span>Completed orders will appear here.</span></div>}</section>}
    {view === 'claim' && <section ref={scrollRef} className={styles.scroll} aria-label="Create Claim View">
      <button className={styles.back} onClick={() => setView('home')}>← Home</button>
      <p className={styles.eyebrow}>Demo claim</p><h1>Send a private claim link.</h1>
      {!createdClaim ? <form className={styles.buyForm} onSubmit={createClaim}>
        <label htmlFor="claim-amount">Amount in USD</label><div className={styles.amountInput}><span>$</span><input id="claim-amount" inputMode="decimal" value={claimAmount} onChange={(event) => setClaimAmount(event.target.value)} pattern="\d+(\.\d{1,2})?" required /></div>
        <label htmlFor="claim-phone">Recipient phone <span className={styles.optional}>Optional · international format</span></label><div className={styles.phoneInput}><input id="claim-phone" type="tel" value={claimPhone} onChange={(event) => setClaimPhone(event.target.value)} placeholder="+2348000000001" pattern="\+[1-9]\d{7,14}" /></div>
        <button className={styles.primary} disabled={claimBusy}>{claimBusy ? 'Creating…' : 'Create demo claim'}</button>
        <small>This creates an opaque 30-minute link. ChatDex will not message the recipient automatically.</small>
      </form> : <>
        <div className={styles.claimFace}><small>DEMO CLAIM · {createdClaim.currency}</small><strong>{money(createdClaim.amount, createdClaim.currency)}</strong><span>Pending</span><em>{createdClaim.reference}</em></div>
        <div className={styles.notice}>Share this private link only with the intended recipient. It can be completed once before it expires.</div>
        <button className={styles.primary} onClick={() => void shareClaim()}>Share claim link</button>
        <label className={styles.linkLabel} htmlFor="claim-link">Private claim link</label><input id="claim-link" className={styles.claimLink} value={createdClaim.actionUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
        {shareFeedback && <p className={styles.shareFeedback} role="status">{shareFeedback}</p>}
        <button className={styles.secondaryAction} onClick={() => { setCreatedClaim(null); setShareFeedback(null); }}>Create another claim</button>
      </>}
      {marketError && <div className={styles.inlineError} role="alert">{marketError}</div>}
    </section>}
    {receipt && <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="receipt-title"><div><span className={styles.demo}>PAPER</span><button className={styles.close} onClick={() => setReceipt(null)} aria-label="Close">×</button><p className={styles.eyebrow}>Receipt</p><h2 id="receipt-title">Order completed</h2><strong className={styles.total}>{money(receipt.amount)}</strong><dl><div><dt>Asset</dt><dd>{receipt.quantity} {receipt.symbol}</dd></div><div><dt>Price</dt><dd>{money(receipt.price)}</dd></div><div><dt>Reference</dt><dd>{receipt.reference}</dd></div><div><dt>Mode</dt><dd>Demo · Paper</dd></div></dl><button className={styles.primary} onClick={() => setReceipt(null)}>Done</button></div></div>}
    {guideStep !== null && <div className={styles.guideOverlay} role="dialog" aria-modal="true" aria-labelledby="guide-title"><div className={styles.guideCard}><button className={styles.close} onClick={closeGuide} aria-label="Close guide">×</button><span className={styles.demo}>GUIDED DEMO</span><p className={styles.eyebrow}>{guideStep + 1} of {guideSteps.length}</p><h2 id="guide-title">{guideSteps[guideStep].title}</h2><p>{guideSteps[guideStep].copy}</p><div className={styles.guideProgress}>{guideSteps.map((_, index) => <i className={index <= guideStep ? styles.guideProgressActive : ''} key={index} />)}</div><div className={styles.guideActions}>{guideStep > 0 && <button className={styles.secondaryAction} onClick={() => setGuideStep(guideStep - 1)}>Back</button>}<button className={styles.primary} onClick={() => guideStep < guideSteps.length - 1 ? setGuideStep(guideStep + 1) : closeGuide()}>{guideStep < guideSteps.length - 1 ? 'Next step' : 'Explore ChatDex'}</button></div>{guideStep === guideSteps.length - 1 && <form action="/api/auth/demo" method="post"><input type="hidden" name="continue" value="/app" /><button className={styles.freshDemo}>Start a fresh demo</button></form>}<button className={styles.skipGuide} onClick={closeGuide}>Skip guide</button></div></div>}
  </section></main>;
}



