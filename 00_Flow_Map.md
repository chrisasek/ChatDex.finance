# Flow map

## Product outcome

A user can begin in WhatsApp, receive information and prepare an intent there, then cross a secure boundary to authenticated ChatDex for explicit execution and a persisted receipt.

## Flow registry

| ID | Flow | Primary actor | Goal | Trigger | Success outcome | Entry flows | Exit flows | Depends on | Proof |
|---|---|---|---|---|---|---|---|---|---|
| 01 | WhatsApp market information | WhatsApp user | Get NVDA status in WhatsApp | market question | compact response + Buy preparation action | none | 02 | shared foundation | adapter contract/runtime test |
| 02 | Buy preparation | WhatsApp user | Produce canonical TRADE.BUY preview | Buy or free-form command | validated intent + secure handoff | 01 | 03 | 01 | intent equivalence tests |
| 03 | Review, confirm, receipt | authenticated user | Explicitly execute paper order | Review & Buy | receipt and updated portfolio | 02 | 04 | 02, auth, database | browser + persistence proof |
| 04 | Shared Web views | authenticated user | See same state in Chat/Normal | direct/open receipt | consistent portfolio/activity | 03 | none | 03 | browser proof |

## Dependency order

Shared foundation → Flow 01 → Flow 02 → Flow 03 → Flow 04 → claims/real crypto/polish.

## Cross-flow edges

Flow 01's Buy action supplies safe symbol context to Flow 02. Flow 02 stores authoritative intent state and issues only an opaque token to Flow 03. Flow 03 writes canonical order/execution/receipt/portfolio state consumed by Flow 04.
