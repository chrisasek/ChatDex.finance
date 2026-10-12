# Chat View Design

## Role
Chat is the default/primary ChatDex surface.

## Opening composition
1. App identity/header.
2. Relevant greeting/context.
3. One or two high-value glanceable cards.
4. Quick Actions/prompt chips.
5. Composer.
6. Easy route to Normal/Home view.

Do not flood the opening thread with every available feature.

## Example
```text
ChatDex

Good morning, Chris.
Your portfolio is up 2.4% today.

[ Portfolio card ]

NVDA crossed your $182 alert.
[ Market/alert card ]
[ Buy ] [ Sell ] [ Snooze ]

[ Buy ] [ Send ] [ Markets ] [ Portfolio ]

[ Ask ChatDex… ]

Chat   Home
```

## Context
Chat receives context from Normal View. If user taps `Ask ChatDex` on NVDA, the chat should visibly indicate that NVDA is the current context and allow short utterances like `Buy $50` or `Why is this up?`.

## History
Financial receipts/actions may appear in the thread, but the conversation transcript is not the database source of truth for portfolio/order state.
