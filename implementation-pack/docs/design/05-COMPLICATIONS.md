# Complications

The complication language gives ChatDex its glanceable financial identity. These are compact information surfaces, not decorative widgets.

## Circular — 56×56
Source patterns include gauges, numbers, symbol/change displays and brand mark treatments.

Use for:
- compact status;
- progress/risk gauge;
- one-number summary;
- compact market signal.

## Corner — 24–28
Use for tiny badges/gauges attached to larger surfaces.

## Inline
One line, glyph first, copy kept short (source target ≤32 characters).

## Rectangular — 264×88
Source layouts include:
- agent call;
- best price across venues;
- portfolio;
- liquidation distance;
- today P&L;
- 24h market chart.

## Stack — 264×116
The source uses semantic tone for wallet/up/down/warning/transfer states. Tone is supportive; state must remain understandable without color.

## Implementation rule
Create a small compositional API rather than a unique component for every screenshot. Example:
```ts
<RectComplication
  eyebrow="NVDA · BEST PRICE"
  value="$182.51"
  meta="Backpack"
  signal="positive"
/>
```
