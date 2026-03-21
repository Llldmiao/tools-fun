# TODOs

## Formalize the visual system in DESIGN.md

What: Extract the approved visual guardrails from the reviewed plan into a standalone `DESIGN.md`.

Why: The project currently has strong style constraints, but they only live inside the implementation plan. A dedicated design system doc will reduce drift during implementation.

Pros:
- Makes typography, color, density, and component rules easy to reuse
- Reduces the chance of sliding back into generic default styles
- Gives later implementation and design review work a stable reference

Cons:
- Adds one more document to maintain
- Can feel heavyweight before the first version is shipped

Context: The reviewed plan already defines a two-font system, low-saturation base palette, accent annotation color, experiment-record cards, and medium-density layout rhythm. Those should be made durable before the design language diffuses.

Depends on / blocked by: None

## Preserve an upgrade path from tool cards to detail pages

What: Keep the tool card information structure extensible so each tool can later grow into a dedicated detail page without redesigning the whole site.

Why: Version one deliberately excludes detail pages, but that decision should not hard-code the site into a forever-flat list.

Pros:
- Protects future expansion without inflating current scope
- Encourages cleaner metadata and link structure now
- Makes future deep dives easier if certain tools become more important

Cons:
- Slightly raises the discipline needed during implementation
- May tempt overengineering if interpreted too aggressively

Context: The current plan keeps v1 to Home, Tools, and About. Tool cards should still be shaped like compact records, not throwaway cards, so they can later evolve into standalone pages if useful.

Depends on / blocked by: Initial tool card schema and routing decisions

## Run dedicated mobile and accessibility QA after implementation

What: After implementation, run a focused pass on responsive behavior and accessibility rather than treating them as incidental checks.

Why: This plan depends on deliberate mobile hierarchy and accessibility guardrails. Those decisions are easy to lose during implementation unless explicitly verified.

Pros:
- Catches layout regression and collapsed hierarchy on small screens
- Verifies keyboard flow, focus visibility, and status readability
- Ensures the site keeps the same emotional arc on desktop and mobile

Cons:
- Adds a post-implementation verification step
- May reveal follow-up polish work before launch

Context: The reviewed plan requires mobile-first reordering, expandable tool cards on small screens, semantic landmarks, visible focus states, 44px touch targets, and non-color-only status signaling.

Depends on / blocked by: Implementation being complete enough to test in a browser

## Add a lightweight content-authoring guide and validation workflow

What: Document how to add or edit tools, themes, statuses, slugs, and links, and tie that workflow to a content validation command.

Why: The site now depends on a single shared content model. Without a simple authoring contract, future content edits are likely to break grouping, status rendering, or expansion paths in ways that are annoying to debug.

Pros:
- Keeps content edits consistent as the project grows
- Makes schema and slug rules easier to follow without rereading implementation code
- Reduces accidental regressions when adding new tools or themes later

Cons:
- Adds one more piece of lightweight project documentation
- Might feel premature while the project is still tiny

Context: The eng review locked in a unified content model, explicit schema validation, stable tool IDs/slugs, and theme-based grouping. A short authoring guide plus a single validation command will make that structure durable when the site has more than the launch set of tools.

Depends on / blocked by: Initial content schema and validation command existing in the implementation
