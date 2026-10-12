# Design identity

## Evidence header

- Approved direction: `implementation-pack/docs/design/`
- Reference alignment score: not measured; no production UI milestone implemented
- Transmission score: not measured
- Target viewports and devices: phone-first Web/PWA, usable tablet/desktop, native WhatsApp rendering
- Compared artifacts: specification Markdown only; Figma visual inspection is deferred until the first major Web UI milestone

## Product character

Chat-first, glanceable, calm, direct, and explicit about financial state and demo/live mode.

## Color tokens

Current shell exposes only exact documented tokens. Missing pale-peach/semantic values must be resolved from Figma before their components ship.

## Typography roles

Inter for interface text and Nunito Black/ExtraBold for high-emphasis financial numbers when the full UI font setup lands.

## Spacing, shape, and elevation

Concentric corners, constrained spacing, 44px minimum targets, 288px supplied bubble max, and fixed compact complication geometry.

## Components and states

Reuse Chat primitives and financial Card Protocol renderers. Every financial action exposes idle, loading, validation, pending, success, failure, and expired states as applicable.

## Motion and feedback

Short state-continuity motion with reduced-motion support. Meaning never relies on motion, color, or haptics alone.

## Screen anatomy

Chat is primary; Quick Actions are embedded; Normal View is a familiar switchable finance surface using the same system.

## Platform deltas

WhatsApp uses provider-native controls. The Web/PWA follows safe areas and mobile-first responsive rules without imitating an entire app inside chat cards.
