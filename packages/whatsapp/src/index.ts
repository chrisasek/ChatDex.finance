import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { parseTextIntent } from '@chatdex/intents';
import type { ChatDexOrchestrator, OrchestratorResult, PreparedHandoff } from '@chatdex/core';
import type { TradeBuyIntent } from '@chatdex/intents';
import type { TemplateOutboundMessage } from './templates';

export * from './flows';
export * from './templates';

export type NormalizedMessage = {
  source: 'whatsapp_conversation' | 'whatsapp_flow';
  externalMessageId: string;
  phone: string;
  text?: string;
  structuredInput?: Record<string, unknown>;
  context?: Record<string, unknown>;
};

const webhookSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(z.object({
    changes: z.array(z.object({
      field: z.literal('messages'),
      value: z.object({
        messages: z.array(z.object({
          id: z.string().min(1),
          from: z.string().min(5),
          type: z.string(),
          text: z.object({ body: z.string() }).optional(),
          interactive: z.object({
            type: z.string(),
            button_reply: z.object({ id: z.string(), title: z.string() }).optional(),
            list_reply: z.object({ id: z.string(), title: z.string() }).optional(),
            nfm_reply: z.object({ response_json: z.string(), body: z.string().optional() }).optional()
          }).optional()
        })).optional(),
        statuses: z.array(z.object({ id: z.string().min(1), status: z.enum(['sent', 'delivered', 'read', 'failed']) })).optional()
      }).passthrough()
    })).default([])
  })).default([])
});

export function verifyWebhookChallenge(params: URLSearchParams, expectedToken: string) {
  const ok = params.get('hub.mode') === 'subscribe' && params.get('hub.verify_token') === expectedToken;
  return { ok, challenge: ok ? (params.get('hub.challenge') ?? '') : '' };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, appSecret: string) {
  if (!signature?.startsWith('sha256=')) return false;
  const supplied = signature.slice(7);
  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  if (!/^[0-9a-f]{64}$/i.test(supplied) || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
}

export function normalizeWebhook(payload: unknown): NormalizedMessage[] {
  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) return [];
  const normalized: NormalizedMessage[] = [];
  for (const entry of parsed.data.entry) for (const change of entry.changes) {
    for (const message of change.value.messages ?? []) {
      const interactiveText = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title;
      const text = message.text?.body ?? interactiveText;
      const flowResponse = message.interactive?.nfm_reply?.response_json;
      if (flowResponse) {
        try {
          normalized.push({ source: 'whatsapp_flow', externalMessageId: message.id, phone: message.from, structuredInput: JSON.parse(flowResponse) as Record<string, unknown> });
        } catch {
          continue;
        }
      } else if (text) normalized.push({ source: 'whatsapp_conversation', externalMessageId: message.id, phone: message.from, text });
    }
  }
  return normalized;
}

export function normalizeDeliveryStatuses(payload: unknown) {
  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) return [];
  return parsed.data.entry.flatMap((entry) => entry.changes.flatMap((change) =>
    (change.value.statuses ?? []).map((status) => ({ externalMessageId: status.id, status: status.status }))
  ));
}

export interface ExternalMessageStore {
  claim(message: NormalizedMessage): Promise<boolean>;
  complete(externalMessageId: string): Promise<void>;
  fail(externalMessageId: string): Promise<void>;
}

export class MemoryExternalMessageStore implements ExternalMessageStore {
  private readonly claimed = new Set<string>();
  async claim(message: NormalizedMessage) {
    if (this.claimed.has(message.externalMessageId)) return false;
    this.claimed.add(message.externalMessageId);
    return true;
  }
  async complete() {}
  async fail(externalMessageId: string) { this.claimed.delete(externalMessageId); }
}

export type WhatsAppOutboundMessage =
  | { type: 'text'; to: string; body: string }
  | { type: 'interactive'; to: string; body: string; button: { id: string; title: string; flowId?: string; flowToken?: string; flowPayload?: Record<string, unknown> } }
  | Extract<TemplateOutboundMessage, { type: 'template' }>;

