/**
 * GENESYS — Genetics Engine
 * ============================
 * Simplified Mendelian inheritance for the breeding game.
 *
 * Each organism has 3 genes: Color (C), Pattern (P), Shape (S).
 * Each gene carries 2 alleles. Phenotype is determined by
 * dominant/recessive rules. A small mutation chance introduces
 * novel alleles not present in either parent.
 *
 * Gene   Base Alleles        Mutations
 * ─────  ──────────────────  ──────────────────
 * Color  R (Red, dom)        G (Green), B (Blue), P (Purple)
 *        W (White, rec)
 * ─────  ──────────────────  ──────────────────
 * Ptn    S (Solid, dom)      D (Dotted), C (Spotted)
 *        T (Striped, rec)
 * ─────  ──────────────────  ──────────────────
 * Shape  O (Orb/Round, dom)  H (Heart), S (Star)
 *        P (Pointed, rec)
 */

export const GENES = {
  color: {
    name: 'Color',
    baseAlleles: {
      R: { trait: 'Red',    hex: '#e74c3c', dominant: true  },
      W: { trait: 'White',  hex: '#e8e8e8', dominant: false },
    },
    mutationPool: [
      { allele: 'G', trait: 'Green',   hex: '#2ecc71', dominant: false },
      { allele: 'B', trait: 'Blue',    hex: '#3498db', dominant: false },
      { allele: 'P', trait: 'Purple',  hex: '#9b59b6', dominant: false },
    ],
  },
  pattern: {
    name: 'Pattern',
    baseAlleles: {
      S: { trait: 'Solid',   dominant: true  },
      T: { trait: 'Striped', dominant: false },
    },
    mutationPool: [
      { allele: 'D', trait: 'Dotted',  dominant: false },
      { allele: 'C', trait: 'Spotted', dominant: false },
    ],
  },
  shape: {
    name: 'Shape',
    baseAlleles: {
      O: { trait: 'Round',  dominant: true  },
      P: { trait: 'Pointed', dominant: false },
    },
    mutationPool: [
      { allele: 'H', trait: 'Heart', dominant: false },
      { allele: 'S', trait: 'Star',  dominant: false },
    ],
  },
};

export const MUTATION_CHANCE = 0.03;

/** Return every possible allele (base + mutation) for a gene type. */
export function getAllAllelesForGene(geneType) {
  const gene = GENES[geneType];
  const map = {};
  for (const [code, info] of Object.entries(gene.baseAlleles)) {
    map[code] = { ...info, code, isMutation: false };
  }
  for (const m of gene.mutationPool) {
    map[m.allele] = {
      trait: m.trait, dominant: m.dominant, hex: m.hex,
      code: m.allele, isMutation: true,
    };
  }
  return map;
}

/** Return the expressed phenotype info object for a gene pair. Dominant beats recessive. */
export function expressGene(geneType, allele1, allele2) {
  const all = getAllAllelesForGene(geneType);
  const a1 = all[allele1];
  const a2 = all[allele2];
  if (!a1 || !a2) return a1 || a2;
  if (a1.dominant) return a1;
  if (a2.dominant) return a2;
  return a1;
}

/** Randomly pick one allele from a parent's genome for a given gene. */
export function pickRandomAllele(genome) {
  return Math.random() < 0.5 ? genome.allele1 : genome.allele2;
}

/** Return a random mutation allele from the mutation pool. */
export function getRandomMutation(geneType) {
  const pool = GENES[geneType].mutationPool;
  return pool[Math.floor(Math.random() * pool.length)].allele;
}

/**
 * Breed two parent organisms → offspring genome & phenotype.
 *
 * For each gene:
 *   1. Pick one random allele from each parent.
 *   2. With MUTATION_CHANCE, replace one allele with a novel mutation.
 *   3. Express the phenotype via dominant/recessive rules.
 */
export function breed(parentA, parentB) {
  const genome = {};
  const mutations = [];

  for (const geneType of ['color', 'pattern', 'shape']) {
    let allele1 = pickRandomAllele(parentA.genome[geneType]);
    let allele2 = pickRandomAllele(parentB.genome[geneType]);

    if (Math.random() < MUTATION_CHANCE) {
      const newAllele = getRandomMutation(geneType);
      if (Math.random() < 0.5) allele1 = newAllele;
      else allele2 = newAllele;
      mutations.push({ gene: geneType, allele: newAllele });
    }

    genome[geneType] = { allele1, allele2 };
  }

  const phenotype = {
    color:  expressGene('color',   genome.color.allele1,   genome.color.allele2).trait,
    pattern: expressGene('pattern', genome.pattern.allele1, genome.pattern.allele2).trait,
    shape:  expressGene('shape',   genome.shape.allele1,   genome.shape.allele2).trait,
  };

  return { genome, phenotype, mutations, hasMutation: mutations.length > 0 };
}

/**
 * Rarity scoring:
 *   1 = Common       (standard dominant alleles)
 *   2 = Uncommon     (homozygous recessive of base alleles)
 *   3 = Rare         (at least one mutation allele present)
 *   5 = Legendary    (homozygous mutation — both alleles same mutation)
 */
export function calculateRarity(genome) {
  let score = 1;
  for (const geneType of ['color', 'pattern', 'shape']) {
    const g = genome[geneType];
    const all = getAllAllelesForGene(geneType);
    const a1 = all[g.allele1];
    const a2 = all[g.allele2];

    if (a1.isMutation && a2.isMutation && g.allele1 === g.allele2) {
      score = Math.max(score, 5);
    } else if (a1.isMutation || a2.isMutation) {
      score = Math.max(score, 3);
    } else if (!a1.dominant && !a2.dominant && g.allele1 === g.allele2) {
      score = Math.max(score, 2);
    }
  }
  return score;
}

export function getRarityLabel(score) {
  if (score >= 5) return 'Legendary';
  if (score >= 3) return 'Rare';
  if (score >= 2) return 'Uncommon';
  return 'Common';
}
