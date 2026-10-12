export type ApiEnvelope<T> = { data: T | null; error: { code: string; message: string } | null; meta: Record<string, unknown> };

export type CardAction = {
  id: string;
  label: string;
  intentType?: string;
  href?: string;
  emphasis?: 'primary' | 'secondary' | 'danger';
};

export type MarketCard = {
  type: 'MARKET';
  version: 1;
  id: string;
  symbol: string;
  name: string;
  price: string;
  currency: string;
  changePercent: string;
  asOf: string;
  dataMode: 'demo' | 'live';
  actions: CardAction[];
};
