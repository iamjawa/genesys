# GENESYS — Handoff Document

**Generated**: 2026-06-30 (updated)
**Repo**: `git@github.com:iamjawa/genesys.git`
**Project dir**: `C:\Users\Billy Burrows\Documents\markdown\gensys`
**Test runner**: `tests/runner.html` — open in any browser
**How to play**: open `index.html` directly from filesystem (no server needed)

---

## Project State

Zero-dependency browser-based genetics breeding game. Pure HTML/CSS/JS, ES module-free (plain `<script>` tags for `file://` compatibility). All commits authored by the project owner.

---

## Commits (chronological, newest first)

```
ba43054  Start Over function with double confirmation
f158d53  garden view toggle with organic layout
afc46a7  improved auto-name template with size trait
0fca307  collection search and rarity filter
d318bb7  sort by Scent and Texture polygenic traits
d55e30b  breeding combos/recipes for named hybrids
4b203cf  Size gene (4th locus) with Tall/Bushy/Dwarf/Wide
6b830a8  Seed Exchange market
3cb4a65  persistent breeding history log
b1c3fd8  polygenic Texture trait (Shape x Pattern)
f39c34c  synergy effects (environmental breeding modifiers)
31de8f4  offspring count slider (1-5) replacing random
ab6e788  export/import codes for organisms
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
| `js/genetics.js` | Gene definitions, inheritance, mutation, rarity, odds, polygenic traits, synergy effects, breeding recipes, random genome | `GENES`, `GENE_TYPES`, `MUTATION_CHANCE`, `breed()`, `expressGene()`, `calculateRarity()`, `getRarityBreakdown()`, `computeBreedingOdds()`, `expressScent()`, `expressTexture()`, `getSynergyEffects()`, `generateRandomGenome()`, `getBreedingRecipe()`, `BREEDING_RECIPES` |
| `js/organisms.js` | Factory, OrganismStore (localStorage), Breed Log | `createOrganism()`, `OrganismStore` class, `getBreedLog()`, `recordBreed()`, `clearBreedLog()` |
| `js/renderer.js` | SVG flower generation (4 types), DOM cards | `renderOrganismSVG()`, `createOrganismCard()` |
| `js/discovery-tracker.js` | Allele discovery tracking | `DiscoveryTracker` class |
| `js/achievement-tracker.js` | Milestone achievements | `AchievementTracker` class |
| `js/codec.js` | Export/Import genome encoding | `encodeOrganismCode()`, `decodeOrganismCode()` (8-char with 6-char backward compat) |
| `js/app.js` | UI glue, event handling, breeding loop, market, search, filter, garden view | IIFE, all wiring |
| `tests/runner.html` | All tests, inline | All suites |

---

## Feature Inventory

1. **Genetics engine** — 4 independent genes (color, pattern, shape, size), Mendelian dom/rec, 3% mutation chance per gene, rarity scoring (1=Common → 5=Legendary)
2. **Breeding** — select 2 parents, click Breed, 1–5 offspring (slider), auto-added to collection
3. **Trait Journal** — tracks discovered vs hidden alleles per gene, progress bar
4. **Renaming** — double-click card name, inline edit
5. **Delete/Culling** — × button on hover + detail modal + bulk multi-select mode
6. **Sort** — dropdown: Newest, Name A–Z, Rarity, Generation, Scent, Texture
7. **Search & Filter** — text search by name + rarity dropdown filter
8. **Lineage** — parent cards in detail modal, clickable to navigate
9. **4 flower species** — Rose (round), Lily (pointed), Tulip (heart), Daisy (star) — each with botanical SVG
10. **Rarity glows** — gold glow (Rare), animated pulsing purple (Legendary)
11. **Completion tracking** — `📖 N%` in header stats
12. **Rarity breakdown** — per-gene reasons in detail modal (`getRarityBreakdown`)
13. **Legendary reveal** — full-screen CSS animation when Legendary bred
14. **Breeding odds** — Punnett probability bars + synergy effects shown before breeding
15. **Polygenic Scent** — emergent from Color × Pattern (Sweet, Spicy, Fresh, Earthy, Exotic)
16. **Polygenic Texture** — emergent from Shape × Pattern (Smooth, Ribbed, Sleek, Spiky, Ethereal)
17. **Size gene** — 4th locus: Tall (dom), Bushy (rec), mutations Dwarf/Wide
18. **Achievements** — 8 milestones with notifications on unlock (Completionist checks all alleles)
19. **Export/Import Codes** — 8-char genome code with 6-char backward compat, export in detail modal, import in collection
20. **Synergy Effects** — Primal (+1 rarity, both gen-0) and Rainbow (force color mutation, different colors)
21. **Breeding Recipes** — named hybrid combos: Sunset Cross (Rose×Lily), Meadow Blend (Tulip×Daisy), Pure Strain, Mutant Cross, Legendary Union
22. **Breeding History Log** — persistent localStorage log with timestamps, parents, count, effects
23. **Seed Exchange** — random adoptable organism offered per breed cycle, one adoption per cycle
24. **Garden View** — toggle between grid and organic garden layout with rotation/shadow effects
25. **Start Over** — 🔄 button with double confirmation, clears all progress and reloads

---

## Genetics System (brief)

Each organism has a `genome` object:
```js
{ color: { allele1: 'R', allele2: 'W' },
  pattern: { allele1: 'S', allele2: 'T' },
  shape: { allele1: 'O', allele2: 'P' },
  size: { allele1: 'T', allele2: 'B' } }
