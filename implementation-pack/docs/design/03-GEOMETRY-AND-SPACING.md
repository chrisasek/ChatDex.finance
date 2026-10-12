# Geometry and Spacing

## Supplied component geometry
- Circular complication: **56×56px**.
- Corner complication: **24–28px**.
- Inline complication: one line, target copy length **≤32 characters**.
- Rectangular complication: **264×88px**.
- Stack card: **264×116px**.
- Chat bubble max width: **288px** in the supplied mobile reference.
- Minimum hit target: **44×44px**.

## Geometry principles
- Concentric corners: nested surfaces should visually share a center/radius relationship.
- Compact cards must remain glanceable; do not expand them into dashboards.
- Keep primary actions reachable and visually obvious.
- On larger devices, scale layout/container behavior rather than arbitrarily scaling the compact complication dimensions.

## Spacing
The exact spacing scale should be read from the Figma source where available. Implement a constrained spacing token scale and avoid arbitrary values.

Recommended code rule: components may only use spacing tokens except for geometry values explicitly required by the source design.
