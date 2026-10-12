import {
  constants,
  createCipheriv,
  createDecipheriv,
  generateKeyPairSync,
  publicEncrypt,
  randomBytes
} from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BuyFlowService, MemoryWhatsAppFlowStore, decryptFlowRequest, encryptFlowResponse } from './flows';

const passphrase = 'test-only-passphrase';
const keys = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase }
});

function encryptedRequest(body: unknown) {
  const aesKey = randomBytes(16);
  const initialVector = randomBytes(16);
  const cipher = createCipheriv('aes-128-gcm', aesKey, initialVector);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(body), 'utf8'), cipher.final(), cipher.getAuthTag()]);
  return {
    envelope: {
      encrypted_aes_key: publicEncrypt(
        { key: keys.publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        aesKey
      ).toString('base64'),
      encrypted_flow_data: ciphertext.toString('base64'),
      initial_vector: initialVector.toString('base64')
    },
    aesKey,
    initialVector
  };
}

function decryptResponse(value: string, aesKey: Buffer, initialVector: Buffer) {
  const encrypted = Buffer.from(value, 'base64');
  const flippedIv = Buffer.from(initialVector.map((byte) => ~byte));
  const decipher = createDecipheriv('aes-128-gcm', aesKey, flippedIv);
  decipher.setAuthTag(encrypted.subarray(-16));
  const plaintext = Buffer.concat([decipher.update(encrypted.subarray(0, -16)), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

describe('WhatsApp Buy Flow endpoint protocol', () => {
  it('round-trips Meta-compatible RSA/AES encryption for a health check', async () => {
    const input = encryptedRequest({ version: '3.0', action: 'ping', data: {} });
    const decrypted = decryptFlowRequest(input.envelope, keys.privateKey, passphrase);
    const result = await new BuyFlowService(new MemoryWhatsAppFlowStore()).handle(decrypted.request);
    expect(decryptResponse(encryptFlowResponse(result, decrypted.crypto), input.aesKey, input.initialVector)).toEqual({ data: { status: 'active' } });
  });

  it('prepares one canonical buy intent and treats a repeated token idempotently', async () => {
    const store = new MemoryWhatsAppFlowStore();
    const service = new BuyFlowService(store);
    const request = {
      version: '3.0', action: 'data_exchange' as const, screen: 'BUY_ASSET',
      flow_token: 'flow-token-at-least-16-characters', data: { symbol: 'nvda', amount: 50, currency: 'usd' }
    };
    await expect(service.handle(request)).resolves.toMatchObject({ screen: 'REVIEW_BUY', data: { symbol: 'NVDA', amount: '50', currency: 'USD', summary: 'NVDA · USD 50', execution_notice: 'Paper trade. Your order is prepared but has not been placed.', preparation_status: 'prepared' } });
    await expect(service.handle(request)).resolves.toMatchObject({ data: { preparation_status: 'already_prepared' } });
    expect(store.intents).toHaveLength(1);
    expect([...store.intents.values()][0]).toMatchObject({ type: 'TRADE.BUY', source: 'whatsapp_flow' });
  });

  it('provides complete display data when opening the buy screen', async () => {
    const service = new BuyFlowService(new MemoryWhatsAppFlowStore());
    await expect(service.handle({ version: '3.0', action: 'navigate', data: { symbol: 'nvda' } })).resolves.toEqual({
      screen: 'BUY_ASSET',
      data: { symbol: 'NVDA', currency: 'USD', symbol_heading: 'Buy NVDA', amount_label: 'Amount (USD)' }
    });
  });

  it('rejects tampered fields and does not persist an intent', async () => {
    const store = new MemoryWhatsAppFlowStore();
    const service = new BuyFlowService(store);
    await expect(service.handle({
      version: '3.0', action: 'data_exchange', screen: 'BUY_ASSET',
      flow_token: 'flow-token-at-least-16-characters', data: { symbol: 'NVDA', amount: '1000000', currency: 'USD' }
    })).rejects.toThrow();
    expect(store.intents).toHaveLength(0);
  });

  it('rejects altered encrypted data before parsing', () => {
    const input = encryptedRequest({ version: '3.0', action: 'ping', data: {} });
    const bytes = Buffer.from(input.envelope.encrypted_flow_data, 'base64');
    bytes[0] ^= 1;
    expect(() => decryptFlowRequest({ ...input.envelope, encrypted_flow_data: bytes.toString('base64') }, keys.privateKey, passphrase)).toThrow();
  });
});
