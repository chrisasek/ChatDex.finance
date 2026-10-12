# 07 — Card Protocol

Cards are structured domain responses, not business logic embedded in React.

## Core types
`MARKET`, `PORTFOLIO`, `ORDER`, `POSITION`, `RECEIPT`, `TRANSFER`, `CLAIM`, `ALERT`.

```ts
interface CardBase {
  type: string;
  version: 1;
  id: string;
  actions?: CardAction[];
}

interface CardAction {
  id: string;
  label: string;
  intentType?: string;
  href?: string;
  emphasis?: 'primary'|'secondary'|'danger';
}
```

Order cards include instrument, side, amount, quote, fee, executionMode (`paper|live`) and actions. Receipt cards include status, human summary, reference and relevant links.

## Rendering rule
The same payload should be renderable in Chat and, where useful, Normal View/activity. Paper execution must visibly say Demo/Paper.
