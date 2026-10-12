import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import type { TradeBuyIntent } from '@chatdex/intents';
import type { HandoffRecord, TradeHandoffRepository, TradePreview } from '@chatdex/core';
import type { PaperExecution, TradeConfirmationRepository, TradeReceipt } from '@chatdex/trading';
import type { ClaimRecord, ClaimRepository } from '@chatdex/claims';

type InboundExternalMessage = {
  source: string;
  externalMessageId: string;
  phone: string;
};

export function createPool(connectionString: string) {
  // Shared cPanel PostgreSQL plans commonly allow very few concurrent
  // connections. Keep the V0 modular monolith on one reusable connection;
  // the pool still queues concurrent requests safely.
  return new Pool({ connectionString, max: 1, idleTimeoutMillis: 30_000 });
}

export type PortfolioPosition = {
  symbol: string; name: string; quantity: string; averageEntry: string;
  currentPrice: string; marketValue: string; unrealizedPnl: string;
};
export type PortfolioActivity = {
  reference: string; symbol: string; amount: string; quantity: string;
  price: string; fee: string; status: string; executionMode: string; executedAt: string;
};
export type PortfolioSnapshot = {
  totalValue: string; unrealizedPnl: string;
  positions: PortfolioPosition[]; activity: PortfolioActivity[];
};

export class PostgresDemoSessionRepository {
  constructor(private readonly pool: Pool) {}

  async createFresh(): Promise<string> {
    const userId = randomUUID();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO users (id, phone, name, country_code, status)
         VALUES ($1, $2, 'Demo Investor', 'ZZ', 'active')`,
        [userId, `demo:${userId}`],
      );
      await client.query(
        `INSERT INTO positions (user_id, instrument_id, quantity, avg_entry, current_price)
         SELECT $1, id, 0.50000000, 176.00000000, 182.51000000
         FROM instruments WHERE symbol = 'NVDA'
         ON CONFLICT (user_id, instrument_id) DO NOTHING`,
        [userId],
      );
      await client.query('COMMIT');
      return userId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export class PostgresPortfolioRepository {
  constructor(private readonly pool: Pool) {}

  async snapshot(userId: string): Promise<PortfolioSnapshot> {
    const positionsResult = await this.pool.query<{
        symbol: string; name: string; quantity: string; avg_entry: string; current_price: string;
        market_value: string; unrealized_pnl: string;
      }>(
        `SELECT i.symbol, i.name, p.quantity::text, p.avg_entry::text, p.current_price::text,
                (p.quantity * p.current_price)::text AS market_value,
                ((p.current_price - p.avg_entry) * p.quantity)::text AS unrealized_pnl
         FROM positions p JOIN instruments i ON i.id = p.instrument_id
         WHERE p.user_id = $1 ORDER BY (p.quantity * p.current_price) DESC`,
        [userId],
      );
    const receiptsResult = await this.pool.query<{ payload_json: PortfolioActivity }>(
      `SELECT payload_json FROM receipts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25`,
      [userId],
    );
    const positions = positionsResult.rows.map((row) => ({
      symbol: row.symbol, name: row.name, quantity: row.quantity,
      averageEntry: row.avg_entry, currentPrice: row.current_price,
      marketValue: Number(row.market_value).toFixed(2), unrealizedPnl: Number(row.unrealized_pnl).toFixed(2),
    }));
    const totalValue = positions.reduce((sum, row) => sum + Number(row.marketValue), 0).toFixed(2);
    const unrealizedPnl = positions.reduce((sum, row) => sum + Number(row.unrealizedPnl), 0).toFixed(2);
    return { totalValue, unrealizedPnl, positions, activity: receiptsResult.rows.map((row) => row.payload_json) };
  }

  async snapshotForLinkedPhone(phone: string): Promise<{ linked: false } | { linked: true; snapshot: PortfolioSnapshot }> {
    const normalized = phone.startsWith('+') ? phone : `+${phone}`;
    const user = await this.pool.query<{ id: string }>('SELECT id FROM users WHERE phone = $1 AND status = \'active\'', [normalized]);
    if (!user.rowCount) return { linked: false };
    return { linked: true, snapshot: await this.snapshot(user.rows[0].id) };
  }
}

type ClaimRow = {
  id: string; token_hash: string; sender_id: string; recipient_phone: string | null;
  amount: string; currency: string; status: ClaimRecord['status']; expires_at: Date;
  claimed_by: string | null; claimed_at: Date | null; sender_name: string | null;
};

function mapClaim(row: ClaimRow): ClaimRecord {
  return {
    id: row.id, tokenHash: row.token_hash, senderId: row.sender_id,
    recipientPhone: row.recipient_phone ?? undefined, amount: Number(row.amount).toFixed(2),
    currency: row.currency, status: row.status, expiresAt: row.expires_at.toISOString(),
    claimedBy: row.claimed_by ?? undefined, claimedAt: row.claimed_at?.toISOString(),
    senderName: row.sender_name ?? undefined
  };
}

export class PostgresClaimRepository implements ClaimRepository {
  constructor(private readonly pool: Pool) {}

  async create(record: ClaimRecord) {
    await this.pool.query(
      `INSERT INTO claims (id, token_hash, sender_id, recipient_phone, amount, currency, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [record.id, record.tokenHash, record.senderId, record.recipientPhone ?? null, record.amount, record.currency, record.status, record.expiresAt]
    );
  }

