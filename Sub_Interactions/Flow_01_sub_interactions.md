# Flow 01 interaction sweep

## Interaction map

Incoming text → processing → compact NVDA response → Buy button. Unsupported input → suggestion. Provider failure → invisible retry, then response.

## Surface decisions

The market result is an interactive WhatsApp message because one glance and one action fit the native surface. The WebApp is not opened for information.

## Spawned surfaces

Buy will open the single V0 WhatsApp Flow when configured; that belongs to Flow 02.

## Hidden states

Signature rejection, schema rejection, duplicate delivery, outbound failure, and unconfigured server environment are explicit server states.

## Edge cases

Malformed signatures fail without throwing. Duplicate completed IDs do not send again. A failed outbound attempt releases/marks the ID for Meta retry.

## Micro-interactions

One primary Buy control follows the source action budget. Price direction is written in text.

## Motion and interruption

WhatsApp owns native transition motion. Interrupted delivery is retried through provider webhook semantics; no browser haptic claim applies.

## Feedback and semantic haptics

The response itself is feedback. No custom haptic is requested or claimed.

## Gaps found

Real Meta rendering, Flow launch, and mobile screenshots require the user's Meta test configuration.
