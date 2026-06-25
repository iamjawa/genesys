/**
 * GENESYS — Discovery Tracker
 * ============================
 * Tracks which alleles the player has discovered.
 * Built with TDD — tests are in tests/discovery-tracker.test.js.
 */

import { getAllAllelesForGene } from './genetics.js';

const GENE_TYPES = ['color', 'pattern', 'shape'];

export class DiscoveryTracker {
  constructor() {
    this.alleles = {};
    for (const geneType of GENE_TYPES) {
      this.alleles[geneType] = new Set();
    }
  }

  /** Return all possible alleles with discovery status. */
  getAll() {
    const genes = {};
    let total = 0;
    let seen = 0;
    for (const geneType of GENE_TYPES) {
      const all = getAllAllelesForGene(geneType);
      const entries = Object.values(all).map(a => ({
        ...a,
        discovered: this.alleles[geneType].has(a.code),
      }));
      genes[geneType] = entries;
      total += entries.length;
      seen += entries.filter(e => e.discovered).length;
    }
    return { genes, total, seen };
  }

  /** Record an organism's alleles. Returns true if any new allele was discovered. */
  record(organism) {
    let fresh = false;
    for (const geneType of GENE_TYPES) {
      const { allele1, allele2 } = organism.genome[geneType];
      if (!this.alleles[geneType].has(allele1)) {
        this.alleles[geneType].add(allele1);
        fresh = true;
      }
      if (!this.alleles[geneType].has(allele2)) {
        this.alleles[geneType].add(allele2);
        fresh = true;
      }
    }
    return fresh;
  }

  /** Return a map of discovered alleles per gene (Set of allele codes). */
  getDiscovered() {
    const result = {};
    for (const geneType of GENE_TYPES) {
      result[geneType] = new Set(this.alleles[geneType]);
    }
    return result;
  }
}
