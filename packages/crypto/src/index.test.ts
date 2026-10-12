import { describe, expect, it } from 'vitest';
import { DisabledCryptoTradingProvider, requireSafeCryptoMode } from './index';

describe('crypto provider boundary', () => {
  it('defaults implementation work to an explicit testnet mode', () => {
    expect(requireSafeCryptoMode('testnet')).toBe('testnet');
    expect(() => requireSafeCryptoMode('live')).toThrow('explicit provider activation');
  });

  it('fails closed without configured provider credentials', async () => {
    const provider = new DisabledCryptoTradingProvider();
    await expect(provider.quote({ asset: 'SOL', currency: 'USD', amount: '10', mode: 'testnet' })).rejects.toThrow('not configured');
  });
});
