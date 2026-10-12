import { z } from 'zod';

export type TemplateKey = 'order_receipt_update' | 'claim_update';

const orderReceiptVariables = z.object({
  reference: z.string().min(1),
  symbol: z.string().min(1),
  amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  currency: z.string().length(3),
  status: z.string().min(1)
});

const claimUpdateVariables = z.object({
  reference: z.string().min(1),
  amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  currency: z.string().length(3),
  status: z.string().min(1),
  actionUrl: z.url()
});

const definitions = {
  order_receipt_update: {
    variables: orderReceiptVariables,
    parameters: (value: z.infer<typeof orderReceiptVariables>) => [value.reference, value.status, value.currency, value.amount, value.symbol],
    fallback: (value: z.infer<typeof orderReceiptVariables>) => `Paper order ${value.status}: ${value.symbol} · ${value.currency} ${value.amount}\nReceipt ${value.reference}`
  },
  claim_update: {
    variables: claimUpdateVariables,
    parameters: (value: z.infer<typeof claimUpdateVariables>) => [value.reference, value.status, value.currency, value.amount],
    fallback: (value: z.infer<typeof claimUpdateVariables>) => `Demo claim ${value.status}: ${value.currency} ${value.amount}\nReference ${value.reference}\n${value.actionUrl}`
  }
} as const;

export type TemplateVariables = {
  order_receipt_update: z.infer<typeof orderReceiptVariables>;
  claim_update: z.infer<typeof claimUpdateVariables>;
};

export class WhatsAppTemplateRegistry {
  constructor(private readonly providerNames: Partial<Record<TemplateKey, string>>) {}

  resolve(key: string, variables: unknown) {
    if (!(key in definitions)) throw new Error(`Unknown WhatsApp template key: ${key}`);
    const typedKey = key as TemplateKey;
    const definition = definitions[typedKey];
    const parsed = definition.variables.parse(variables) as never;
    const providerName = this.providerNames[typedKey]?.trim();
    return providerName
      ? { mode: 'template' as const, key: typedKey, providerName, language: 'en', bodyParameters: definition.parameters(parsed) }
      : { mode: 'fallback' as const, key: typedKey, text: definition.fallback(parsed) };
  }
}

export type TemplateOutboundMessage =
  | { type: 'text'; to: string; body: string }
  | { type: 'template'; to: string; template: { name: string; language: string; bodyParameters: string[] } };

export interface TemplateOutbound {
  send(message: TemplateOutboundMessage): Promise<{ externalMessageId?: string }>;
}

export type TemplateDeliveryInput = {
  idempotencyKey: string;
  key: TemplateKey;
  recipient: string;
  providerName?: string;
  variables: unknown;
};

export interface TemplateDeliveryStore {
  claim(input: TemplateDeliveryInput): Promise<'claimed' | 'duplicate'>;
  complete(idempotencyKey: string, externalMessageId?: string): Promise<void>;
  fail(idempotencyKey: string): Promise<void>;
}

type MemoryDelivery = TemplateDeliveryInput & { status: 'sending' | 'sent' | 'failed'; externalMessageId?: string };

export class MemoryTemplateDeliveryStore implements TemplateDeliveryStore {
  readonly records = new Map<string, MemoryDelivery>();

  async claim(input: TemplateDeliveryInput) {
    const existing = this.records.get(input.idempotencyKey);
    if (existing && existing.status !== 'failed') return 'duplicate' as const;
    this.records.set(input.idempotencyKey, { ...input, status: 'sending' });
    return 'claimed' as const;
  }

  async complete(idempotencyKey: string, externalMessageId?: string) {
    const record = this.records.get(idempotencyKey);
    if (record) this.records.set(idempotencyKey, { ...record, status: 'sent', externalMessageId });
  }

  async fail(idempotencyKey: string) {
    const record = this.records.get(idempotencyKey);
    if (record) this.records.set(idempotencyKey, { ...record, status: 'failed' });
  }
}

export class WhatsAppTemplateService {
  constructor(
    private readonly registry: WhatsAppTemplateRegistry,
    private readonly outbound: TemplateOutbound,
    private readonly deliveries: TemplateDeliveryStore
  ) {}

  async send(input: { idempotencyKey: string; key: TemplateKey; recipient: string; variables: unknown }) {
    const resolved = this.registry.resolve(input.key, input.variables);
    const claimed = await this.deliveries.claim({
      ...input,
      providerName: resolved.mode === 'template' ? resolved.providerName : undefined
    });
    if (claimed === 'duplicate') return { status: 'duplicate' as const };

    try {
      const message: TemplateOutboundMessage = resolved.mode === 'template'
        ? { type: 'template', to: input.recipient, template: { name: resolved.providerName, language: resolved.language, bodyParameters: resolved.bodyParameters } }
        : { type: 'text', to: input.recipient, body: resolved.text };
      const result = await this.outbound.send(message);
      await this.deliveries.complete(input.idempotencyKey, result.externalMessageId);
      return { status: 'sent' as const, externalMessageId: result.externalMessageId };
    } catch (error) {
      await this.deliveries.fail(input.idempotencyKey);
      throw error;
    }
  }
}
