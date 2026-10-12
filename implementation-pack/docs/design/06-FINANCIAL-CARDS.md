# Financial Cards

This document maps the supplied feature-card direction to the implementation Card Protocol.

## Source feature families
The supplied system includes patterns for balance, price alert, order ticket, fill receipt, position, liquidation warning, agent call, venue compare, local market, money sent, claim received, savings circle, verify code, deposit details, voice note/command, pin guide, referral, support call, list picker and receipt/save-to-my-chat patterns.

V0 implements only the cards required by `02-V0-SCOPE.md`.

## V0 card mapping
| Protocol | UI component | Purpose |
|---|---|---|
| `PORTFOLIO` | `PortfolioCard` | glanceable balance/performance |
| `MARKET` | `MarketCard` | symbol, price, change, compact context |
| `ORDER` | `OrderCard` | review intent before execution |
| `POSITION` | `PositionCard` | current holding/position state |
| `RECEIPT` | `ReceiptCard` | immutable-looking result of an action |
| `TRANSFER` | `TransferCard` | review/result of money movement |
| `CLAIM` | `ClaimCard` | claim amount, sender, expiry, receive action |
| `ALERT` | `AlertCard` | price/risk signal and limited next actions |

## Rule
The Card Protocol owns data/state; React renderers own presentation. Do not put execution logic in card components.

## Paper/live state
Order and receipt cards must visibly distinguish demo/paper execution from live execution. Never rely on a subtle color difference; use explicit copy such as `Paper trade` / `Demo execution`.

## One card, one job
If a card needs charts, news, order controls, portfolio allocation and five actions, it is no longer a compact card. Provide a `View details` destination into Normal View.
