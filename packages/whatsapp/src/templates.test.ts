import { describe, expect, it } from 'vitest';
import { MemoryTemplateDeliveryStore, WhatsAppTemplateRegistry, WhatsAppTemplateService } from './templates';
import type { WhatsAppOutboundMessage } from './index';

describe('WhatsAppTemplateRegistry', () => {
  it('rejects unknown keys and invalid variable shapes', () => {
    const registry = new WhatsAppTemplateRegistry({});
    expect(() => registry.resolve('marketing_blast', {})).toThrow('Unknown');
    expect(() => registry.resolve('order_receipt_update', { reference: 'R1' })).toThrow();
  });

  it('uses a safe text fallback while Meta approval is pending', () => {
    const registry = new WhatsAppTemplateRegistry({});
    expect(registry.resolve('order_receipt_update', { reference: 'CDX-1', symbol: 'NVDA', amount: '50.00', currency: 'USD', status: 'completed' })).toEqual({
      mode: 'fallback', key: 'order_receipt_update', text: 'Paper order completed: NVDA · USD 50.00\nReceipt CDX-1'
    });
  });

  it('maps only configured internal keys to provider template names', () => {
    const registry = new WhatsAppTemplateRegistry({ order_receipt_update: 'chatdex_order_receipt' });
    expect(registry.resolve('order_receipt_update', { reference: 'CDX-1', symbol: 'NVDA', amount: '50.00', currency: 'USD', status: 'completed' })).toEqual({
      mode: 'template', key: 'order_receipt_update', providerName: 'chatdex_order_receipt', language: 'en',
      bodyParameters: ['CDX-1', 'completed', 'USD', '50.00', 'NVDA']
    });
  });

  it('maps the claim template variables in the documented positional order', () => {
    const registry = new WhatsAppTemplateRegistry({ claim_update: 'chatdex_claim_update' });
    expect(registry.resolve('claim_update', { reference: 'CLM-ABC123', status: 'pending', currency: 'USD', amount: '25.00', actionUrl: 'https://usechatdex.com/c/example' })).toEqual({
      mode: 'template', key: 'claim_update', providerName: 'chatdex_claim_update', language: 'en',
      bodyParameters: ['CLM-ABC123', 'pending', 'USD', '25.00']
    });
  });

  it('sends an approved template once and persists the provider message id', async () => {
    const sent: WhatsAppOutboundMessage[] = [];
    const deliveries = new MemoryTemplateDeliveryStore();
    const service = new WhatsAppTemplateService(
      new WhatsAppTemplateRegistry({ order_receipt_update: 'chatdex_order_receipt' }),
      { async send(message) { sent.push(message); return { externalMessageId: 'wamid.template.1' }; } },
      deliveries
    );
    const input = {
      idempotencyKey: 'order-receipt:CDX-1', key: 'order_receipt_update' as const, recipient: '2348012345678',
      variables: { reference: 'CDX-1', symbol: 'NVDA', amount: '50.00', currency: 'USD', status: 'completed' }
    };
    await expect(service.send(input)).resolves.toEqual({ status: 'sent', externalMessageId: 'wamid.template.1' });
    await expect(service.send(input)).resolves.toEqual({ status: 'duplicate' });
    expect(sent).toEqual([{ type: 'template', to: '2348012345678', template: { name: 'chatdex_order_receipt', language: 'en', bodyParameters: ['CDX-1', 'completed', 'USD', '50.00', 'NVDA'] } }]);
    expect(deliveries.records.get(input.idempotencyKey)).toMatchObject({ status: 'sent', externalMessageId: 'wamid.template.1' });
  });

  it('uses text fallback and records a failed attempt for safe retry', async () => {
    const deliveries = new MemoryTemplateDeliveryStore();
    let attempts = 0;
    const service = new WhatsAppTemplateService(
      new WhatsAppTemplateRegistry({}),
      { async send() { attempts += 1; if (attempts === 1) throw new Error('temporary'); return { externalMessageId: 'wamid.retry' }; } },
      deliveries
    );
    const input = {
      idempotencyKey: 'order-receipt:CDX-2', key: 'order_receipt_update' as const, recipient: '2348012345678',
      variables: { reference: 'CDX-2', symbol: 'NVDA', amount: '50.00', currency: 'USD', status: 'completed' }
    };
    await expect(service.send(input)).rejects.toThrow('temporary');
    expect(deliveries.records.get(input.idempotencyKey)?.status).toBe('failed');
    await expect(service.send(input)).resolves.toEqual({ status: 'sent', externalMessageId: 'wamid.retry' });
    expect(deliveries.records.get(input.idempotencyKey)?.status).toBe('sent');
  });
});
