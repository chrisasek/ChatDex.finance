# 10 — Normal View

Normal View preserves familiar fintech behavior and is switchable from Chat. It is not a secondary-class experience.

## V0 screens
- `/app/home` portfolio/home
- `/app/markets` market/search
- `/app/markets/[symbol]` asset detail
- `/app/activity` receipts/activity
- minimal account/settings

## Home
Portfolio value/performance, Buy/Sell/Send/Receive shortcuts, assets, watchlist/recent activity.

## Asset detail
Price, simple chart, position, Buy/Sell, stats as available, and `Ask ChatDex` carrying asset context.

## Shared-state rule
A trade created in Normal View must appear in Chat/activity/portfolio. A trade created in Chat must appear in Normal View. There are no separate ledgers.
