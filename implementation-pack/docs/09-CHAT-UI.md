# 09 — Chat UI

Chat is `/app` and is the default authenticated surface.

## Components
- greeting/context summary
- message bubbles
- ChatDex cards
- reply chips
- Quick Actions
- contextual prompt chips
- composer
- loading/typing state
- Chat/Home switch

## Quick Actions
Start with Buy, Send, Markets, Portfolio. A Quick Action creates an Intent directly; it does not fake a text message first. The resulting order/receipt can still appear in the conversation timeline.

## Context
Chat accepts optional screen context from Normal View, e.g. `{type:'instrument', symbol:'NVDA'}`. Resolve pronouns like “this” only when context is unambiguous.

## Design rule
One card, one primary job. Keep cards glanceable and action count small.
