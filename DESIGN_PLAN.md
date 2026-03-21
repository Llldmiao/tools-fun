# Design Plan: Tools Fun Personal Lab Site

Status: reviewed
Project: tools-fun
Review basis: log-driven lab personal site

## Problem Statement

Build a personal website whose first version includes three pages: Home, Tools, and About.
The site should feel like an active lab notebook for a developer who turns strange but
interesting ideas into working tools, not a resume site or generic portfolio grid.

## Audience

- Primary audience: developers and technical peers
- Desired takeaway: "This person sees interesting angles in ordinary problems and actually builds them."

## What Already Exists

- An approved office-hours design direction: log-driven lab
- No existing codebase, components, or UI patterns in this repo yet
- No `DESIGN.md`, `CLAUDE.md`, or `TODOS.md` exists yet

## Core Design Intent

- The site should read as an active research desk, not a polished SaaS landing page.
- The user should feel `curiosity -> recognition -> affinity` as they move through the site.
- The site must avoid common AI-slop patterns: standard hero, generic portfolio cards, and resume-style About copy.

## Information Architecture

### Site Map

```text
HOME
1. Currently Exploring
2. Recent Lab Notes
3. Tools by Theme entry
4. Light personal context

TOOLS
1. Theme overview
2. Theme groups
3. Experiment record cards
4. Status legend / outbound links

ABOUT
1. Builder lens
2. Problem preferences
3. How and why small tools get made
4. Brief background and contact links
```

### Page Roles

#### Home

- The first screen leads with `Currently Exploring`.
- This area shows 1 to 3 active questions, experiments, or directions.
- Home does not use a standard hero layout.
- The second major section is `Recent Lab Notes`, curated rather than strictly chronological.
- The third major section routes into themes on the Tools page.
- The final area provides just enough personal context to make the site feel authored.

#### Tools

- The page acts as an evidence wall, proving that ideas become shipped artifacts.
- Tools are grouped by theme, not by time or maturity.
- Themes can exist even when empty; empty themes remain visible as `Incubating`.
- The first launch is framed as a curated selection rather than an incomplete catalog.

#### About

- The page acts as a creator field note, not a resume appendix.
- It explains the lens behind the work: what kinds of problems are attractive, why these tools exist, and how the creator tends to build.
- Background exists only to support trust, not to become the center of the page.

## Interaction State Coverage

```text
FEATURE                  | LOADING                        | EMPTY                              | ERROR                                  | SUCCESS                            | PARTIAL
-------------------------|--------------------------------|------------------------------------|----------------------------------------|------------------------------------|------------------------------------
Currently Exploring      | subtle placeholder blocks      | show Current Questions             | short note, then fallback questions    | show 1-3 active explorations       | mix active explorations + questions
Recent Lab Notes         | skeleton lines for excerpts    | hide section with no visual scar   | short unavailable note                 | show 3-5 curated excerpts          | fewer excerpts than usual
Theme groups             | placeholder section headers    | keep visible as Incubating         | unavailable theme note                 | show themes with tool counts       | some themes live, some incubating
Tool cards               | card skeletons                 | curated launch copy                | broken link marked clearly             | experiment record cards            | mixed maturity labels
About                    | text skeleton                  | fallback creator statement         | concise fallback bio                   | full creator field note            | shorter version if sparse
```

### State Rules

- If there are no recent updates, `Currently Exploring` falls back to `Current Questions`.
- `Recent Lab Notes` is curated editorially, so it can remain fresh without pretending to be real-time.
- Empty themes are kept on the Tools page with an `Incubating` label and one line of context.
- The first launch explicitly frames the site as a selected first drop, not as a missing-full-catalog problem.

## User Journey and Emotional Arc

```text
STEP | USER DOES              | USER FEELS   | SUPPORT
-----|------------------------|--------------|--------------------------------------------------
1    | Lands on Home          | Curiosity    | Currently Exploring leads the page
2    | Reads notes            | Recognition  | Sees active thought, not static branding
3    | Enters Tools           | Recognition  | Evidence wall proves ideas became tools
4    | Browses theme groups   | Confidence   | Tools reveal a consistent point of view
5    | Reads About            | Affinity     | Learns the lens behind the work
```

## Anti-Slop Guardrails

- No standard hero section.
- Home should feel like a live workbench or research board.
- Tool cards must behave like experiment record cards, not feature cards.
- About copy must keep the same lab language as the rest of the site.
- Avoid stock "clean/minimal/modern" defaults unless attached to a concrete decision.
- Do not fill space with decorative sections that do not strengthen the lab feeling.

## Visual System Guardrails

### Typography

- Use a two-font system.
- Body and narrative text use a restrained serif or humanist sans.
- Labels, states, experiment tags, dates, and tiny metadata use monospace.

### Color

- Use a low-saturation base palette.
- Add one or two accent colors for annotation, states, and thematic marks.
- Color must support meaning, not become the content itself.

### Layout Density

- The site uses a medium-density research-desk rhythm.
- Modules have breathing room, but the page should still feel active and populated.
- Avoid both gallery-like emptiness and archive-like clutter.

## Responsive Behavior

- Mobile does not simply stack desktop modules.
- On mobile, preserve this order: `Currently Exploring -> Themes -> Tools`.
- Tool cards collapse to summary mode on mobile: name, hook, and status first.
- Expanded details reveal description and links only when requested.
- Theme groups should remain legible without requiring horizontal scanning.

## Accessibility Requirements

- Use semantic landmarks for each page.
- All interactive elements must be keyboard reachable.
- Focus states must be visible and intentional.
- Minimum touch target size is 44px.
- State and theme labels cannot rely on color alone.
- Links, statuses, and grouped themes must remain meaningful to screen readers.

## Content Model

### Tool Card

- Tool name
- One-sentence hook
- Plain-language description
- Status label: `experiment`, `usable`, `ongoing`, `archived`, or `incubating`
- Outbound links: demo, repo, notes, write-up

### Home Content

- 1 to 3 active explorations
- 3 to 5 curated lab note excerpts
- Theme entry points into the Tools page

### About Content

- Short statement of lens
- Problems the creator gravitates toward
- Why small tools are the preferred form
- Minimal background and contact links

## First Version Scope

- Home page
- Tools page
- About page
- Theme grouping
- Experiment record card system
- Curated notes excerpts
- Mobile-specific layout behavior
- Accessibility baseline

## Not In Scope

- Full blog engine
- Per-tool detail pages in v1
- Advanced filtering or search
- Complex animations as a core identity device
- Resume-first About page
- Quantity-driven launch goal

## Future Expansion Hooks

- Tool cards may later upgrade into dedicated detail pages.
- Curated notes could later become a fuller lab journal.
- A separate `DESIGN.md` should eventually formalize the visual system.

## Success Criteria

- A technical peer understands the vibe within the first few seconds.
- The site feels authored and memorable, not template-derived.
- The Tools page reads as evidence of a point of view, not a random project dump.
- Mobile preserves the same emotional arc as desktop.
- Sparse launch content still feels intentional.
