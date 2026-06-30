function encodeOrganismCode(organism) {
  var g = organism.genome;
  return g.color.allele1 + g.color.allele2 + g.pattern.allele1 + g.pattern.allele2 + g.shape.allele1 + g.shape.allele2 + g.size.allele1 + g.size.allele2;
}

function decodeOrganismCode(code) {
  if (!code) return null;
  code = code.toUpperCase();
  var genome = {};
  if (code.length === 8) {
    var idx = 0;
    genome.color   = { allele1: code[idx++], allele2: code[idx++] };
    genome.pattern = { allele1: code[idx++], allele2: code[idx++] };
    genome.shape   = { allele1: code[idx++], allele2: code[idx++] };
    genome.size    = { allele1: code[idx++], allele2: code[idx++] };
  } else if (code.length === 6) {
    var idx2 = 0;
    genome.color   = { allele1: code[idx2++], allele2: code[idx2++] };
    genome.pattern = { allele1: code[idx2++], allele2: code[idx2++] };
    genome.shape   = { allele1: code[idx2++], allele2: code[idx2++] };
    genome.size    = { allele1: 'T', allele2: 'T' };
  } else {
    return null;
  }
  for (var g = 0; g < GENE_TYPES.length; g++) {
    var all = getAllAllelesForGene(GENE_TYPES[g]);
    var ge = genome[GENE_TYPES[g]];
    if (!all[ge.allele1] || !all[ge.allele2]) return null;
  }
  return genome;
}
