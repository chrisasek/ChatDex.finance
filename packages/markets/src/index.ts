export type MarketQuote = {
  symbol: string;
  name: string;
  price: string;
  currency: string;
  changePercent: string;
  asOf: string;
  dataMode: 'demo' | 'live';
};

export interface MarketDataProvider { getQuote(symbol: string): Promise<MarketQuote | null>; }

const seededQuotes: Record<string, Omit<MarketQuote, 'asOf'>> = {
  NVDA: { symbol: 'NVDA', name: 'NVIDIA', price: '182.51', currency: 'USD', changePercent: '2.40', dataMode: 'demo' },
  AAPL: { symbol: 'AAPL', name: 'Apple', price: '258.03', currency: 'USD', changePercent: '0.84', dataMode: 'demo' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft', price: '522.40', currency: 'USD', changePercent: '-0.31', dataMode: 'demo' }
};

export class DemoMarketDataProvider implements MarketDataProvider {
  constructor(private readonly now: () => Date = () => new Date()) {}
  async getQuote(symbol: string): Promise<MarketQuote | null> {
    const quote = seededQuotes[symbol.toUpperCase()];
    return quote ? { ...quote, asOf: this.now().toISOString() } : null;
  }

  async listQuotes(query = ''): Promise<MarketQuote[]> {
    const term = query.trim().toUpperCase();
    const asOf = this.now().toISOString();
    return Object.values(seededQuotes)
      .filter((quote) => !term || quote.symbol.includes(term) || quote.name.toUpperCase().includes(term))
      .map((quote) => ({ ...quote, asOf }));
  }
}
