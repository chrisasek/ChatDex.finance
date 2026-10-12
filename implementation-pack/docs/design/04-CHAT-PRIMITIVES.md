# Chat Primitives

Implement these as reusable primitives before composing screens.

## Required primitives
- Incoming bubble
- Outgoing bubble
- Reply chip
- Reply bar
- Card action
- Prompt chip
- Composer
- Typing indicator
- Day divider
- System notice
- Avatar
- List row

## Interaction model
Quick Actions are built from these primitives and live inside Chat. They are not a separate top-level view.

Example flow:
```text
ChatDex: What do you want to do?
[ Buy ] [ Send ] [ Markets ] [ Portfolio ]

User taps Buy
ChatDex: What are you buying?
[ NVDA ] [ SOL ] [ Search ]

User can tap a choice OR type a response.
```

The user must be able to alternate between text and touch mid-flow.

## Reply/action budget
Compact conversational units expose at most three direct replies/actions when practical, with one clear primary action. When more choices exist, use a list/sheet/search destination rather than stuffing the card.

## Composer
Composer copy can follow the source direction: `Ask, or say an amount…` where context makes that meaningful. Otherwise use a context-aware equivalent such as `Ask ChatDex…`.
