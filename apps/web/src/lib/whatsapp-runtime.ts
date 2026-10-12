import { createHash, randomUUID } from 'node:crypto';
import { ClaimService, MemoryClaimRepository, type ClaimRecord } from '@chatdex/claims';
import { ChatDexOrchestrator, NormalFinanceService, WebChatService } from '@chatdex/core';
import { PostgresClaimRepository, PostgresDemoSessionRepository, PostgresExternalMessageStore, PostgresPortfolioRepository, PostgresTemplateDeliveryStore, PostgresTradeConfirmationRepository, PostgresTradeHandoffRepository, PostgresWhatsAppFlowStore, createPool, type PortfolioSnapshot } from '@chatdex/database';
import { DemoMarketDataProvider } from '@chatdex/markets';
import { MemoryTradeHandoffRepository, SecureTradeHandoffService } from '@chatdex/core';
import { MemoryTradeConfirmationRepository, PaperTradeConfirmationService, PaperTradingProvider } from '@chatdex/trading';
import { BuyFlowService, MemoryExternalMessageStore, MemoryWhatsAppFlowStore, WhatsAppCloudClient, WhatsAppMessageService, WhatsAppTemplateRegistry, WhatsAppTemplateService } from '@chatdex/whatsapp';
import type { TradeReceipt } from '@chatdex/trading';
import { env, requireClaimEnv, requireHandoffEnv, whatsappBuyFlowId } from './env';

const globalRuntime = globalThis as typeof globalThis & {
  chatdexWhatsAppService?: WhatsAppMessageService;
  chatdexBuyFlowService?: BuyFlowService;
  chatdexHandoffService?: SecureTradeHandoffService;
  chatdexHandoffRepository?: MemoryTradeHandoffRepository | PostgresTradeHandoffRepository;
  chatdexConfirmationService?: PaperTradeConfirmationService;
  chatdexTemplateService?: WhatsAppTemplateService;
  chatdexTemplateDeliveries?: PostgresTemplateDeliveryStore;
  chatdexWebChatService?: WebChatService;
  chatdexNormalFinanceService?: NormalFinanceService;
  chatdexClaimService?: ClaimService;
};

const pool = env.DATABASE_URL ? createPool(env.DATABASE_URL) : undefined;

export function getWhatsAppMessageService() {
  if (globalRuntime.chatdexWhatsAppService) return globalRuntime.chatdexWhatsAppService;

  const messages = pool
    ? new PostgresExternalMessageStore(pool)
    : new MemoryExternalMessageStore();

  const outbound = new WhatsAppCloudClient({
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    graphApiVersion: env.WHATSAPP_GRAPH_API_VERSION,
    flowId: whatsappBuyFlowId
  });

  const deliveryStatuses = pool ? new PostgresTemplateDeliveryStore(pool) : undefined;

  globalRuntime.chatdexWhatsAppService = new WhatsAppMessageService({
    orchestrator: new ChatDexOrchestrator(new DemoMarketDataProvider()),
    messages,
    outbound,
    portfolio: pool ? new PostgresPortfolioRepository(pool) : undefined,
    handoffs: {
      prepare(intent, idempotencyKey, identity) {
        return getTradeHandoffService().prepare(intent, idempotencyKey, identity);
      }
    },
    deliveryStatuses,
    flowId: whatsappBuyFlowId
  });
  return globalRuntime.chatdexWhatsAppService;
}

export function getBuyFlowService() {
  if (globalRuntime.chatdexBuyFlowService) return globalRuntime.chatdexBuyFlowService;
  const store = pool ? new PostgresWhatsAppFlowStore(pool) : new MemoryWhatsAppFlowStore();
  globalRuntime.chatdexBuyFlowService = new BuyFlowService(store, getTradeHandoffService());
  return globalRuntime.chatdexBuyFlowService;
}

export function getTradeHandoffService() {
  if (globalRuntime.chatdexHandoffService) return globalRuntime.chatdexHandoffService;
  const repository = pool ? new PostgresTradeHandoffRepository(pool) : new MemoryTradeHandoffRepository();
  globalRuntime.chatdexHandoffRepository = repository;
  globalRuntime.chatdexHandoffService = new SecureTradeHandoffService(
    new DemoMarketDataProvider(),
    repository,
    requireHandoffEnv()
  );
  return globalRuntime.chatdexHandoffService;
}

export function getPaperTradeConfirmationService() {
  if (globalRuntime.chatdexConfirmationService) return globalRuntime.chatdexConfirmationService;
  const handoffs = getTradeHandoffService();
  const confirmations = pool ? new PostgresTradeConfirmationRepository(pool) : new MemoryTradeConfirmationRepository();
  globalRuntime.chatdexConfirmationService = new PaperTradeConfirmationService(
    handoffs,
    new DemoMarketDataProvider(),
    new PaperTradingProvider(),
    confirmations
  );
  return globalRuntime.chatdexConfirmationService;
}

