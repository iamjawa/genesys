/**
 * GENESYS — Organism Management
 * Factory, persistence (localStorage), and starter-generation.
 */

var _idCounter = 0;

function generateId() {
  return 'org_' + Date.now().toString(36) + '_' + (++_idCounter);
}

function createOrganism(genome, parentIds, generation, name) {
  if (!parentIds) parentIds = [];
  if (generation === undefined) generation = 0;

  var phenotype = {
    color:  expressGene('color',   genome.color.allele1,   genome.color.allele2).trait,
    pattern: expressGene('pattern', genome.pattern.allele1, genome.pattern.allele2).trait,
    shape:  expressGene('shape',   genome.shape.allele1,   genome.shape.allele2).trait,
  };
  var rarityScore = calculateRarity(genome);
  return {
    id: generateId(),
    name: name || phenotype.color + ' ' + phenotype.shape + ' #' + _idCounter,
    genome: JSON.parse(JSON.stringify(genome)),
    phenotype: { color: phenotype.color, pattern: phenotype.pattern, shape: phenotype.shape },
    parents: parentIds.slice(),
    generation: generation,
    rarityScore: rarityScore,
    rarityLabel: getRarityLabel(rarityScore),
    discovered: Date.now(),
    mutations: [],
  };
}

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

function OrganismStore() {
  this.organisms = [];
  this.load();
}

OrganismStore.prototype.load = function() {
  try {
    var raw = localStorage.getItem('gensys_organisms');
    if (raw) {
      this.organisms = JSON.parse(raw);
      for (var i = 0; i < this.organisms.length; i++) {
        var n = parseInt(this.organisms[i].id.split('_').pop(), 10);
        if (n > _idCounter) _idCounter = n;
      }
      return;
    }
  } catch (_) {}
  this.organisms = createStarterOrganisms();
  this.save();
};

OrganismStore.prototype.save = function() {
  try {
    localStorage.setItem('gensys_organisms', JSON.stringify(this.organisms));
  } catch (_) {}
};

OrganismStore.prototype.getAll = function() { return this.organisms.slice(); };

OrganismStore.prototype.getById = function(id) {
  for (var i = 0; i < this.organisms.length; i++) {
    if (this.organisms[i].id === id) return this.organisms[i];
  }
  return null;
};

OrganismStore.prototype.add = function(org) { this.organisms.push(org); this.save(); };

OrganismStore.prototype.addMultiple = function(orgs) {
  for (var i = 0; i < orgs.length; i++) this.organisms.push(orgs[i]);
  this.save();
};

OrganismStore.prototype.remove = function(id) {
  var filtered = [];
  for (var i = 0; i < this.organisms.length; i++) {
    if (this.organisms[i].id !== id) filtered.push(this.organisms[i]);
  }
  this.organisms = filtered;
  this.save();
};

OrganismStore.prototype.rename = function(id, newName) {
  if (!newName || !newName.trim()) return;
  for (var i = 0; i < this.organisms.length; i++) {
    if (this.organisms[i].id === id) {
      this.organisms[i].name = newName.trim();
      this.save();
      return;
    }
  }
};

OrganismStore.prototype.getCount = function() { return this.organisms.length; };

OrganismStore.prototype.getAllSorted = function(by) {
  var copy = this.organisms.slice();
  copy.sort(function(a, b) {
    var va = a[by], vb = b[by];
    if (typeof va === 'string') return va.localeCompare(vb);
    return vb - va; // numeric: descending (highest first)
  });
  return copy;
};

OrganismStore.prototype.getMaxGeneration = function() {
  var max = 0;
  for (var i = 0; i < this.organisms.length; i++) {
    if (this.organisms[i].generation > max) max = this.organisms[i].generation;
  }
  return max;
};

OrganismStore.prototype.getRarest = function() {
  var best = null;
  for (var i = 0; i < this.organisms.length; i++) {
    if (!best || this.organisms[i].rarityScore > best.rarityScore) best = this.organisms[i];
  }
  return best;
};
