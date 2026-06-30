/**
 * GENESYS — Discovery Tracker
 * Tracks which alleles the player has discovered.
 */

function DiscoveryTracker() {
  this.alleles = {};
  for (var i = 0; i < GENE_TYPES.length; i++) {
    this.alleles[GENE_TYPES[i]] = {};
  }
}

DiscoveryTracker.prototype.getAll = function() {
  var genes = {};
  var total = 0;
  var seen = 0;
  for (var i = 0; i < GENE_TYPES.length; i++) {
    var geneType = GENE_TYPES[i];
    var all = getAllAllelesForGene(geneType);
    var entries = [];
    for (var code in all) {
      if (all.hasOwnProperty(code)) {
        var a = all[code];
        entries.push({
          trait: a.trait, dominant: a.dominant, hex: a.hex,
          code: a.code, isMutation: a.isMutation,
          discovered: this.alleles[geneType].hasOwnProperty(a.code),
        });
      }
    }
    genes[geneType] = entries;
    total += entries.length;
    for (var j = 0; j < entries.length; j++) {
      if (entries[j].discovered) seen++;
    }
  }
  return { genes: genes, total: total, seen: seen };
};

DiscoveryTracker.prototype.record = function(organism) {
  var fresh = false;
  for (var i = 0; i < GENE_TYPES.length; i++) {
    var geneType = GENE_TYPES[i];
    var genome = organism.genome[geneType];
    if (!this.alleles[geneType].hasOwnProperty(genome.allele1)) {
      this.alleles[geneType][genome.allele1] = true;
      fresh = true;
    }
    if (!this.alleles[geneType].hasOwnProperty(genome.allele2)) {
      this.alleles[geneType][genome.allele2] = true;
      fresh = true;
    }
  }
  return fresh;
};

DiscoveryTracker.prototype.getDiscovered = function() {
  var result = {};
  for (var i = 0; i < GENE_TYPES.length; i++) {
    var geneType = GENE_TYPES[i];
    result[geneType] = {};
    for (var code in this.alleles[geneType]) {
      if (this.alleles[geneType].hasOwnProperty(code)) {
        result[geneType][code] = true;
      }
    }
  }
  return result;
};
