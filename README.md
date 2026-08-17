# Scripta Studio

# Scripta — AI Book Authoring Platform (Build Prompt v2)



You are a senior product designer and frontend engineer. Build a minimalist, high-end, editorial-grade web app named **Scripta**. Use React + Tailwind CSS. Component source of truth, in priority order: **kanto-canvas design system → shadcn/ui → Radix → HeroUI → MUI/Ant Design** (only fall back down the list if kanto-canvas has no equivalent).



## Design Tokens



**Color**

- `--bg-base`: #FFFFFF (pure white background)

- `--bg-surface`: #FDFBF7 (warm cream — cards, elevated panels)

- `--bg-surface-alt`: #F5F2EB (secondary cream — nested containers)

- `--ink-primary`: #0F0F0F (headings, primary buttons, borders)

- `--ink-secondary`: #666666 (secondary text, dividers)

- `--ink-inverse`: #FFFFFF (text on black buttons)



Maintain WCAG AA contrast (4.5:1 minimum) for all text/background pairs above — verify #666666 on #FDFBF7 specifically, as it's borderline; darken to #5A5A5A if needed.



**Typography**

- Headings: a high-contrast editorial serif — **Fraunces** or **Söhne Serif** (fallback: Georgia).

- Body/UI: a clean grotesk — **Inter** or **Neue Haas** (fallback: system-ui).

- Arabic pairing: **Tajawal** (body) + a serif-equivalent Arabic display face for headings (e.g., **Aref Ruqaa** or **Amiri** for chapter titles only, not UI chrome).



**Motion**

- Micro-interactions: 150–200ms ease-out on hover/focus states only. No motion on content that's actively being read (chapter preview).



## Internationalization / RTL



- Language selector controls document `dir` attribute (`rtl` for Arabic, `ltr` otherwise) at the app-shell level.

- Nav, form layout, slider direction, icon mirroring (chevrons, back arrows), and the chapter-reader panel must all flip correctly under RTL.

- Chapter preview text uses the Arabic pairing above when Arabic is selected; UI chrome (buttons, labels) is translated, not just mirrored.



## Navigation



Sticky top bar: wordmark left (RTL: right), two nav items — **Author Studio** / **Dashboard**. Active tab gets a 2px `--ink-primary` underline. No hamburger below tablet width — collapse nav items into a bottom tab bar instead (see Responsive section).



---



## Page 1 — Author Studio (`/studio`)



### Left Panel — Book Configuration

- **Book Title** — text input, 80 char max, live counter.

- **Synopsis & Narrative Concept** — textarea, 500 char min recommended (soft warning, not blocking), 2000 max.

- **Genre** — dropdown: Psychological Fiction, Philosophy, Self-Leadership, Sci-Fi, Business, Literary Fiction, Memoir.

- **Language** — Arabic / English / French / Spanish. Changing this triggers the RTL/LTR shell change described above.

- **Scale & Length** — slider, 3–30 chapters. Below it, live-computed readout using this formula: `avg 2,200 words/chapter × chapter count`, displayed as "~X,XXX words · ~YY pages" (250 words/page). Recompute on every slider tick.

- **Active Skills** — chip multi-select pulling from the user's Skill Vault (see Dashboard). Default-on: "Human Rhythm / Anti-AI", "Sensory Immersion", "Subtext & Conflict". Chips show a subtle strength indicator (dot intensity) matching each skill's saved strength value.

- **Primary CTA** — full-width black button, "Initiate Book Architecture & Generation." Disabled state (gray, not clickable) until Title + Synopsis + Genre are filled — show inline validation, not a blocked click with no feedback.



### Right Panel — Pipeline & Output

- **Stepper**: Outline Generation → Memory Graph → Chapter Synthesis Loop → Editorial Polish. Each step: pending (gray dot) / active (pulsing black dot + live sub-status text, e.g., "Chapter 4 of 12 · 1,840 words") / complete (black check).

- **This build is a functional-state prototype**: chapter text is produced by mock/simulated generation (progressive reveal with realistic timing, not instant), NOT a real LLM call. All UI state (progress %, word counts, stepper status) must be genuinely driven by that mock pipeline, not hardcoded — so it behaves correctly if someone wires in a real API later.

- **Chapter reader**: serif body text, adjustable font-size (S/M/L/XL) and line-height (compact/comfortable/relaxed) controls, persisted per session.

- **Export row**: DOCX / PDF / Markdown buttons — active only once generation completes. On click, export the currently-generated mock content into a correctly formatted file (real file generation, not a fake download).

- **Empty state**: before generation starts, right panel shows a minimal placeholder (not a blank white box) — e.g., a faint open-book glyph + "Your manuscript will appear here."

- **Failure state**: if mock generation is interrupted, show an inline error card with a "Retry from last chapter" action — don't restart from zero silently.



---



## Page 2 — Dashboard & Skill Engine (`/dashboard`)



### Metrics Row

Four cream metric cards: Total Books Synthesized, Total Pages Generated, Active Custom Skills, Average Humanizer Score. Numbers animate on mount (count-up, 400ms). If no books exist yet, show "—" not "0" for pages/score (0 misleadingly implies a completed book with a bad score).



### Skill Vault

- **Add Skill** (modal or inline form): Name, Category (Style / Anti-AI Filter / Pacing / Structure), Directive (markdown textarea), Strength — labeled 5-step slider: Subtle · Light · Balanced · Strong · Aggressive (not a bare 1–100 range).

- **Skill grid**: cards with name, category tag, active/inactive toggle, edit, delete (delete requires a confirm step — this is destructive and irreversible in-session).

- **Preloaded defaults** (ship with real directive text, not placeholders): "AI Fingerprint Neutralizer," "Show Don't Tell Engine," "Organic Dialogue Shaper" — each needs an actual 2–3 sentence directive so the UI doesn't look empty on first load.

- **Empty state**: if all skills are deleted, show a prompt to add one — don't render a blank grid.



### Past Books Archive

Compact table: Title, Genre, Language, Chapters, Date, Re-download (dropdown: DOCX/PDF/MD). Empty state: "No books yet — head to Author Studio to write your first one," with a CTA linking there.



---



## Responsive Behavior



- **Desktop (≥1024px)**: two-column Studio layout as described.

- **Tablet (768–1023px)**: Studio stacks to single column, config panel above output panel; Dashboard metrics go 2×2.

- **Mobile (<768px)**: top nav collapses to a bottom tab bar (Studio / Dashboard); Studio becomes a single scrolling flow with the pipeline stepper pinned as a compact sticky bar at the top once generation starts, so users don't lose progress context while scrolling the config form.



## Accessibility



- All interactive elements keyboard-navigable, visible focus ring (2px, `--ink-primary`, offset).

- Toggle switches and sliders have accessible labels (not icon-only).

- Stepper states communicated via text, not color alone (colorblind-safe).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/199dea5a-c452-4210-8348-c60c05a21904).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