export function getWebChatService() {
  if (globalRuntime.chatdexWebChatService) return globalRuntime.chatdexWebChatService;
  const portfolios = pool
    ? new PostgresPortfolioRepository(pool)
    : { async snapshot() { return { totalValue: '0.00', unrealizedPnl: '0.00', positions: [], activity: [] }; } };
  globalRuntime.chatdexWebChatService = new WebChatService(
    new ChatDexOrchestrator(new DemoMarketDataProvider()),
    portfolios,
    { prepare(intent, idempotencyKey, identity) { return getTradeHandoffService().prepare(intent, idempotencyKey, identity); } }
  );
  return globalRuntime.chatdexWebChatService;
}

export function getNormalFinanceService() {
  if (globalRuntime.chatdexNormalFinanceService) return globalRuntime.chatdexNormalFinanceService;
  globalRuntime.chatdexNormalFinanceService = new NormalFinanceService(
    new DemoMarketDataProvider(),
    { prepare(intent, idempotencyKey, identity) { return getTradeHandoffService().prepare(intent, idempotencyKey, identity); } }
  );
  return globalRuntime.chatdexNormalFinanceService;
}

export function getClaimService() {
  if (globalRuntime.chatdexClaimService) return globalRuntime.chatdexClaimService;
  const repository = pool ? new PostgresClaimRepository(pool) : new MemoryClaimRepository();
  globalRuntime.chatdexClaimService = new ClaimService(requireClaimEnv().tokenSecret, repository);
  return globalRuntime.chatdexClaimService;
}

function getOrderTemplateService() {
  if (!pool) return undefined;
  if (globalRuntime.chatdexTemplateService && globalRuntime.chatdexTemplateDeliveries) {
    return { service: globalRuntime.chatdexTemplateService, deliveries: globalRuntime.chatdexTemplateDeliveries };
  }
  const deliveries = new PostgresTemplateDeliveryStore(pool);
  const outbound = new WhatsAppCloudClient({
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    graphApiVersion: env.WHATSAPP_GRAPH_API_VERSION,
    flowId: whatsappBuyFlowId
  });
  const service = new WhatsAppTemplateService(
    new WhatsAppTemplateRegistry({
      order_receipt_update: env.WHATSAPP_TEMPLATE_ORDER_UPDATE,
      claim_update: env.WHATSAPP_TEMPLATE_CLAIM_UPDATE
    }),
    outbound,
    deliveries
  );
  globalRuntime.chatdexTemplateService = service;
  globalRuntime.chatdexTemplateDeliveries = deliveries;
  return { service, deliveries };
}

export async function notifyOrderReceipt(token: string, userId: string, receipt: TradeReceipt) {
  const templates = getOrderTemplateService();
  if (!templates) return { status: 'skipped' as const, reason: 'database_unavailable' as const };
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const recipient = await templates.deliveries.recipientForHandoff(tokenHash, userId);
  if (!recipient) return { status: 'skipped' as const, reason: 'recipient_unavailable' as const };
  return templates.service.send({
    idempotencyKey: `order-receipt:${receipt.reference}`,
    key: 'order_receipt_update',
    recipient,
    variables: {
      reference: receipt.reference,
      symbol: receipt.symbol,
      amount: receipt.amount,
      currency: receipt.currency,
      status: receipt.status
    }
  });
}

export async function notifyClaimUpdate(recipient: string, claim: ClaimRecord, status: string, actionUrl: string) {
  const templates = getOrderTemplateService();
  if (!templates) return { status: 'skipped' as const, reason: 'database_unavailable' as const };
  return templates.service.send({
    idempotencyKey: `claim:${claim.id}:${status}`,
    key: 'claim_update', recipient,
    variables: { reference: `CLM-${claim.id.slice(0, 8).toUpperCase()}`, status, amount: claim.amount, currency: claim.currency, actionUrl }
  });
}

export async function getPortfolioSnapshot(userId: string): Promise<PortfolioSnapshot> {
  if (!pool) return { totalValue: '0.00', unrealizedPnl: '0.00', positions: [], activity: [] };
  return new PostgresPortfolioRepository(pool).snapshot(userId);
}

export async function createFreshDemoUser() {
  if (!pool) return randomUUID();
  return new PostgresDemoSessionRepository(pool).createFresh();
}

const safeDatabaseCodes = new Set([
  '08006', '22P02', '3D000', '42501', '42601', '42703', '42P01',
  '53300', '57P01', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
]);

export function getDatabaseFailureCode(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code ?? '')
    : '';
  return safeDatabaseCodes.has(code) ? code : 'DATABASE_QUERY_FAILED';
}

export async function getDatabaseReadiness() {
  if (!pool) return { configured: false, ready: false };
  const result = await pool.query<{ positions: string | null; receipts: string | null; users: string | null }>(
    `SELECT to_regclass('public.positions')::text AS positions,
            to_regclass('public.receipts')::text AS receipts,
            to_regclass('public.users')::text AS users`
  );
  if (!result.rows[0]?.positions || !result.rows[0]?.receipts || !result.rows[0]?.users) {
    return { configured: true, ready: false };
  }
  return { configured: true, ready: true };
}
