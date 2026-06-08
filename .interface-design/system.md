# Vibe CRM — Interface System (Studio Warm)

## Direction
Warm studio desk for freelancers and small agencies between client calls. Not cold Linear — feels like a lit workspace: charcoal wood, cream ink, copper for money and action, sage for wins. Calm but human.

**Who:** Freelancer/agency switching from a call to the pipeline.  
**Verb:** Scan deal health, open a record, act before the next meeting.  
**Feel:** Warm, precise, unhurried — notebook on a desk, not a server room.

## Signature
**Copper rail** — 3px amber left accent on hero surfaces, active nav, and primary KPI cards. Pipeline data stays mono; warmth comes from environment and accent, not decoration.

## Depth
Borders-only on warm stone (`border-amber-950/35`). Surfaces `bg-stone-900/45`. Inputs inset darker (`bg-stone-950/55`). Sidebar same canvas as main — no split “sidebar world.”

## Spacing
Base 4px. Gaps 12px (3), card padding 20px (5), sections 24px (6).

## Typography
- Headlines: `text-xl` page titles, `text-sm` panel titles, `font-semibold`, `tracking-tight`
- Labels: `studio-label` — 10px uppercase wide tracking, amber-muted
- Data: `font-mono tabular-nums` on money, dates, counts
- Hints: `text-[11px] text-muted-foreground`

## Color
- Canvas: warm charcoal HSL 28 14% 7%
- Text: cream HSL 38 28% 92%
- **Copper** primary CTA + rails + active nav (HSL 32 82% 52%)
- **Sage** success / win rate (HSL 145 35% 42%)
- **Warm amber** warnings, overdue
- Pipeline stage colors from DB (unchanged)
- Ambient: subtle radial “desk lamp” glow on body (CSS only)

## Components

### Primitives
- **Surface** — `studio-surface`, optional `studio-rail` + `studio-surface-interactive`
- **StatTile** — horizontal rail layout, copper icon well, mono value
- **Input** — `studio-inset`, copper focus ring
- **Button** — primary = copper fill; outline = warm border; ghost = amber tint hover
- **Tabs** — stone inset track, active = copper border bottom

### Layout
- **Sidebar** — canvas bg, active item copper rail + `bg-amber-500/8`
- **Topbar** — `h-11`, warm border, search pill inset
- **Auth** — split layout: brand panel (lg) + form; logo copper gradient mark

### Patterns
- **PageHeader** — studio-label + xl title
- **DataTable** — warm surface wrapper, uppercase headers, mono pagination
- **AuthShell** — open form card, copper logo
- **DetailHeader** — back link + badge with sage/amber semantics
- **FormSection** — studio-label sections, copper divider on actions

### Dashboard
- Hero pipeline: full-width `studio-rail` surface, large mono value
- StatTiles: 4-grid, copper/sage/warm accents by metric type
- PipelineByStage: stage dots + warm progress troughs