  async find(tokenHash: string) {
    const result = await this.pool.query<ClaimRow>(
      `SELECT c.id, c.token_hash, c.sender_id, c.recipient_phone, c.amount::text, c.currency,
              c.status, c.expires_at, c.claimed_by, c.claimed_at, u.name AS sender_name
       FROM claims c JOIN users u ON u.id = c.sender_id WHERE c.token_hash = $1`,
      [tokenHash]
    );
    return result.rows[0] ? mapClaim(result.rows[0]) : null;
  }

  async claim(tokenHash: string, userId: string, now: Date) {
    const result = await this.pool.query<ClaimRow>(
      `UPDATE claims c SET status = 'claimed', claimed_by = $2, claimed_at = $3
       FROM users recipient, users sender
       WHERE c.token_hash = $1 AND c.status = 'pending' AND c.expires_at > $3
         AND recipient.id = $2 AND recipient.status = 'active' AND sender.id = c.sender_id
         AND c.sender_id <> $2
         AND (c.recipient_phone IS NULL OR c.recipient_phone = recipient.phone)
       RETURNING c.id, c.token_hash, c.sender_id, c.recipient_phone, c.amount::text, c.currency,
                 c.status, c.expires_at, c.claimed_by, c.claimed_at, sender.name AS sender_name`,
      [tokenHash, userId, now]
    );
    return result.rows[0] ? mapClaim(result.rows[0]) : null;
  }
}

export class PostgresExternalMessageStore {
  constructor(private readonly pool: Pool) {}

