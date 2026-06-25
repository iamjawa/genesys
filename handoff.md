# GENESYS — Handoff Document

**Generated**: 2026-06-25
**Repo**: `git@github.com:iamjawa/genesys.git`
**Project dir**: `C:\Users\Billy Burrows\Documents\markdown\gensys`
**Test runner**: `tests/runner.html` — open in any browser (17 suites)
**How to play**: open `index.html` directly from filesystem (no server needed)

---

## Project State

Zero-dependency browser-based genetics breeding game. Pure HTML/CSS/JS, ES module-free (plain `<script>` tags for `file://` compatibility). 11 files, ~2K lines of code. All commits authored by the project owner.

---

## 15 Commits (chronological, newest first)

```
65e06a8  achievements / milestones system
e9fd23a  breeding odds preview + polygenic scent trait
d4be362  legendary reveal animation
b1828e4  real flower species + botanical SVGs + bulk cull
169c2c2  rarity breakdown in detail modal
b699a37  more starter species + visual rarity glow + completion tracking
d131050  breeding history / lineage
d407c47  sort collection (name, rarity, generation)
9bbf306  delete/culling organisms
d50b5a4  organism renaming
87fcc31  TDD workflow reference (TDD.md)
ce222e7  plain scripts (not ES modules) for file:// compat
a02f2ab  stripped Node tooling, zero-dependency test runner
e786b1f  TDD infra + Trait Journal + genetics tests
0e209a4  Initial MVP: genetics engine, breeding, SVG flowers
```

---

## Architecture

| File | Role | Key exports (globals) |
|---|---|---|
| `js/genetics.js` | Gene definitions, inheritance, mutation, rarity, odds, polygenic | `GENES`, `breed()`, `expressGene()`, `calculateRarity()`, `getRarityBreakdown()`, `computeBreedingOdds()`, `expressScent()` |
| `js/organisms.js` | Factory, OrganismStore (localStorage) | `createOrganism()`, `OrganismStore` class |
| `js/renderer.js` | SVG flower generation (4 types), DOM cards | `renderOrganismSVG()`, `createOrganismCard()` |
| `js/discovery-tracker.js` | Allele discovery tracking | `DiscoveryTracker` class |
| `js/achievement-tracker.js` | Milestone achievements | `AchievementTracker` class |
| `js/app.js` | UI glue, event handling, breeding loop | IIFE, all wiring |
| `tests/runner.html` | All tests, inline | 17 `suite()` blocks |

---

## Feature Inventory (all tested)

1. **Genetics engine** — 3 independent genes (color, pattern, shape), Mendelian dom/rec, 3% mutation chance per gene, rarity scoring (1=Common → 5=Legendary)
2. **Breeding** — select 2 parents, click Breed, 1–3 offspring, auto-added to collection
3. **Trait Journal** — tracks discovered vs hidden alleles per gene, progress bar
4. **Renaming** — double-click card name, inline edit
5. **Delete/Culling** — × button on hover + detail modal + bulk multi-select mode
6. **Sort** — dropdown: Newest, Name A–Z, Rarity, Generation
7. **Lineage** — parent cards in detail modal, clickable to navigate
8. **4 flower species** — Rose (round), Lily (pointed), Tulip (heart), Daisy (star) — each with botanical SVG
9. **Rarity glows** — gold glow (Rare), animated pulsing purple (Legendary)
10. **Completion tracking** — `📖 N%` in header stats
11. **Rarity breakdown** — per-gene reasons in detail modal (`getRarityBreakdown`)
12. **Legendary reveal** — full-screen CSS animation when Legendary bred
13. **Breeding odds** — Punnett probability bars shown before breeding
14. **Polygenic Scent** — emergent from Color × Pattern (Sweet, Spicy, Fresh, Earthy, Exotic)
15. **Achievements** — 8 milestones with notifications on unlock

---

## Genetics System (brief)

Each organism has a `genome` object:
```js
{ color: { allele1: 'R', allele2: 'W' },
  pattern: { allele1: 'S', allele2: 'T' },
  shape: { allele1: 'O', allele2: 'P' } }
```

**Base alleles**: Color R(dom)/W(rec), Pattern S(dom)/T(rec), Shape O(dom)/P(rec)
**Mutations**: Color→G/B/P, Pattern→D/C, Shape→H/S (all recessive, 3% chance)
**Rarity**: Common(1) → Uncommon(2) → Rare(3) → Legendary(5)
**Scent** (polygenic): Red+Solid=Sweet, Red+Striped=Spicy, White+Solid=Fresh, White+Striped=Earthy, any mutation=Exotic

---

## Suggested Skills for Next Session

- **tdd** — The core workflow for this project. All features are built RED→GREEN one behavior at a time via `tests/runner.html`. Every feature commit includes its tests. Invoke this skill before any coding.

- **handoff** — To produce the next handoff document at the end of the session.

- **codebase-design** — If adding deep modules (e.g., export/import codec, polygenic trait engine, environmental modifier system). Use to identify deepening opportunities and testability checks before writing tests.

- **impeccable** — If doing UI work (new panels, animations, layout changes). Use for CSS polish, accessibility, responsive behavior, and visual design critique.

- **firecrawl-scrape** or **context7-mcp** — If the next feature requires reference to external documentation (e.g., rendering techniques, genetic algorithm references, CSS animation patterns).

- **diagnosing-bugs** — If a bug is reported. Use the diagnosis loop before attempting a fix.

- **prototype** — If uncertain about a UX flow or genetic rule, build a throwaway prototype before committing to TDD.

- **ask-matt** — If unsure which skill fits the next task.

---

## Suggested Next Features (not yet started)

1. **Export / Import Codes** — Encode an organism's genome into a short string for sharing. Pure encode/decode logic, highly testable. New `js/codec.js` module.

2. **Offspring Count Slider** — Let player choose 1–5 offspring instead of random 1–3. Simple UI + store option.

3. **Environmental Effects** — Breeding modifiers based on conditions (e.g., "mutation rate doubles when breeding two Striped organisms"). Pure genetics engine change.

4. **Deeper Polygenic Traits** — More emergent traits from different gene interactions. Extends `expressScent` pattern.

5. **Breeding History Log** — A persistent log of every breed performed, with timestamps and results. New store concept.

6. **Market / Trading** — Would require a backend or localStorage codec exchange. Higher complexity.

---

## Notes

- No build step, no package.json, no node_modules — zero-dependency.
- ES modules were tried and reverted because they break on `file://` in most browsers. Plain `<script>` tags are intentional.
- All commits use a consistent author format. Use `git commit --author="iamjawa <hello@iamjawa.co>"` when committing.
- The project uses `git push origin +master` (force push) — this is intentional for a solo project.
- `localStorage` key: `gensys_organisms`. Clearing it resets to 4 starters.
- Tests use document.createElement and DOM queries — they need a browser environment (`tests/runner.html`, not Node).
