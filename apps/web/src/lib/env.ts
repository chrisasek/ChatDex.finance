import { z } from 'zod';

const optionalNonEmpty = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().trim().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: optionalNonEmpty,
  APP_URL: z.url().default('http://localhost:3000'),
  DEMO_MODE: z.enum(['true', 'false']).default('true'),
  HANDOFF_TOKEN_SECRET: optionalNonEmpty,
  CLAIM_TOKEN_SECRET: optionalNonEmpty,
  SESSION_SECRET: optionalNonEmpty,
  WHATSAPP_ACCESS_TOKEN: optionalNonEmpty,
  WHATSAPP_PHONE_NUMBER_ID: optionalNonEmpty,
  WHATSAPP_VERIFY_TOKEN: optionalNonEmpty,
  WHATSAPP_APP_SECRET: optionalNonEmpty,
  WHATSAPP_GRAPH_API_VERSION: z.string().default('v23.0'),
  WHATSAPP_BUY_FLOW_ID: optionalNonEmpty,
  WHATSAPP_FLOW_ID: optionalNonEmpty,
  WHATSAPP_FLOW_PRIVATE_KEY: optionalNonEmpty,
  WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE: optionalNonEmpty,
  WHATSAPP_TEMPLATE_ORDER_UPDATE: optionalNonEmpty,
  WHATSAPP_TEMPLATE_CLAIM_UPDATE: optionalNonEmpty
});

export const env = envSchema.parse(process.env);
export const whatsappBuyFlowId = env.WHATSAPP_BUY_FLOW_ID ?? env.WHATSAPP_FLOW_ID;

export function requireWhatsAppWebhookEnv() {
  if (!env.WHATSAPP_VERIFY_TOKEN || !env.WHATSAPP_APP_SECRET) {
    throw new Error('WhatsApp webhook environment is not configured');
  }
  return { verifyToken: env.WHATSAPP_VERIFY_TOKEN, appSecret: env.WHATSAPP_APP_SECRET };
}

export function requireWhatsAppFlowEnv() {
  const webhook = requireWhatsAppWebhookEnv();
  if (!env.WHATSAPP_FLOW_PRIVATE_KEY) throw new Error('WhatsApp Flow private key is not configured');
  return {
    ...webhook,
    privateKey: env.WHATSAPP_FLOW_PRIVATE_KEY,
    passphrase: env.WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE
  };
}

export function requireHandoffEnv() {
  if (!env.HANDOFF_TOKEN_SECRET || env.HANDOFF_TOKEN_SECRET.length < 32) {
    throw new Error('HANDOFF_TOKEN_SECRET must contain at least 32 characters');
  }
  return { tokenSecret: env.HANDOFF_TOKEN_SECRET, appUrl: env.APP_URL };
}

export function requireClaimEnv() {
  const tokenSecret = env.CLAIM_TOKEN_SECRET ?? env.HANDOFF_TOKEN_SECRET;
  if (!tokenSecret || tokenSecret.length < 32) throw new Error('CLAIM_TOKEN_SECRET or HANDOFF_TOKEN_SECRET must contain at least 32 characters');
  return { tokenSecret, appUrl: env.APP_URL };
}

export function requireSessionEnv() {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters');
  }
  return { sessionSecret: env.SESSION_SECRET };
}
