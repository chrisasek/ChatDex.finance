# Flow 03 — Review, confirm, receipt

## Entry

The user selects **Review & Buy** after preparing a `TRADE.BUY` intent in WhatsApp. The link contains an opaque, short-lived handoff token and no order details.

## Main path

1. The WebApp requires an authenticated session.
2. It resolves the token to server-side preview state and shows symbol, amount, demo quote, estimated quantity, fee, and order type.
3. The user selects **Confirm paper buy**.
4. The server refreshes the quote and completes the paper execution in one idempotent transaction.
5. The UI shows a receipt reference, quantity, execution price, amount, fee, and Paper status.

## Alternate states

- **Cancel:** the UI exits without executing.
- **Expired or invalid:** the handoff cannot be reviewed or confirmed.
- **Retry:** a transient failure keeps the review available for another explicit confirmation.
- **Repeat confirmation:** the server returns the original receipt without creating another execution.

## Evidence

The approved production flow was verified at 390 × 844 through authentication, review, confirmation, receipt, and repeated-confirmation idempotency. See `evidence/flows/Flow_03/review-buy-success.png`.
