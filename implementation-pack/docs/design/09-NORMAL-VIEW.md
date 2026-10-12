# Normal View Design

## Purpose
Normal View lowers behavior-change cost. It provides the familiar navigation-first financial interface users already know while sharing the same backend/state as Chat.

## V0 Home
- portfolio/balance hero;
- today's change;
- Buy/Sell/Send/Receive quick actions as applicable;
- assets/positions;
- watchlist;
- recent activity;
- persistent access to Chat.

## Asset detail
- symbol/name;
- current price and change;
- chart + simple ranges;
- user's position if any;
- Buy/Sell actions;
- minimal stats needed for demo;
- `Ask ChatDex about {symbol}`.

## Markets
- search;
- relevant asset list;
- market rows;
- clear asset-type labels where needed.

## Activity
- receipts/transactions in reverse chronology;
- status and paper/live labels;
- tap through to receipt details.

## Context bridge
Normal → Chat must carry structured context, not merely prefill verbose text.

Example:
```ts
openChat({
  context: { type: 'instrument', symbol: 'NVDA' }
});
```

Chat → Normal uses card destinations such as `View position`, `View NVDA`, `View portfolio`.
