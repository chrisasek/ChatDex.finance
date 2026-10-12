# Product Guardrails

1. Chat-first does not mean chat-only.
2. WhatsApp is a first-class interaction layer with **Conversation + Template Messages + Flows**, and a distribution/identity/claims venue.
3. Do **not** open the WebApp for every WhatsApp action. Information completes inside WhatsApp; preparation stays in Conversation/Flows where practical; irreversible execution, sensitive account actions, or genuinely richer/dense UI hand off to authenticated ChatDex.
4. WhatsApp is not the secure execution environment. Irreversible financial actions hand off to authenticated ChatDex for review and explicit confirmation.
5. WhatsApp Conversation and Flow submissions, Web Chat, Quick Actions and Normal View share one Intent Protocol, state and transaction history. Templates are an outbound delivery/rendering surface and may link into those same flows/intents.
6. Do not create separate financial domain logic for WhatsApp; implement it as an interface adapter.
7. Quick Actions live inside Web Chat.
8. Normal View must feel familiar to existing fintech users.
9. Do not force conversational UI where lists/forms/charts are better.
10. Phone number is the onboarding identity concept; WhatsApp message identity alone is not sufficient authorization for a real financial action.
11. Stocks are the V0 pitch wedge; crypto is a rail, not the ChatDex identity. Do not reposition the product as crypto-only for the hackathon.
12. The differentiator is financial intent → deterministic routing/execution across interfaces and rails.
13. AI does not autonomously authorize financial actions.
14. Paper execution must be clearly labelled.
15. Keep WhatsApp V0 narrow: three conversational capabilities, one Buy Flow, and a small approved Template set. Do not rebuild the whole app inside WhatsApp or create a generic Flow/template platform.
16. The product must continue to work through Web/PWA even if WhatsApp is unavailable or uneconomic.
17. Do not expand V0 until the headline WhatsApp → review → confirmation → receipt flow works deployed on mobile.
