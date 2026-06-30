function encodeOrganismCode(organism) {
  var g = organism.genome;
  return g.color.allele1 + g.color.allele2 + g.pattern.allele1 + g.pattern.allele2 + g.shape.allele1 + g.shape.allele2;
}

function decodeOrganismCode(code) {
  if (!code || code.length !== 6) return null;
  code = code.toUpperCase();
  var idx = 0;
  var genome = {
    color: { allele1: code[idx++], allele2: code[idx++] },
    pattern: { allele1: code[idx++], allele2: code[idx++] },
    shape: { allele1: code[idx++], allele2: code[idx++] },
  };
  var geneTypes = ['color', 'pattern', 'shape'];
  for (var g = 0; g < geneTypes.length; g++) {
    var all = getAllAllelesForGene(geneTypes[g]);
    var ge = genome[geneTypes[g]];
    if (!all[ge.allele1] || !all[ge.allele2]) return null;
  }
  return genome;
}
