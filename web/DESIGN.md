PichangApp UI/UX Guidelines

- Design tokens live in `src/app/globals.css` and `tailwind.config.js`.
- Use the following utility classes for consistency:
  - Buttons: `btn`, `btn-primary`, `btn-outline`, `btn-ghost`, `btn-secondary`
  - Cards: `card`, `card-hover`, `glass-card`
  - Inputs: `input-field`, `select-field`, `textarea-field`
  - Layout: `container` (Tailwind core) + `container-px` for horizontal padding
- Header and footer use translucent surfaces with `backdrop-blur`.
- Page transitions are handled by `RouteTransition` with Framer Motion.
- Prefer subtle hover transforms (`hover:-translate-y-0.5`) and soft shadows.

Notes

- Selection color, focus rings, and base typography are set globally.
- Animations respect reduced motion by default via system settings.

