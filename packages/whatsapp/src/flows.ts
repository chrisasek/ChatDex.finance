import {
  constants,
  createCipheriv,
  createDecipheriv,
  createPrivateKey,
  privateDecrypt
} from 'node:crypto';
import { z } from 'zod';
import { createTradeBuyIntent, type TradeBuyIntent } from '@chatdex/intents';
import type { PreparedHandoff } from '@chatdex/core';

const encryptedRequestSchema = z.object({
  encrypted_aes_key: z.string().min(1),
  encrypted_flow_data: z.string().min(1),
  initial_vector: z.string().min(1)
});

const decryptedRequestSchema = z.object({
  version: z.string().min(1),
  action: z.enum(['ping', 'INIT', 'navigate', 'data_exchange']),
  screen: z.string().optional(),
  flow_token: z.string().min(16).max(512).optional(),
  data: z.record(z.string(), z.unknown()).default({})
});

export type WhatsAppFlowRequest = z.infer<typeof decryptedRequestSchema>;
export type FlowCryptoContext = { aesKey: Buffer; initialVector: Buffer };

export function getFlowFailureCode(error: unknown) {
  if (error instanceof z.ZodError) return 'FLOW_PAYLOAD_INVALID';
  const failure = error as { code?: string; message?: string };
  const code = String(failure?.code ?? '');
  const message = String(failure?.message ?? '').toLowerCase();
  if (code.startsWith('ERR_OSSL') && (message.includes('key') || message.includes('decrypt') || message.includes('passphrase'))) {
    return 'FLOW_PRIVATE_KEY_INVALID';
  }
  if (message.includes('aes') || message.includes('auth') || message.includes('encrypted')) return 'FLOW_DECRYPTION_FAILED';
  return 'FLOW_REQUEST_INVALID';
}

export interface WhatsAppFlowStore {
  savePreparedBuy(flowToken: string, intent: TradeBuyIntent): Promise<'created' | 'duplicate'>;
}

export interface TradeHandoffPreparer {
  prepare(intent: TradeBuyIntent, idempotencyKey: string): Promise<PreparedHandoff>;
}

export class MemoryWhatsAppFlowStore implements WhatsAppFlowStore {
  readonly intents = new Map<string, TradeBuyIntent>();
  async savePreparedBuy(flowToken: string, intent: TradeBuyIntent) {
    if (this.intents.has(flowToken)) return 'duplicate' as const;
    this.intents.set(flowToken, intent);
    return 'created' as const;
  }
}

function decodeBase64(value: string, field: string) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error(`Invalid ${field}`);
  const decoded = Buffer.from(value, 'base64');
  if (!decoded.length || decoded.toString('base64').replace(/=+$/, '') !== value.replace(/=+$/, '')) throw new Error(`Invalid ${field}`);
  return decoded;
}

export function decryptFlowRequest(
  payload: unknown,
  privateKeyPem: string,
  passphrase?: string
): { request: WhatsAppFlowRequest; crypto: FlowCryptoContext } {
  const envelope = encryptedRequestSchema.parse(payload);
  const key = createPrivateKey({ key: privateKeyPem.replace(/\\n/g, '\n'), format: 'pem', passphrase: passphrase || undefined });
  const aesKey = privateDecrypt(
    { key, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    decodeBase64(envelope.encrypted_aes_key, 'encrypted_aes_key')
  );
  if (aesKey.length !== 16) throw new Error('Flow AES key must be 128 bits');
  const initialVector = decodeBase64(envelope.initial_vector, 'initial_vector');
  if (initialVector.length !== 16) throw new Error('Flow initialization vector must be 128 bits');
  const encrypted = decodeBase64(envelope.encrypted_flow_data, 'encrypted_flow_data');
  if (encrypted.length <= 16) throw new Error('Encrypted Flow data is incomplete');
  const ciphertext = encrypted.subarray(0, -16);
  const authTag = encrypted.subarray(-16);
  const decipher = createDecipheriv('aes-128-gcm', aesKey, initialVector);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return { request: decryptedRequestSchema.parse(JSON.parse(plaintext.toString('utf8'))), crypto: { aesKey, initialVector } };
}

export function encryptFlowResponse(response: unknown, context: FlowCryptoContext) {
  const flippedIv = Buffer.from(context.initialVector.map((byte) => ~byte));
  const cipher = createCipheriv('aes-128-gcm', context.aesKey, flippedIv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(response), 'utf8'), cipher.final()]);
  return Buffer.concat([ciphertext, cipher.getAuthTag()]).toString('base64');
}

export class BuyFlowService {
  constructor(private readonly store: WhatsAppFlowStore, private readonly handoffs?: TradeHandoffPreparer) {}

  async handle(request: WhatsAppFlowRequest) {
    if (request.action === 'ping') return { data: { status: 'active' } };
    if (request.action === 'INIT' || request.action === 'navigate') {
      const symbol = typeof request.data.symbol === 'string' ? request.data.symbol.toUpperCase() : 'NVDA';
      return { screen: 'BUY_ASSET', data: { symbol, currency: 'USD', symbol_heading: `Buy ${symbol}`, amount_label: 'Amount (USD)' } };
    }
    if (request.action !== 'data_exchange' || request.screen !== 'BUY_ASSET') {
      throw new Error('Unsupported Flow transition');
    }
    if (!request.flow_token) throw new Error('Flow token is required');
    const intent = createTradeBuyIntent(
      { symbol: request.data.symbol, amount: request.data.amount, currency: request.data.currency ?? 'USD' },
      'whatsapp_flow',
      { context: { flowTokenBound: true } }
    );
    const persistence = await this.store.savePreparedBuy(request.flow_token, intent);
    const handoff = this.handoffs
      ? await this.handoffs.prepare(intent, `whatsapp-flow:${request.flow_token}`)
      : undefined;
    return {
      screen: 'REVIEW_BUY',
      data: {
        symbol: intent.instrument.symbol,
        amount: intent.amount.value,
        currency: intent.amount.currency,
        execution_mode: 'Paper trade',
        summary: `${intent.instrument.symbol} · ${intent.amount.currency} ${intent.amount.value}`,
        execution_notice: 'Paper trade. Your order is prepared but has not been placed.',
        preparation_status: persistence === 'created' ? 'prepared' : 'already_prepared',
        review_url: handoff?.reviewUrl ?? ''
      }
    };
  }
}
