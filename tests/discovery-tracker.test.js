import { describe, it, expect } from 'vitest';
import { DiscoveryTracker } from '../js/discovery-tracker.js';

describe('DiscoveryTracker', () => {
  it('reports zero discoveries when empty', () => {
    const t = new DiscoveryTracker();
    const all = t.getAll();
    expect(all.total).toBeGreaterThan(0);
    expect(all.seen).toBe(0);
  });

  it('records alleles from an organism', () => {
    const t = new DiscoveryTracker();
    const org = makeOrganism(
      { color: { allele1: 'R', allele2: 'R' },
        pattern: { allele1: 'S', allele2: 'T' },
        shape:   { allele1: 'O', allele2: 'P' } }
    );
    t.record(org);

    const d = t.getDiscovered();
    expect(d.color.has('R')).toBe(true);
    expect(d.pattern.has('S')).toBe(true);
    expect(d.pattern.has('T')).toBe(true);
    expect(d.shape.has('O')).toBe(true);
    expect(d.shape.has('P')).toBe(true);
  });

  it('returns true when new alleles are discovered, false otherwise', () => {
    const t = new DiscoveryTracker();
    const org1 = makeOrganism(
      { color: { allele1: 'R', allele2: 'R' },
        pattern: { allele1: 'S', allele2: 'S' },
        shape:   { allele1: 'O', allele2: 'O' } }
    );
    expect(t.record(org1)).toBe(true);

    // Same organism again — no new alleles
    expect(t.record(org1)).toBe(false);
  });
});

function makeOrganism(genome) {
  return {
    genome: JSON.parse(JSON.stringify(genome)),
    phenotype: {
      color: 'Red', pattern: 'Solid', shape: 'Round',
    },
    name: 'Test',
    id: 'test_1',
    parents: [],
    generation: 0,
    rarityScore: 1,
    rarityLabel: 'Common',
    discovered: Date.now(),
    mutations: [],
  };
}
