import styles from './page.module.css';

export default function Home() {
  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Primary navigation"><a className={styles.brand} href="#top"><span>C</span>ChatDex <em>DEMO</em></a><a href="#how">How it works</a></nav>
    <section className={styles.hero} id="top">
      <div className={styles.copy}><p className={styles.eyebrow}>Finance, from conversation to confirmation</p><h1>Two taps from WhatsApp to the stock market.</h1><p className={styles.lead}>Ask a market question, prepare an order in conversation, and confirm it securely in ChatDex. Every trade in this public demo is clearly labelled paper execution.</p>
        <div className={styles.actions}><form action="/api/auth/demo" method="post"><input type="hidden" name="continue" value="/app" /><button>Launch live demo <span>→</span></button></form><a href="#how">See the 3-step flow</a></div>
        <div className={styles.trust}><span>No account setup</span><span>Isolated demo session</span><span>No real money moves</span></div>
      </div>
      <div className={styles.previewWrap} aria-label="ChatDex product preview"><div className={styles.orbit} /><div className={styles.phone}><header><span className={styles.mark}>C</span><div><b>ChatDex</b><small>Demo portfolio</small></div><em>DEMO</em></header><div className={styles.switcher}><b>Chat</b><span>Home</span></div><div className={styles.feed}><p className={styles.bubble}>Welcome. Ask about a market or prepare a paper order.</p><div className={styles.face}><small>PORTFOLIO · PAPER</small><strong>$91.26</strong><span>0.50 NVDA · View portfolio →</span></div><div className={styles.chips}><span>Buy $50 NVDA</span><span>Markets</span><span>Portfolio</span></div><div className={styles.composer}>Ask ChatDex… <i>↑</i></div></div></div></div>
    </section>
    <section className={styles.how} id="how"><div className={styles.howIntro}><p className={styles.eyebrow}>One shared financial state</p><h2>Conversation prepares. ChatDex confirms.</h2><p>The same intent moves from WhatsApp or Web Chat into secure review, explicit confirmation, paper execution, and a receipt in your portfolio.</p></div><div className={styles.steps}><article><span>1</span><h3>Ask or tap in WhatsApp</h3><p>Get the NVDA answer inside the conversation, then prepare a $50 buy with free text or the Buy Flow.</p></article><article><span>2</span><h3>Review in ChatDex</h3><p>Inspect the amount, estimated shares, quote, expiry, and Paper status before confirmation.</p></article><article><span>3</span><h3>See one shared receipt</h3><p>The completed paper order appears in Chat, Normal View, activity, and the WhatsApp receipt update.</p></article></div>
      <form className={styles.finalCta} action="/api/auth/demo" method="post"><input type="hidden" name="continue" value="/app" /><p><b>Ready to try it?</b><span>Your demo starts with a fresh seeded NVDA position.</span></p><button>Open ChatDex →</button></form>
    </section>
    <footer className={styles.footer}><span>ChatDex · Colosseum demo</span><span>Market data and execution are simulated.</span></footer>
  </main>;
}
