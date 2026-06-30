/**
 * GENESYS — Genetics Engine
 * Simplified Mendelian inheritance for the breeding game.
 */

var GENES = {
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

var MUTATION_CHANCE = 0.03;

function getAllAllelesForGene(geneType) {
  var gene = GENES[geneType];
  var map = {};
  for (var code in gene.baseAlleles) {
    if (gene.baseAlleles.hasOwnProperty(code)) {
      var info = gene.baseAlleles[code];
      map[code] = { trait: info.trait, hex: info.hex, dominant: info.dominant, code: code, isMutation: false };
    }
  }
  for (var i = 0; i < gene.mutationPool.length; i++) {
    var m = gene.mutationPool[i];
    map[m.allele] = { trait: m.trait, dominant: m.dominant, hex: m.hex, code: m.allele, isMutation: true };
  }
  return map;
}

function expressGene(geneType, allele1, allele2) {
  var all = getAllAllelesForGene(geneType);
  var a1 = all[allele1];
  var a2 = all[allele2];
  if (!a1 || !a2) return a1 || a2;
  if (a1.dominant) return a1;
  if (a2.dominant) return a2;
  return a1;
}

function pickRandomAllele(gene) {
  return Math.random() < 0.5 ? gene.allele1 : gene.allele2;
}

function getRandomMutation(geneType) {
  var pool = GENES[geneType].mutationPool;
  return pool[Math.floor(Math.random() * pool.length)].allele;
}

function breed(parentA, parentB) {
  var genome = {};
  var mutations = [];

  var geneTypes = ['color', 'pattern', 'shape'];
  for (var g = 0; g < geneTypes.length; g++) {
    var geneType = geneTypes[g];
    var allele1 = pickRandomAllele(parentA.genome[geneType]);
    var allele2 = pickRandomAllele(parentB.genome[geneType]);

    if (Math.random() < MUTATION_CHANCE) {
      var newAllele = getRandomMutation(geneType);
      if (Math.random() < 0.5) allele1 = newAllele;
      else allele2 = newAllele;
      mutations.push({ gene: geneType, allele: newAllele });
    }

    genome[geneType] = { allele1: allele1, allele2: allele2 };
  }

  var phenotype = {
    color:  expressGene('color',   genome.color.allele1,   genome.color.allele2).trait,
    pattern: expressGene('pattern', genome.pattern.allele1, genome.pattern.allele2).trait,
    shape:  expressGene('shape',   genome.shape.allele1,   genome.shape.allele2).trait,
  };

  return { genome: genome, phenotype: phenotype, mutations: mutations, hasMutation: mutations.length > 0 };
}

function calculateRarity(genome) {
  var score = 1;
  var geneTypes = ['color', 'pattern', 'shape'];
  for (var g = 0; g < geneTypes.length; g++) {
    var geneType = geneTypes[g];
    var ge = genome[geneType];
    var all = getAllAllelesForGene(geneType);
    var a1 = all[ge.allele1];
    var a2 = all[ge.allele2];

    if (a1.isMutation && a2.isMutation && ge.allele1 === ge.allele2) {
      score = Math.max(score, 5);
    } else if (a1.isMutation || a2.isMutation) {
      score = Math.max(score, 3);
    } else if (!a1.dominant && !a2.dominant && ge.allele1 === ge.allele2) {
      score = Math.max(score, 2);
    }
  }
  return score;
}

function getRarityLabel(score) {
  if (score >= 5) return 'Legendary';
  if (score >= 3) return 'Rare';
  if (score >= 2) return 'Uncommon';
  return 'Common';
}

function getRarityBreakdown(genome) {
  var reasons = [];
  var geneLabels = { color: 'Color', pattern: 'Pattern', shape: 'Shape' };
  var geneTypes = ['color', 'pattern', 'shape'];
  for (var g = 0; g < geneTypes.length; g++) {
    var geneType = geneTypes[g];
    var ge = genome[geneType];
    var all = getAllAllelesForGene(geneType);
    var a1 = all[ge.allele1];
    var a2 = all[ge.allele2];
    var label = geneLabels[geneType];

    if (a1.isMutation && a2.isMutation && ge.allele1 === ge.allele2) {
      reasons.push(label + ': homozygous mutation (' + ge.allele1 + '/' + ge.allele2 + ') \u2192 Legendary');
    } else if (a1.isMutation || a2.isMutation) {
      var mut = a1.isMutation ? ge.allele1 : ge.allele2;
      reasons.push(label + ': carries mutation allele ' + mut + ' \u2192 Rare');
    } else if (!a1.dominant && !a2.dominant && ge.allele1 === ge.allele2) {
      reasons.push(label + ': homozygous recessive (' + ge.allele1 + '/' + ge.allele2 + ') \u2192 Uncommon');
    }
  }
  return reasons;
}

/**
 * Polygenic trait: Scent
 * Emerges from the interaction of Color and Pattern genes.
 * Any mutation in either gene → Exotic.
 */
function expressScent(organism) {
  var genome = organism.genome;
  var colorTrait = expressGene('color', genome.color.allele1, genome.color.allele2).trait;
  var patternTrait = expressGene('pattern', genome.pattern.allele1, genome.pattern.allele2).trait;

  var allColor = getAllAllelesForGene('color');
  var allPattern = getAllAllelesForGene('pattern');

  if ((allColor[genome.color.allele1] && allColor[genome.color.allele1].isMutation) ||
      (allColor[genome.color.allele2] && allColor[genome.color.allele2].isMutation) ||
      (allPattern[genome.pattern.allele1] && allPattern[genome.pattern.allele1].isMutation) ||
      (allPattern[genome.pattern.allele2] && allPattern[genome.pattern.allele2].isMutation)) {
    return 'Exotic';
  }

  if (colorTrait === 'Red' && patternTrait === 'Solid') return 'Sweet';
  if (colorTrait === 'Red' && patternTrait === 'Striped') return 'Spicy';
  if (colorTrait === 'White' && patternTrait === 'Solid') return 'Fresh';
  if (colorTrait === 'White' && patternTrait === 'Striped') return 'Earthy';

  // Fallback for other combos (e.g. mutation colors with non-mutation patterns)
  return 'Earthy';
}

function getSynergyEffects(parentA, parentB) {
  var effects = [];

  // Primal: both parents are generation 0 → +1 rarity score on offspring
  if (parentA.generation === 0 && parentB.generation === 0) {
    effects.push({ id: 'primal', name: 'Primal', desc: 'Both wild organisms — +1 rarity score' });
  }

  // Rainbow: parents have different expressed colors → offspring color mutation
  if (parentA.phenotype.color !== parentB.phenotype.color) {
    effects.push({ id: 'rainbow', name: 'Rainbow', desc: 'Different colors — offspring color may mutate' });
  }

  return effects;
}

function computeBreedingOdds(parentA, parentB) {
  var result = {};
  var geneTypes = ['color', 'pattern', 'shape'];
  var geneLabels = { color: 'Color', pattern: 'Pattern', shape: 'Shape' };

  for (var g = 0; g < geneTypes.length; g++) {
    var geneType = geneTypes[g];
    var pa = parentA.genome[geneType];
    var pb = parentB.genome[geneType];
    var combos = [
      [pa.allele1, pb.allele1],
      [pa.allele1, pb.allele2],
      [pa.allele2, pb.allele1],
      [pa.allele2, pb.allele2],
    ];
    var tally = {};
    for (var c = 0; c < combos.length; c++) {
      var phenotype = expressGene(geneType, combos[c][0], combos[c][1]).trait;
      if (!tally[phenotype]) tally[phenotype] = 0;
      tally[phenotype] += 0.25;
    }
    result[geneType] = tally;
  }
  return result;
}
