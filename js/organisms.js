/**
 * GENESYS — Organism Management
 * ===============================
 * Factory, persistence (localStorage), and starter-generation.
 *
 * Each organism record:
 *   id          — unique string
 *   name        — display label
 *   genome      — { color: {allele1, allele2}, pattern: …, shape: … }
 *   phenotype   — { color, pattern, shape }  (expressed trait names)
 *   parents     — [parentIdA, parentIdB]  (empty for starters)
 *   generation  — 0 for starters
 *   rarityScore — 1–5
 *   rarityLabel — Common / Uncommon / Rare / Legendary
 *   discovered  — Date.now()
 *   mutations   — [{ gene, allele }]  (only populated for offspring)
 */

let _idCounter = 0;

function generateId() {
  return `org_${Date.now().toString(36)}_${++_idCounter}`;
}

// ── Factory ────────────────────────────────────────────────────────────────

function createOrganism(genome, parentIds = [], generation = 0, name) {
  const phenotype = {
    color:  expressGene('color',   genome.color.allele1,   genome.color.allele2).trait,
    pattern: expressGene('pattern', genome.pattern.allele1, genome.pattern.allele2).trait,
    shape:  expressGene('shape',   genome.shape.allele1,   genome.shape.allele2).trait,
  };
  const rarityScore = calculateRarity(genome);
  return {
    id: generateId(),
    name: name || `${phenotype.color} ${phenotype.shape} #${_idCounter}`,
    genome: JSON.parse(JSON.stringify(genome)),
    phenotype: { ...phenotype },
    parents: [...parentIds],
    generation,
    rarityScore,
    rarityLabel: getRarityLabel(rarityScore),
    discovered: Date.now(),
    mutations: [],
  };
}

// ── Starters ───────────────────────────────────────────────────────────────

function createStarterOrganisms() {
  return [
    createOrganism(
      { color: { allele1: 'R', allele2: 'R' },
        pattern: { allele1: 'S', allele2: 'S' },
        shape:   { allele1: 'O', allele2: 'O' } },
      [], 0, 'Flora'
    ),
    createOrganism(
      { color: { allele1: 'W', allele2: 'W' },
        pattern: { allele1: 'T', allele2: 'T' },
        shape:   { allele1: 'P', allele2: 'P' } },
      [], 0, 'Alba'
    ),
  ];
}

// ── Store (localStorage) ──────────────────────────────────────────────────

class OrganismStore {
  constructor() {
    this.organisms = [];
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem('gensys_organisms');
      if (raw) {
        this.organisms = JSON.parse(raw);
        for (const o of this.organisms) {
          const n = parseInt(o.id.split('_').pop(), 10);
          if (n > _idCounter) _idCounter = n;
        }
        return;
      }
    } catch (_) { /* ignore corrupt data */ }
    this.organisms = createStarterOrganisms();
    this.save();
  }

  save() {
    try {
      localStorage.setItem('gensys_organisms', JSON.stringify(this.organisms));
    } catch (_) { /* storage full or blocked */ }
  }

  getAll() { return [...this.organisms]; }

  getById(id) { return this.organisms.find(o => o.id === id); }

  add(org) { this.organisms.push(org); this.save(); }

  addMultiple(orgs) { this.organisms.push(...orgs); this.save(); }

  remove(id) {
    this.organisms = this.organisms.filter(o => o.id !== id);
    this.save();
  }

  getCount() { return this.organisms.length; }

  getMaxGeneration() {
    return this.organisms.reduce((m, o) => Math.max(m, o.generation), 0);
  }

  getRarest() {
    return this.organisms.reduce(
      (best, o) => (o.rarityScore > (best ? best.rarityScore : -1) ? o : best),
      null
    );
  }
}
