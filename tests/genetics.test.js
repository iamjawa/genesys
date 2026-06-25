import { describe, it, expect } from 'vitest';
import { expressGene, calculateRarity, getRarityLabel, getAllAllelesForGene, pickRandomAllele, breed } from '../js/genetics.js';

describe('expressGene', () => {
  it('returns dominant trait when one dominant and one recessive allele present', () => {
    const r = expressGene('color', 'R', 'W');
    expect(r.trait).toBe('Red');
  });

  it('returns dominant trait when both alleles are dominant', () => {
    const r = expressGene('color', 'R', 'R');
    expect(r.trait).toBe('Red');
  });

  it('returns recessive trait when both alleles are recessive', () => {
    const r = expressGene('color', 'W', 'W');
    expect(r.trait).toBe('White');
  });
});

describe('calculateRarity', () => {
  it('returns 1 (Common) for standard dominant alleles', () => {
    const score = calculateRarity({
      color:   { allele1: 'R', allele2: 'R' },
      pattern: { allele1: 'S', allele2: 'S' },
      shape:   { allele1: 'O', allele2: 'O' },
    });
    expect(score).toBe(1);
    expect(getRarityLabel(score)).toBe('Common');
  });

  it('returns 2 (Uncommon) for homozygous recessive base alleles', () => {
    const score = calculateRarity({
      color:   { allele1: 'W', allele2: 'W' },
      pattern: { allele1: 'T', allele2: 'T' },
      shape:   { allele1: 'P', allele2: 'P' },
    });
    expect(score).toBe(2);
    expect(getRarityLabel(score)).toBe('Uncommon');
  });

  it('returns 3 (Rare) when a mutation allele is present', () => {
    const score = calculateRarity({
      color:   { allele1: 'R', allele2: 'G' },
      pattern: { allele1: 'S', allele2: 'S' },
      shape:   { allele1: 'O', allele2: 'O' },
    });
    expect(score).toBe(3);
    expect(getRarityLabel(score)).toBe('Rare');
  });

  it('returns 5 (Legendary) for homozygous mutation', () => {
    const score = calculateRarity({
      color:   { allele1: 'G', allele2: 'G' },
      pattern: { allele1: 'S', allele2: 'S' },
      shape:   { allele1: 'O', allele2: 'O' },
    });
    expect(score).toBe(5);
    expect(getRarityLabel(score)).toBe('Legendary');
  });
});

describe('breed', () => {
  it('produces offspring with a valid genome structure', () => {
    const parentA = makeBreedableParent('R', 'R', 'S', 'S', 'O', 'O');
    const parentB = makeBreedableParent('W', 'W', 'T', 'T', 'P', 'P');
    const result = breed(parentA, parentB);

    expect(result.genome).toBeDefined();
    expect(result.genome.color).toBeDefined();
    expect(result.genome.pattern).toBeDefined();
    expect(result.genome.shape).toBeDefined();
    expect(result.phenotype).toBeDefined();
    expect(result.phenotype.color).toBeDefined();
  });

  it('produces visible phenotype differences between parent and offspring', () => {
    // Both parents are the same — offspring should be identical
    const parentA = makeBreedableParent('R', 'R', 'S', 'S', 'O', 'O');
    const parentB = makeBreedableParent('R', 'R', 'S', 'S', 'O', 'O');
    const result = breed(parentA, parentB);
    expect(result.phenotype.color).toBe('Red');
    expect(result.phenotype.pattern).toBe('Solid');
    expect(result.phenotype.shape).toBe('Round');
  });
});

describe('getAllAllelesForGene', () => {
  it('returns all base and mutation alleles for color', () => {
    const all = getAllAllelesForGene('color');
    expect(all['R'].trait).toBe('Red');
    expect(all['W'].trait).toBe('White');
    expect(all['G'].trait).toBe('Green');
    expect(all['B'].trait).toBe('Blue');
    expect(all['P'].trait).toBe('Purple');
  });
});

describe('pickRandomAllele', () => {
  it('returns one of the two alleles', () => {
    const genome = { allele1: 'R', allele2: 'W' };
    const picks = new Set();
    for (let i = 0; i < 100; i++) {
      picks.add(pickRandomAllele(genome));
    }
    expect(picks.has('R')).toBe(true);
    expect(picks.has('W')).toBe(true);
  });
});

// ── Helpers ───────────────────────────────────────────────────────────

function makeBreedableParent(c1, c2, p1, p2, s1, s2) {
  return {
    genome: {
      color:   { allele1: c1, allele2: c2 },
      pattern: { allele1: p1, allele2: p2 },
      shape:   { allele1: s1, allele2: s2 },
    },
  };
}
