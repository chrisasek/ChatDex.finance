import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@chatdex/shared': fromRoot('./packages/shared/src/index.ts'),
      '@chatdex/intents': fromRoot('./packages/intents/src/index.ts'),
      '@chatdex/markets': fromRoot('./packages/markets/src/index.ts'),
      '@chatdex/trading': fromRoot('./packages/trading/src/index.ts'),
      '@chatdex/claims': fromRoot('./packages/claims/src/index.ts'),
      '@chatdex/crypto': fromRoot('./packages/crypto/src/index.ts'),
      '@chatdex/core': fromRoot('./packages/core/src/index.ts'),
      '@chatdex/database': fromRoot('./packages/database/src/index.ts'),
      '@chatdex/whatsapp': fromRoot('./packages/whatsapp/src/index.ts')
    }
  },
  test: { environment: 'node', include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'] }
});
