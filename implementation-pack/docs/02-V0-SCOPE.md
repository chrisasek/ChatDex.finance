# 02 — V0 Scope

## Must ship
- Small marketing landing page
- Basic phone-number onboarding/session
- WhatsApp webhook + interface adapter
- WhatsApp free-form market lookup: e.g. `How is NVDA doing?`
- WhatsApp portfolio summary: `How's my portfolio?`
- WhatsApp free-form trade intent: `Buy $50 NVDA`
- Three-level WhatsApp routing policy: information stays in WhatsApp; preparation uses Conversation/Flow; execution/sensitive actions use secure WebApp handoff
- **One V0 WhatsApp Buy Flow** that can collect/confirm the structured fields needed to prepare a stock buy intent (at minimum symbol/context + amount; NVDA/$50 is the demo path)
- Flow data exchange/endpoint handling required by the chosen Meta setup
- **Small approved V0 Template set** only: transaction/order/receipt update and claim/update messaging as needed for the demo; do not build a marketing campaign system
- Order preview response with secure `Review & Buy` deep link
- Short-lived handoff/action token resolved server-side in ChatDex
- Chat View
- Quick Actions inside Chat
- Switchable Normal View
- Shared state between all interfaces
- Market/asset search and detail
- Portfolio and activity
- Intent Protocol + parser for demo commands
- Card Protocol + core card renderers
- Paper trading for unsupported assets/stocks in demo
- One real crypto/onchain execution provider
- Receipts
- Basic claim links + WhatsApp sharing
- Demo mode and seeded account

## Explicitly deferred
- Recreating the full ChatDex app inside WhatsApp
- Autonomous execution from a WhatsApp message or Flow submission
- Large WhatsApp command surface beyond the three V0 conversational capabilities
- Multiple WhatsApp Flows or a generic Flow builder
- Broad marketing/template-message campaigns
- Full KYC/compliance implementation
- Voice
- Savings circles
- Autonomous agent
- Multiple real brokers/venues
- Complex perps/risk engine unless trivial through chosen provider
- Production-grade reconciliation
- Microservices
- Developer platform/SDK

## V0 success criterion
A judge can open ChatDex on WhatsApp, ask `How is NVDA doing?`, tap `Buy`, complete the V0 Buy Flow for the demo amount, receive/open a secure `Review & Buy` handoff, authenticate/open ChatDex, explicitly confirm a clearly labelled paper order and see the persisted receipt/portfolio state. Sending `Buy $50 NVDA` as free-form text must create the same canonical trade intent.
