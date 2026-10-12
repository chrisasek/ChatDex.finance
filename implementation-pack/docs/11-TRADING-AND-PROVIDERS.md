# 11 — Trading and Provider Architecture

```ts
interface TradingProvider {
  getQuote(req: QuoteRequest): Promise<Quote>;
  execute(req: ExecutionRequest): Promise<ExecutionResult>;
  getPositions(userId: string): Promise<ProviderPosition[]>;
}
```

Implement at least:
- `PaperTradingProvider` for unsupported/demo assets such as stocks.
- One `CryptoTradingProvider` backed by the chosen real onchain/crypto rail.

## Provider rules
- Core services reference interfaces, never vendor SDKs directly.
- Normalize provider errors.
- Persist provider/external references.
- Idempotency key on execution.
- Explicitly expose `paper` vs `live` execution mode to UI.

## Market data
Separate market-data provider interface from execution provider so either can be swapped independently.