  async claim(message: InboundExternalMessage): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO external_messages
        (provider, external_message_id, sender_phone, direction, status, metadata_json)
       VALUES ('whatsapp', $1, $2, 'inbound', 'processing', $3::jsonb)
       ON CONFLICT (provider, external_message_id) DO UPDATE SET status = 'processing'
       WHERE external_messages.status = 'failed'
       RETURNING id`,
      [message.externalMessageId, message.phone, JSON.stringify({ source: message.source })]
    );
    return result.rowCount === 1;
  }

  async complete(externalMessageId: string): Promise<void> {
    await this.pool.query(
      `UPDATE external_messages SET status = 'completed' WHERE provider = 'whatsapp' AND external_message_id = $1`,
      [externalMessageId]
    );
  }

  async fail(externalMessageId: string): Promise<void> {
    await this.pool.query(
      `UPDATE external_messages SET status = 'failed' WHERE provider = 'whatsapp' AND external_message_id = $1`,
      [externalMessageId]
    );
  }
}

type TemplateDeliveryInput = {
  idempotencyKey: string;
  key: 'order_receipt_update' | 'claim_update';
  recipient: string;
  providerName?: string;
  variables: unknown;
};

export class PostgresTemplateDeliveryStore {
  constructor(private readonly pool: Pool) {}

  async claim(input: TemplateDeliveryInput): Promise<'claimed' | 'duplicate'> {
    const result = await this.pool.query(
      `INSERT INTO template_deliveries
        (idempotency_key, template_key, provider_template_name, recipient_phone, status, variables_json)
       VALUES ($1, $2, $3, $4, 'sending', $5::jsonb)
       ON CONFLICT (idempotency_key) DO UPDATE
         SET status = 'sending', provider_template_name = EXCLUDED.provider_template_name,
             variables_json = EXCLUDED.variables_json, updated_at = now()
         WHERE template_deliveries.status = 'failed'
       RETURNING id`,
      [input.idempotencyKey, input.key, input.providerName ?? null, input.recipient, JSON.stringify(input.variables)]
    );
    return result.rowCount === 1 ? 'claimed' : 'duplicate';
  }

  async complete(idempotencyKey: string, externalMessageId?: string) {
    await this.pool.query(
      `UPDATE template_deliveries
       SET status = 'sent', external_message_id = $2, updated_at = now()
       WHERE idempotency_key = $1 AND status = 'sending'`,
      [idempotencyKey, externalMessageId ?? null]
    );
  }

  async fail(idempotencyKey: string) {
    await this.pool.query(
      `UPDATE template_deliveries SET status = 'failed', updated_at = now()
       WHERE idempotency_key = $1 AND status = 'sending'`,
      [idempotencyKey]
    );
  }

  async updateProviderStatus(externalMessageId: string, status: 'sent' | 'delivered' | 'read' | 'failed') {
    await this.pool.query(
      `UPDATE template_deliveries
       SET status = CASE
         WHEN $2 = 'failed' THEN 'failed'
         WHEN template_deliveries.status = 'read' THEN 'read'
         WHEN template_deliveries.status = 'delivered' AND $2 = 'sent' THEN 'delivered'
         ELSE $2
       END,
       updated_at = now()
       WHERE external_message_id = $1`,
      [externalMessageId, status]
    );
  }

  async recipientForHandoff(tokenHash: string, userId: string) {
    const result = await this.pool.query<{ phone: string | null }>(
      `SELECT phone FROM action_handoffs
       WHERE token_hash = $1 AND user_id = $2 AND status = 'used'`,
      [tokenHash, userId]
    );
    return result.rows[0]?.phone ?? null;
  }
}

export class PostgresWhatsAppFlowStore {
  constructor(private readonly pool: Pool) {}

  async savePreparedBuy(flowToken: string, intent: TradeBuyIntent): Promise<'created' | 'duplicate'> {
    const flowTokenHash = createHash('sha256').update(flowToken).digest('hex');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const intentInsert = await client.query(
        `INSERT INTO intents (id, type, source, status, payload_json, context_json)
         VALUES ($1, $2, $3, 'ready_for_quote', $4::jsonb, $5::jsonb)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [intent.id, intent.type, intent.source, JSON.stringify(intent), JSON.stringify(intent.context ?? {})]
      );
      const sessionInsert = await client.query(
        `INSERT INTO whatsapp_flow_sessions
          (flow_key, flow_token_hash, status, input_json, intent_id, expires_at)
         VALUES ('BUY_ASSET', $1, 'submitted', $2::jsonb, $3, now() + interval '15 minutes')
         ON CONFLICT (flow_token_hash) DO NOTHING
         RETURNING id`,
        [flowTokenHash, JSON.stringify({ symbol: intent.instrument.symbol, amount: intent.amount.value, currency: intent.amount.currency }), intent.id]
      );
      if (sessionInsert.rowCount !== 1) {
        if (intentInsert.rowCount === 1) await client.query('DELETE FROM intents WHERE id = $1', [intent.id]);
        await client.query('COMMIT');
        return 'duplicate';
      }
      await client.query('COMMIT');
      return 'created';
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export class PostgresTradeHandoffRepository implements TradeHandoffRepository {
  constructor(private readonly pool: Pool) {}

  async createOrGet(record: HandoffRecord): Promise<{ expiresAt: string; preview: TradePreview }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query<{ expires_at: Date; preview_json: TradePreview }>(
        'SELECT expires_at, preview_json FROM action_handoffs WHERE token_hash = $1',
        [record.tokenHash]
      );
      if (existing.rowCount) {
        await client.query('COMMIT');
        return { expiresAt: existing.rows[0].expires_at.toISOString(), preview: existing.rows[0].preview_json };
      }

      await client.query(
        `INSERT INTO intents (id, type, source, status, payload_json, context_json)
         VALUES ($1, $2, $3, 'awaiting_confirmation', $4::jsonb, $5::jsonb)
         ON CONFLICT (id) DO UPDATE SET status = 'awaiting_confirmation', updated_at = now()`,
        [record.intent.id, record.intent.type, record.intent.source, JSON.stringify(record.intent), JSON.stringify(record.intent.context ?? {})]
      );
      const instrument = await client.query<{ id: string }>('SELECT id FROM instruments WHERE symbol = $1', [record.preview.symbol]);
      if (!instrument.rowCount) throw new Error(`Instrument ${record.preview.symbol} is not seeded`);
      const order = await client.query<{ id: string }>(
        `INSERT INTO orders
          (user_id, instrument_id, side, order_type, amount, quantity, quoted_price, status, execution_mode, provider, intent_id)
         VALUES ($1, $2, 'buy', $3, $4, $5, $6, 'awaiting_confirmation', $7, 'paper', $8)
         RETURNING id`,
        [record.userId ?? null, instrument.rows[0].id, record.preview.orderType, record.preview.amount, record.preview.estimatedQuantity, record.preview.quotedPrice, record.preview.executionMode, record.intent.id]
      );
      const inserted = await client.query(
        `INSERT INTO action_handoffs
          (token_hash, user_id, phone, intent_id, order_id, preview_json, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'pending', $7)
         ON CONFLICT (token_hash) DO NOTHING
         RETURNING id`,
        [record.tokenHash, record.userId ?? null, record.phone ?? null, record.intent.id, order.rows[0].id, JSON.stringify(record.preview), record.expiresAt]
      );
      if (!inserted.rowCount) {
        await client.query('DELETE FROM orders WHERE id = $1', [order.rows[0].id]);
        const raced = await client.query<{ expires_at: Date; preview_json: TradePreview }>(
          'SELECT expires_at, preview_json FROM action_handoffs WHERE token_hash = $1',
          [record.tokenHash]
        );
        if (!raced.rowCount) throw new Error('Handoff idempotency conflict could not be resolved');
        await client.query('COMMIT');
        return { expiresAt: raced.rows[0].expires_at.toISOString(), preview: raced.rows[0].preview_json };
      }
      await client.query('COMMIT');
      return { expiresAt: record.expiresAt, preview: record.preview };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async resolve(tokenHash: string, now: Date) {
    const result = await this.pool.query<{ status: 'pending' | 'used' | 'expired' | 'cancelled'; expires_at: Date; preview_json: TradePreview }>(
      'SELECT status, expires_at, preview_json FROM action_handoffs WHERE token_hash = $1',
      [tokenHash]
    );
    if (!result.rowCount) return { status: 'invalid' as const };
    const handoff = result.rows[0];
    if (handoff.status === 'used') return { status: 'used' as const };
    if (handoff.status !== 'pending') return { status: 'expired' as const };
    if (handoff.expires_at <= now) {
      await this.pool.query(`UPDATE action_handoffs SET status = 'expired' WHERE token_hash = $1 AND status = 'pending'`, [tokenHash]);
      return { status: 'expired' as const };
    }
    return { status: 'pending' as const, expiresAt: handoff.expires_at.toISOString(), preview: handoff.preview_json };
  }
}

