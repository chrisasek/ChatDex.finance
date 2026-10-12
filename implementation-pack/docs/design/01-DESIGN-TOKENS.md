# Design Tokens

Centralize these as CSS custom properties and map them into the chosen styling system. Do not hard-code them throughout components.

## Chat environment
```css
:root {
  --cd-chat-wallpaper: #EFECE6;
  --cd-bubble-in: #FFFFFF;
  --cd-bubble-out: /* pale peach from source design; verify exact Figma token */;
  --cd-raised: #FFFFFF;
  --cd-border: #D7DCE1;
  --cd-chip-fill: #FFFFFF;

  --cd-text: #0B0F14;
  --cd-text-secondary: #6B7885;
  --cd-accent-ink: #B4530F;
  --cd-accent-fill: #FF8A3D;
}
```

The source screenshots establish the pale-peach outgoing bubble but the exact hex is not preserved in the implementation notes. Pull the exact value from the supplied Figma/design source instead of inventing it.

## Financial face / night surface
```css
:root {
  --cd-face-bg: #000000;
  --cd-face-raised: #1C1C1E;
  --cd-face-fg: #FFFFFF;
  --cd-face-muted: #8E8E93;
  --cd-face-track: #3A3A3C;
  --cd-face-accent: #FF9F45;
}
```

## Semantic signals
The supplied system includes green, red, yellow and blue semantic signals. Preserve the exact values from Figma when implementing. Never communicate state using color alone.

Use semantic names in code:
```ts
type Signal = 'positive' | 'negative' | 'warning' | 'info' | 'neutral';
```

## Venue accents
The source system distinguishes venues using periwinkle (Backpack), pink (Phoenix), mint (Hyperliquid) and orange (local). Treat these as secondary accents only. Venue identity must also be textual/iconographic.

## Token structure
Recommended:
```text
packages/ui/src/tokens/
  colors.css
  typography.css
  geometry.css
  spacing.css
  motion.css
```

All React components consume tokens. No arbitrary one-off palette additions during the 48-hour build.
