# States and Interactions

Every interactive financial component needs explicit states.

## Common states
- idle
- hover (desktop)
- pressed
- focus-visible
- disabled
- loading
- success
- warning
- error
- expired
- pending

## Financial execution
Use a deterministic progression:
```text
Draft intent → Quote/review → Explicit confirm → Pending → Completed/Failed → Receipt
```

Never jump from free-form chat text directly to completed execution.

## Loading
Prefer localized loading states/skeletons over blocking the entire application.

## Errors
Errors should explain what happened and offer a next action. Do not expose raw provider errors directly to users.

## Motion
Use motion to explain state changes and continuity, not decoration. Keep it short and respect reduced-motion preferences.

## Accessibility
- keyboard/focus support for web controls;
- semantic buttons/links;
- accessible labels for icons;
- sufficient contrast;
- meaning independent of color;
- announce asynchronous execution state changes where appropriate.
