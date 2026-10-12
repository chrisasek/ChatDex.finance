# ChatDex Design Implementation

## Purpose
This directory translates the supplied ChatDex Design System V1 (October 2026) into implementation rules. The supplied design system is the visual source of truth. Agents must implement it, not reinterpret it.

## Product/UI model
ChatDex is **chat-first, not chat-only**.

- **Chat View** is the default/primary surface.
- **Quick Actions** are embedded inside Chat as chips, buttons and card actions.
- **Normal View** is a switchable familiar fintech interface for portfolio, markets, assets, activity, order forms and other dense/exploratory tasks.
- Both views use the same state, intents, domain services and transaction history.
- A user can move from Normal → Chat with context and Chat → Normal for deeper exploration.

## Existing design principles to preserve
1. One glance, one job.
2. Ten-second read.
3. Dark financial faces use the established night treatment.
4. Color never works alone; pair it with text, iconography or direction.
5. 11px is the text-size floor for supplied compact UI.
6. Use 2px strokes and 5px rings where specified by the complication language.
7. At most three replies/actions on a compact conversational unit; one should be primary.
8. One card, one destination/job.
9. Private by default.
10. Relevance ranks the conversational stack.
11. Use concentric corner geometry.
12. Feel native to the interaction surface; do not put an entire app inside a chat card.
13. Components must survive a mono rendition; meaning cannot rely on color alone.

## Implementation hierarchy
Implement in this order:
1. tokens and typography;
2. geometry and primitives;
3. chat primitives;
4. complications/financial faces;
5. financial cards;
6. Chat View composition;
7. application primitives for Normal View;
8. Normal View screens;
9. responsive/PWA behavior;
10. states, accessibility and motion.

## Rule for missing designs
When a required component is not shown in the supplied design:
- first reuse an existing primitive;
- then compose existing primitives;
- only then introduce a new primitive;
- new primitives must inherit ChatDex tokens, radii, typography, stroke weights and interaction behavior.

Do not introduce a second visual system for Normal View.
