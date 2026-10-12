# Typography

## Families
The supplied design uses:
- **Nunito Black / ExtraBold** for large financial numbers and high-emphasis numeric display.
- **Inter** for titles, body copy, labels, controls and utility text.

## Implementation
Load the fonts once at the application shell. Define semantic text styles rather than selecting font/weight ad hoc in components.

Suggested semantic API:
```ts
export const textStyle = {
  displayNumber: '...',
  title: '...',
  body: '...',
  bodyStrong: '...',
  label: '...',
  caption: '...',
  micro: '...'
};
```

## Rules
- Numeric financial hierarchy should be obvious at a glance.
- Use tabular numerals where useful for prices/balances.
- Do not go below the design system's 11px floor for compact UI.
- Labels should remain readable under mobile conditions.
- Normal View inherits the same typography. Do not substitute a generic fintech typography system.
