# Flow 03 sub-interactions

| Interaction | Feedback | Result |
| --- | --- | --- |
| Continue in demo mode | Redirects back to the same handoff | Authenticated review |
| Confirm paper buy | Disables actions and announces confirmation | Receipt or retry state |
| Retry paper buy | Reuses the same idempotency token | Original or newly completed receipt |
| Cancel | Shows a clear cancelled state | No execution |
| Completed receipt | Moves focus to the receipt heading | Accessible completion feedback |

Reduced-motion preferences suppress nonessential transition motion. Focus indicators, live regions, disabled states, and touch-sized actions are preserved from the approved prototype.
