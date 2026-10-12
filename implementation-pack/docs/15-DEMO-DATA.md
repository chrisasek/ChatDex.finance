# 15 — Demo Data

Seed one coherent demo account, not random fixtures. Example:
- Portfolio: ~$4,821.50
- NVDA: ~$1,240
- SOL: ~$840
- USDC: ~$1,900
- Cash: remainder
- Alert: NVDA crossed target
- Activity: bought NVDA, received USDC, created/sent a claim

Prices may be refreshed from the market provider. Demo positions must be internally consistent enough for the UI.

## Demo mode
Support `DEMO_MODE=true` so external failures do not destroy the presentation. Simulated execution must visibly say Paper/Demo.
