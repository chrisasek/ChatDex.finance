# Flow contracts

## Global contracts

| ID | Applies | Owner | Contract | Verification |
|---|---|---|---|---|
| intent | all inputs | `packages/intents` | runtime-validated canonical intent; source changes metadata only | parser/equivalence tests |
| whatsapp-edge | WhatsApp | `packages/whatsapp` | verify, normalize, deduplicate, render; no financial logic | adapter tests |
| market-data | market reads | `packages/markets` | provider-neutral quote interface | provider/orchestrator tests |
| execution | irreversible actions | trading milestone | authenticated explicit idempotent confirm only | confirmation tests |
| observability | all APIs | application shell | correlation IDs; no secrets/raw private payload logs | route review/tests |

## Flow 01 to Flow 02

The Buy action carries a non-authoritative symbol hint. Flow 02 validates symbol/amount and produces the same `TRADE.BUY` shape as free-form input. It cannot execute.

## Flow 02 to Flow 03

The server persists intent/preview ownership and returns a short-lived opaque token. Flow 03 authenticates, binds ownership, revalidates price/eligibility, and handles idempotent confirmation.