export interface WhatsAppOutbound { send(message: WhatsAppOutboundMessage): Promise<{ externalMessageId?: string }>; }
export interface OutboundDeliveryStatusStore {
  updateProviderStatus(externalMessageId: string, status: 'sent' | 'delivered' | 'read' | 'failed'): Promise<void>;
}
export interface PortfolioLookup {
  snapshotForLinkedPhone(phone: string): Promise<{ linked: false } | { linked: true; snapshot: { totalValue: string; unrealizedPnl: string; positions: Array<{ symbol: string; quantity: string }> } }>;
}
export interface ConversationHandoffPreparer {
  prepare(intent: TradeBuyIntent, idempotencyKey: string, identity?: { phone?: string }): Promise<PreparedHandoff>;
}

const completedBuyFlowSchema = z.object({
  preparation_status: z.enum(['prepared', 'already_prepared']),
  symbol: z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/),
  amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  currency: z.string().length(3),
  review_url: z.url().refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'usechatdex.com' && /^\/action\/[A-Za-z0-9_-]{43}$/.test(url.pathname);
  })
});

type ClientConfig = { accessToken?: string; phoneNumberId?: string; graphApiVersion: string; flowId?: string };

export class WhatsAppCloudClient implements WhatsAppOutbound {
  constructor(private readonly config: ClientConfig) {}
  async send(message: WhatsAppOutboundMessage) {
    if (!this.config.accessToken || !this.config.phoneNumberId) throw new Error('WhatsApp outbound client is not configured');
    const payload = message.type === 'text'
      ? { messaging_product: 'whatsapp', recipient_type: 'individual', to: message.to, type: 'text', text: { preview_url: false, body: message.body } }
      : message.type === 'template'
        ? {
            messaging_product: 'whatsapp', recipient_type: 'individual', to: message.to, type: 'template',
            template: {
              name: message.template.name,
              language: { code: message.template.language },
              components: [{ type: 'body', parameters: message.template.bodyParameters.map((text) => ({ type: 'text', text })) }]
            }
          }
        : this.toInteractivePayload(message);
    const response = await fetch(`https://graph.facebook.com/${this.config.graphApiVersion}/${this.config.phoneNumberId}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${this.config.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`WhatsApp Cloud API returned ${response.status}`);
    const json = z.object({ messages: z.array(z.object({ id: z.string() })).optional() }).parse(await response.json());
    return { externalMessageId: json.messages?.[0]?.id };
  }

  private toInteractivePayload(message: Extract<WhatsAppOutboundMessage, { type: 'interactive' }>) {
    if (message.button.flowId) {
      return {
        messaging_product: 'whatsapp', recipient_type: 'individual', to: message.to, type: 'interactive',
        interactive: { type: 'flow', body: { text: message.body }, action: { name: 'flow', parameters: { flow_message_version: '3', flow_token: message.button.flowToken ?? crypto.randomUUID(), flow_id: message.button.flowId, flow_cta: message.button.title, flow_action: 'navigate', flow_action_payload: { screen: 'BUY_ASSET', data: message.button.flowPayload ?? {} } } } }
      };
    }
    return {
      messaging_product: 'whatsapp', recipient_type: 'individual', to: message.to, type: 'interactive',
      interactive: { type: 'button', body: { text: message.body }, action: { buttons: [{ type: 'reply', reply: { id: message.button.id, title: message.button.title } }] } }
    };
  }
}

export function renderResult(to: string, result: OrchestratorResult, flowId?: string): WhatsAppOutboundMessage {
  if (result.kind === 'market') {
    const change = Number(result.card.changePercent);
    const direction = change >= 0 ? 'up' : 'down';
    const body = `${result.card.symbol} · ${result.card.name}\n$${result.card.price} ${result.card.currency} · ${direction} ${Math.abs(change).toFixed(2)}% today\nDemo market data`;
    return {
      type: 'interactive', to, body,
      button: flowId
        ? { id: `prepare_buy:${result.card.symbol}`, title: 'Buy', flowId, flowToken: crypto.randomUUID(), flowPayload: { symbol: result.card.symbol, currency: result.card.currency, symbol_heading: `Buy ${result.card.symbol}`, amount_label: `Amount (${result.card.currency})` } }
        : { id: `prepare_buy:${result.card.symbol}`, title: 'Buy' }
    };
  }
  if (result.kind === 'not_found') return { type: 'text', to, body: result.message };
  return { type: 'text', to, body: result.prompt };
}

export class WhatsAppMessageService {
  constructor(private readonly deps: { orchestrator: ChatDexOrchestrator; messages: ExternalMessageStore; outbound: WhatsAppOutbound; portfolio?: PortfolioLookup; handoffs?: ConversationHandoffPreparer; deliveryStatuses?: OutboundDeliveryStatusStore; flowId?: string }) {}

  async handleWebhook(payload: unknown, correlationId: string) {
    const deliveryStatuses = normalizeDeliveryStatuses(payload);
    if (this.deps.deliveryStatuses) {
      for (const delivery of deliveryStatuses) {
        await this.deps.deliveryStatuses.updateProviderStatus(delivery.externalMessageId, delivery.status);
      }
    }
    const inbound = normalizeWebhook(payload);
    let processed = 0;
    for (const message of inbound) {
      if (!(await this.deps.messages.claim(message))) continue;
      try {
        if (message.source === 'whatsapp_flow' && message.structuredInput) {
          const completion = completedBuyFlowSchema.parse(message.structuredInput);
          await this.deps.outbound.send({
            type: 'text',
            to: message.phone,
            body: `${completion.symbol} paper buy prepared · ${completion.currency} ${completion.amount}\nReview & Buy: ${completion.review_url}\nNo trade has been placed.`
          });
          await this.deps.messages.complete(message.externalMessageId);
          processed += 1;
          continue;
        }
        const parsed = parseTextIntent(message.text ?? '', 'whatsapp_conversation');
        if (parsed.kind !== 'intent') {
          await this.deps.outbound.send({ type: 'text', to: message.phone, body: parsed.prompt });
        } else if (parsed.intent.type === 'PORTFOLIO.VIEW') {
          const result = this.deps.portfolio ? await this.deps.portfolio.snapshotForLinkedPhone(message.phone) : { linked: false as const };
          if (!result.linked) {
            await this.deps.outbound.send({ type: 'text', to: message.phone, body: 'Your WhatsApp number is not linked to a ChatDex account. Open ChatDex to sign in before viewing private portfolio data.' });
          } else {
            const positions = result.snapshot.positions.slice(0, 3).map((position) => `${position.quantity} ${position.symbol}`).join(', ') || 'No positions yet';
            await this.deps.outbound.send({ type: 'text', to: message.phone, body: `Demo portfolio · $${result.snapshot.totalValue}\nUnrealized P&L: $${result.snapshot.unrealizedPnl}\n${positions}\nPaper data` });
          }
        } else if (parsed.intent.type === 'TRADE.BUY') {
          if (!this.deps.handoffs) {
            await this.deps.outbound.send({ type: 'text', to: message.phone, body: 'Your buy request is ready for preparation, but secure review is temporarily unavailable. No trade has been placed.' });
          } else {
            const handoff = await this.deps.handoffs.prepare(
              parsed.intent,
              `whatsapp-conversation:${message.externalMessageId}`,
              { phone: message.phone }
            );
            await this.deps.outbound.send({
              type: 'text',
              to: message.phone,
              body: `${parsed.intent.instrument.symbol} paper buy prepared · $${handoff.preview.amount}\nReview & Buy: ${handoff.reviewUrl}\nExpires ${new Date(handoff.expiresAt).toISOString()}\nNo trade has been placed.`
            });
          }
        } else {
          const result = await this.deps.orchestrator.handle(parsed.intent);
          const outbound = renderResult(message.phone, result, this.deps.flowId);
          try {
            await this.deps.outbound.send(outbound);
          } catch (error) {
            if (result.kind !== 'market' || outbound.type !== 'interactive') throw error;
            await this.deps.outbound.send({
              type: 'text',
              to: message.phone,
              body: `${outbound.body}\nReply “Buy $50 ${result.card.symbol}” to prepare a paper order.`
            });
          }
        }
        await this.deps.messages.complete(message.externalMessageId);
        processed += 1;
      } catch (error) {
        await this.deps.messages.fail(message.externalMessageId);
        throw error;
      }
    }
    return { accepted: inbound.length, processed, deliveryStatuses: deliveryStatuses.length, correlationId };
  }
}