export class PostgresTradeConfirmationRepository implements TradeConfirmationRepository {
  constructor(private readonly pool: Pool) {}

  async completePaper(input: { tokenHash: string; userId: string; preview: TradePreview; execution: PaperExecution; now: Date }): Promise<TradeReceipt> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{
        handoff_id: string; handoff_status: string; expires_at: Date; owner_id: string | null;
        order_id: string; instrument_id: string;
      }>(
        `SELECT h.id AS handoff_id, h.status AS handoff_status, h.expires_at, h.user_id AS owner_id,
                h.order_id, o.instrument_id
         FROM action_handoffs h
         JOIN orders o ON o.id = h.order_id
         WHERE h.token_hash = $1
         FOR UPDATE OF h, o`,
        [input.tokenHash]
      );
      if (!result.rowCount) throw new Error('Invalid handoff');
      const row = result.rows[0];
      if (row.owner_id && row.owner_id !== input.userId) throw new Error('Handoff does not belong to this user');

      if (row.handoff_status === 'used') {
        const existing = await client.query<{ payload_json: TradeReceipt }>('SELECT payload_json FROM receipts WHERE order_id = $1', [row.order_id]);
        if (!existing.rowCount) throw new Error('Completed handoff is missing its receipt');
        await client.query('COMMIT');
        return existing.rows[0].payload_json;
      }
      if (row.handoff_status !== 'pending' || row.expires_at <= input.now) throw new Error('Handoff is not confirmable');