```

**Shared iteration**: `GENE_TYPES = ['color', 'pattern', 'shape', 'size']` — all engine functions iterate dynamically.

**Base alleles**:
- Color: R(dom)/W(rec), Pattern: S(dom)/T(rec), Shape: O(dom)/P(rec), Size: T(dom)/B(rec)
- **Mutations**: Color→G/B/P, Pattern→D/C, Shape→H/S, Size→D/W (all recessive, 3% chance)

**Rarity**: Common(1) → Uncommon(2) → Rare(3) → Legendary(5)
**Scent** (polygenic): Red+Solid=Sweet, Red+Striped=Spicy, White+Solid=Fresh, White+Striped=Earthy, any mutation=Exotic
**Texture** (polygenic): Round+Solid=Smooth, Round+Striped=Ribbed, Pointed+Solid=Sleek, Pointed+Striped=Spiky, any mutation=Ethereal

---

## Suggested Skills for Next Session

- **tdd** — The core workflow for this project. All features built RED→GREEN via `tests/runner.html`. Invoke before any coding.

- **handoff** — To produce the next handoff document at the end of the session.

- **codebase-design** — If adding deep modules. Use to identify deepening opportunities and testability checks.

- **impeccable** — If doing UI work (new panels, animations, layout changes).

- **prototype** — If uncertain about a UX flow or genetic rule.

- **ask-matt** — If unsure which skill fits the next task.

---

## Suggested Next Features

1. **Trait filter search** — filter by specific traits (e.g. "Red" or "Sweet") not just name/rarity
2. **Gene-specific view** — highlight which genes are dominant/recessive in the collection grid
3. **Bulk rename** — rename multiple organisms at once
4. **Auto-save indicator** — visual feedback when game state persists
5. **Keyboard shortcuts** — press B to breed, D to delete selected, etc.
6. **Organism export from collection** — export any organism's code from the collection (not just detail modal)
7. **Rarity-weighted market** — Seed Exchange offers weighted by rarity tiers
8. **Dark/Light theme toggle**

---

## Notes

- No build step, no package.json, no node_modules — zero-dependency.
- ES modules were tried and reverted because they break on `file://` in most browsers. Plain `<script>` tags are intentional.
- All commits use a consistent author format. Use `git commit --author="iamjawa <hello@iamjawa.co>"` when committing.
- The project uses `git push origin +master` (force push) — this is intentional for a solo project.
- `localStorage` keys: `gensys_organisms`, `gensys_breed_log`, `gensys_achievements`, `gensys_discovered_alleles`.
- Tests use document.createElement and DOM queries — they need a browser environment (`tests/runner.html`, not Node).
