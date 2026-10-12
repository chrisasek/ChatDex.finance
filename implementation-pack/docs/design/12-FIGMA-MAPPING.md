# Figma / Source Mapping

## Editable source
The ChatDex document pack points to the editable Figma design:
`https://www.figma.com/design/rf1YVhYrkd74qAG2s3nN1J`

Use the Figma source to resolve exact values not preserved in these Markdown implementation notes.

## Source page mapping
The exported/source pages are organized around:
- Cover
- Foundations
- Complications
- Chat primitives
- Feature cards
- Screens

## Implementation mapping
| Source | Implementation |
|---|---|
| Foundations | `01-DESIGN-TOKENS.md`, `02-TYPOGRAPHY.md`, `03-GEOMETRY-AND-SPACING.md` |
| Complications | `05-COMPLICATIONS.md` |
| Chat primitives | `04-CHAT-PRIMITIVES.md` |
| Feature cards | `06-FINANCIAL-CARDS.md` + `docs/07-CARD-PROTOCOL.md` |
| Screens | `08-CHAT-VIEW.md`, `09-NORMAL-VIEW.md` |

## Important limitation
The original supplied screens focus heavily on the chat-native experience. The complete switchable Normal fintech view is a later product decision. Therefore Normal View must be an extension of the established system, not claimed as an exact reproduction of an existing Figma screen.

## Agent rule
When implementation notes and Figma differ on a visual detail, prefer the supplied Figma/source design for visual values, while preserving the later product decisions in `AGENTS.md` (Chat-first, Quick inside Chat, switchable Normal View).
