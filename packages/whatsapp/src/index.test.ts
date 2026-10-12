import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { ChatDexOrchestrator } from '@chatdex/core';
import { DemoMarketDataProvider } from '@chatdex/markets';
import { MemoryExternalMessageStore, WhatsAppCloudClient, WhatsAppMessageService, normalizeDeliveryStatuses, normalizeWebhook, verifyWebhookChallenge, verifyWebhookSignature, type WhatsAppOutboundMessage } from './index';

const payload = { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { messages: [{ id: 'wamid.1', from: '2348012345678', type: 'text', text: { body: 'How is NVDA doing?' } }] } }] }] };

describe('WhatsApp adapter', () => {
  it('accepts only the configured webhook verification token', () => {
    expect(verifyWebhookChallenge(new URLSearchParams('hub.mode=subscribe&hub.verify_token=right&hub.challenge=42'), 'right')).toEqual({ ok: true, challenge: '42' });
    expect(verifyWebhookChallenge(new URLSearchParams('hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=42'), 'right').ok).toBe(false);
  });

  it('rejects an invalid signature and accepts the correct HMAC', () => {
    const body = JSON.stringify(payload);
    const signature = `sha256=${createHmac('sha256', 'secret').update(body).digest('hex')}`;
    expect(verifyWebhookSignature(body, signature, 'secret')).toBe(true);
    expect(verifyWebhookSignature(body, 'sha256=00', 'secret')).toBe(false);
    expect(verifyWebhookSignature(body, `sha256=${'z'.repeat(64)}`, 'secret')).toBe(false);
  });

  it('normalizes Meta payloads at the adapter boundary', () => {
    expect(normalizeWebhook(payload)).toEqual([{ source: 'whatsapp_conversation', externalMessageId: 'wamid.1', phone: '2348012345678', text: 'How is NVDA doing?' }]);
  });

  it('renders an approved template as a Meta Cloud API template payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: 'wamid.template.1' }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const client = new WhatsAppCloudClient({ accessToken: 'token', phoneNumberId: 'phone-id', graphApiVersion: 'v23.0' });
      await expect(client.send({
        type: 'template', to: '2348012345678',
        template: { name: 'chatdex_order_receipt', language: 'en', bodyParameters: ['CDX-1', 'completed', 'USD', '50.00', 'NVDA'] }
      })).resolves.toEqual({ externalMessageId: 'wamid.template.1' });
      const request = fetchMock.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(String(request.body))).toEqual({
        messaging_product: 'whatsapp', recipient_type: 'individual', to: '2348012345678', type: 'template',
        template: {
          name: 'chatdex_order_receipt', language: { code: 'en' },
          components: [{ type: 'body', parameters: ['CDX-1', 'completed', 'USD', '50.00', 'NVDA'].map((text) => ({ type: 'text', text })) }]
        }
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('persists Meta delivery status callbacks without invoking financial behavior', async () => {
    const statuses: Array<{ id: string; status: string }> = [];
    const statusPayload = { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { statuses: [{ id: 'wamid.template.1', status: 'delivered' }] } }] }] };
    expect(normalizeDeliveryStatuses(statusPayload)).toEqual([{ externalMessageId: 'wamid.template.1', status: 'delivered' }]);
    const service = new WhatsAppMessageService({
      orchestrator: new ChatDexOrchestrator(new DemoMarketDataProvider()),
      messages: new MemoryExternalMessageStore(),
      outbound: { async send() { throw new Error('should not send'); } },
      deliveryStatuses: { async updateProviderStatus(id, status) { statuses.push({ id, status }); } }
    });
    await expect(service.handleWebhook(statusPayload, 'status-request')).resolves.toMatchObject({ accepted: 0, processed: 0, deliveryStatuses: 1 });
    expect(statuses).toEqual([{ id: 'wamid.template.1', status: 'delivered' }]);
  });

  it('answers NVDA inside WhatsApp with Buy preparation and deduplicates retries', async () => {
    const sent: WhatsAppOutboundMessage[] = [];
    const service = new WhatsAppMessageService({
      orchestrator: new ChatDexOrchestrator(new DemoMarketDataProvider(() => new Date('2026-10-07T10:00:00Z'))),
      messages: new MemoryExternalMessageStore(),
      outbound: { async send(message) { sent.push(message); return { externalMessageId: 'out.1' }; } },
      flowId: 'flow-demo'
    });
    expect(await service.handleWebhook(payload, 'request-1')).toMatchObject({ accepted: 1, processed: 1 });
    expect(await service.handleWebhook(payload, 'request-2')).toMatchObject({ accepted: 1, processed: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ type: 'interactive', to: '2348012345678', button: { title: 'Buy', flowId: 'flow-demo' } });
    expect((sent[0] as Extract<WhatsAppOutboundMessage, { type: 'interactive' }>).body).toContain('Demo market data');
  });

  it('falls back to a text market response when Meta rejects the Flow message', async () => {
    const sent: WhatsAppOutboundMessage[] = [];
    const service = new WhatsAppMessageService({
      orchestrator: new ChatDexOrchestrator(new DemoMarketDataProvider()),
      messages: new MemoryExternalMessageStore(),
      flowId: 'unpublished-flow',
      outbound: { async send(message) {
        sent.push(message);
        if (message.type === 'interactive') throw new Error('Meta rejected Flow');
        return {};
      } }
    });
    await expect(service.handleWebhook(payload, 'fallback-request')).resolves.toMatchObject({ processed: 1 });
    expect(sent).toHaveLength(2);
    expect(sent[1]).toMatchObject({ type: 'text' });
    expect((sent[1] as Extract<WhatsAppOutboundMessage, { type: 'text' }>).body).toContain('NVDA');
  });

  it('turns a complete free-form buy into an opaque secure handoff', async () => {
    const sent: WhatsAppOutboundMessage[] = [];
    const buyPayload = { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { messages: [{ id: 'wamid.buy', from: '2348012345678', type: 'text', text: { body: 'Buy $50 NVDA' } }] } }] }] };
    const service = new WhatsAppMessageService({
      orchestrator: new ChatDexOrchestrator(new DemoMarketDataProvider()),
      messages: new MemoryExternalMessageStore(),
      handoffs: { async prepare(intent, key, identity) {
        expect(intent).toMatchObject({ type: 'TRADE.BUY', source: 'whatsapp_conversation' });
        expect(key).toBe('whatsapp-conversation:wamid.buy');
        expect(identity).toEqual({ phone: '2348012345678' });
        return {
          reviewUrl: `https://usechatdex.com/action/${'a'.repeat(43)}`,
          expiresAt: '2026-10-08T15:00:00.000Z',
          preview: { intentId: intent.id, symbol: 'NVDA', name: 'NVIDIA', amount: '50.00', currency: 'USD', quotedPrice: '182.51', estimatedQuantity: '0.273957', fee: '0.00', orderType: 'market', executionMode: 'paper', quoteAsOf: '2026-10-08T14:50:00.000Z' }
        };
      } },
      outbound: { async send(message) { sent.push(message); return {}; } }
    });
    await service.handleWebhook(buyPayload, 'buy-request');
    expect(sent[0]).toMatchObject({ type: 'text' });
    expect((sent[0] as Extract<WhatsAppOutboundMessage, { type: 'text' }>).body).toContain('https://usechatdex.com/action/');
    expect((sent[0] as Extract<WhatsAppOutboundMessage, { type: 'text' }>).body).toContain('No trade has been placed');
  });

  it('sends the secure review link after a completed Buy Flow', async () => {
    const sent: WhatsAppOutboundMessage[] = [];
    const token = 'a'.repeat(43);
    const flowPayload = {
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ field: 'messages', value: { messages: [{
        id: 'wamid.flow-complete', from: '2348012345678', type: 'interactive',
        interactive: { type: 'nfm_reply', nfm_reply: { response_json: JSON.stringify({ preparation_status: 'prepared', symbol: 'NVDA', amount: '50', currency: 'USD', review_url: `https://usechatdex.com/action/${token}` }) } }
      }] } }] }]
    };
    const service = new WhatsAppMessageService({
      orchestrator: new ChatDexOrchestrator(new DemoMarketDataProvider()),
      messages: new MemoryExternalMessageStore(),
      outbound: { async send(message) { sent.push(message); return {}; } }
    });
    await expect(service.handleWebhook(flowPayload, 'flow-complete')).resolves.toMatchObject({ processed: 1 });
    expect(sent[0]).toMatchObject({ type: 'text' });
    expect((sent[0] as Extract<WhatsAppOutboundMessage, { type: 'text' }>).body).toContain(`/action/${token}`);
  });

  it('releases a failed message so Meta retry can process it', async () => {
    let attempts = 0;
    const textPayload = { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { messages: [{ id: 'wamid.retry', from: '2348012345678', type: 'text', text: { body: 'Hello' } }] } }] }] };
    const service = new WhatsAppMessageService({
      orchestrator: new ChatDexOrchestrator(new DemoMarketDataProvider()),
      messages: new MemoryExternalMessageStore(),
      outbound: { async send() { attempts += 1; if (attempts === 1) throw new Error('temporary'); return {}; } }
    });
    await expect(service.handleWebhook(textPayload, 'request-1')).rejects.toThrow('temporary');
    await expect(service.handleWebhook(textPayload, 'request-2')).resolves.toMatchObject({ processed: 1 });
    expect(attempts).toBe(2);
  });

  it('does not expose portfolio data for an unlinked phone', async () => {
    const sent: WhatsAppOutboundMessage[] = [];
    const portfolioPayload = { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { messages: [{ id: 'wamid.portfolio', from: '2348099999999', type: 'text', text: { body: "How's my portfolio?" } }] } }] }] };
    const service = new WhatsAppMessageService({
      orchestrator: new ChatDexOrchestrator(new DemoMarketDataProvider()),
      messages: new MemoryExternalMessageStore(),
      portfolio: { async snapshotForLinkedPhone() { return { linked: false }; } },
      outbound: { async send(message) { sent.push(message); return {}; } }
    });
    await service.handleWebhook(portfolioPayload, 'portfolio-request');
    expect(sent[0]).toMatchObject({ type: 'text' });
    expect((sent[0] as Extract<WhatsAppOutboundMessage, { type: 'text' }>).body).toContain('not linked');
  });
});
