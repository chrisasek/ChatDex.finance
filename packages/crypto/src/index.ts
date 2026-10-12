export type CryptoExecutionMode = 'testnet' | 'live';
export type CryptoQuote = { asset: string; currency: string; amount: string; price: string; expiresAt: string; providerReference: string };
export type CryptoExecution = { status: 'completed'; mode: CryptoExecutionMode; providerReference: string; transactionReference: string; executedAt: string };

export interface CryptoTradingProvider {
  quote(input: { asset: string; currency: string; amount: string; mode: CryptoExecutionMode }): Promise<CryptoQuote>;
  execute(input: { quote: CryptoQuote; idempotencyKey: string; mode: CryptoExecutionMode }): Promise<CryptoExecution>;
}

export class DisabledCryptoTradingProvider implements CryptoTradingProvider {
  async quote(_input: { asset: string; currency: string; amount: string; mode: CryptoExecutionMode }): Promise<CryptoQuote> { throw new Error('Crypto provider is not configured'); }
  async execute(_input: { quote: CryptoQuote; idempotencyKey: string; mode: CryptoExecutionMode }): Promise<CryptoExecution> { throw new Error('Crypto provider is not configured'); }
}

export function requireSafeCryptoMode(mode: string): CryptoExecutionMode {
  if (mode === 'testnet') return mode;
  if (mode === 'live') throw new Error('Live crypto execution requires explicit provider activation');
  throw new Error('Crypto execution mode must be testnet or live');
}
