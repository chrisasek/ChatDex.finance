# Project Bible

## Product intent

ChatDex turns intent into deterministic financial execution across WhatsApp and Web. The authoritative product definition is `implementation-pack/docs/01-PRODUCT-SPEC.md`.

## Navigation and surfaces

WhatsApp Conversation/Templates/Flows are first-class edge surfaces. Web Chat is primary in-app; Quick Actions live inside Chat; Home/Normal provides familiar finance navigation. Secure `/action/[token]` is the execution handoff.

## Components and tokens

Follow `implementation-pack/docs/design/`. Chat surfaces are light; compact financial faces may use the supplied night treatment. Inter serves interface copy and Nunito high-emphasis numbers. Minimum target is 44px; minimum compact text is 11px.

## Interaction grammar

One glance, one job, at most three replies. Information stays in WhatsApp, preparation uses Conversation/Flow, and execution moves to authenticated Web review and explicit confirmation.

## Motion and haptics

Short state-explaining motion with reduced-motion support. No haptic claim is made from browser proof.

## Architecture and state

See `implementation-pack/docs/03-TECHNICAL-ARCHITECTURE.md` and `05-DATABASE-SCHEMA.md`. PostgreSQL owns canonical state; conversations are context only.

## APIs and events

See `implementation-pack/docs/08-API-CONTRACTS.md`. APIs use `{ data, error, meta }`; external delivery is idempotent and correlated.

## Roles and permissions

Unknown WhatsApp users may access public market data. Private state requires linking/auth. Irreversible actions require authenticated ownership and explicit confirmation.

## Decision log

All locked product/architecture decisions live in `implementation-pack/decisions/`; the root `AGENTS.md` points builders to them.