      await client.query(
        `INSERT INTO executions (order_id, provider, external_id, price, quantity, fee, status, executed_at, metadata_json)
         VALUES ($1, 'paper', $2, $3, $4, $5, 'completed', $6, '{"demo":true}'::jsonb)
         ON CONFLICT (external_id) DO NOTHING`,
        [row.order_id, input.execution.externalId, input.execution.price, input.execution.quantity, input.execution.fee, input.execution.executedAt]
      );
      await client.query(
        `UPDATE orders SET user_id = $1, quoted_price = $2, quantity = $3, status = 'completed', updated_at = now() WHERE id = $4`,
        [input.userId, input.execution.price, input.execution.quantity, row.order_id]
      );
      await client.query(
        `INSERT INTO positions (user_id, instrument_id, quantity, avg_entry, current_price)
         VALUES ($1, $2, $3, $4, $4)
         ON CONFLICT (user_id, instrument_id) DO UPDATE SET
           avg_entry = ((positions.quantity * positions.avg_entry) + (EXCLUDED.quantity * EXCLUDED.avg_entry)) / (positions.quantity + EXCLUDED.quantity),
           quantity = positions.quantity + EXCLUDED.quantity,
           current_price = EXCLUDED.current_price,
           updated_at = now()`,
        [input.userId, row.instrument_id, input.execution.quantity, input.execution.price]
      );
      const receipt: TradeReceipt = {
        reference: `CDX-${input.execution.externalId.slice(-10).toUpperCase()}`,
        status: 'completed', executionMode: 'paper', symbol: input.preview.symbol,
        amount: input.preview.amount, currency: input.preview.currency,
        quantity: input.execution.quantity, price: input.execution.price,
        fee: input.execution.fee, executedAt: input.execution.executedAt
      };
      await client.query(
        `INSERT INTO receipts (user_id, order_id, type, reference, status, payload_json)
         VALUES ($1, $2, 'trade', $3, 'completed', $4::jsonb)
         ON CONFLICT (order_id) DO NOTHING`,
        [input.userId, row.order_id, receipt.reference, JSON.stringify(receipt)]
      );
      await client.query(
        `UPDATE action_handoffs SET user_id = $1, status = 'used', used_at = now() WHERE id = $2`,
        [input.userId, row.handoff_id]
      );
      await client.query('COMMIT');
      return receipt;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findReceipt(tokenHash: string, userId: string): Promise<TradeReceipt | null> {
    const result = await this.pool.query<{ payload_json: TradeReceipt }>(
      `SELECT r.payload_json
       FROM action_handoffs h
       JOIN receipts r ON r.order_id = h.order_id
       WHERE h.token_hash = $1 AND h.user_id = $2 AND h.status = 'used'`,
      [tokenHash, userId]
    );
    return result.rows[0]?.payload_json ?? null;
  }
}
