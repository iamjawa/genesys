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

  var phenotype = {};
  for (var pi = 0; pi < GENE_TYPES.length; pi++) {
    var pg = GENE_TYPES[pi];
    if (genome[pg]) phenotype[pg] = expressGene(pg, genome[pg].allele1, genome[pg].allele2).trait;
  }
  var rarityScore = calculateRarity(genome);
  return {
    id: generateId(),
    name: name || phenotype.color + ' ' + phenotype.shape + ' #' + _idCounter,
    genome: JSON.parse(JSON.stringify(genome)),
    phenotype: { color: phenotype.color, pattern: phenotype.pattern, shape: phenotype.shape, size: phenotype.size },
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
        shape:   { allele1: 'O', allele2: 'O' },
        size:    { allele1: 'T', allele2: 'T' } },
      [], 0, 'Rose'
    ),
    createOrganism(
      { color: { allele1: 'W', allele2: 'W' },
        pattern: { allele1: 'T', allele2: 'T' },
        shape:   { allele1: 'P', allele2: 'P' },
        size:    { allele1: 'B', allele2: 'B' } },
      [], 0, 'Lily'
    ),
    createOrganism(
      { color: { allele1: 'R', allele2: 'R' },
        pattern: { allele1: 'T', allele2: 'T' },
        shape:   { allele1: 'O', allele2: 'O' },
        size:    { allele1: 'T', allele2: 'B' } },
      [], 0, 'Tulip'
    ),
    createOrganism(
      { color: { allele1: 'W', allele2: 'W' },
        pattern: { allele1: 'S', allele2: 'S' },
        shape:   { allele1: 'P', allele2: 'P' },
        size:    { allele1: 'T', allele2: 'T' } },
      [], 0, 'Daisy'
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

OrganismStore.prototype.removeMultiple = function(ids) {
  if (!ids || !ids.length) return;
  var keep = {};
  for (var ri = 0; ri < this.organisms.length; ri++) {
    keep[this.organisms[ri].id] = true;
  }
  for (var rj = 0; rj < ids.length; rj++) {
    delete keep[ids[rj]];
  }
  var filtered = [];
  for (var rk = 0; rk < this.organisms.length; rk++) {
    if (keep[this.organisms[rk].id]) filtered.push(this.organisms[rk]);
  }
  this.organisms = filtered;
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

OrganismStore.prototype.getLineage = function(id) {
  var org = this.getById(id);
  if (!org) return [];
  var ancestors = [];
  for (var i = 0; i < org.parents.length; i++) {
    var p = this.getById(org.parents[i]);
    if (p) ancestors.push(p);
  }
  return ancestors;
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

// ── Breed Log ──────────────────────────────────────────────────────

var BREED_LOG_KEY = 'gensys_breed_log';

function getBreedLog() {
  try {
    var raw = localStorage.getItem(BREED_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(_) { return []; }
}

function recordBreed(parentA, parentB, offspringCount, effectNames) {
  var log = getBreedLog();
  log.push({
    id: 'bl_' + Date.now().toString(36),
    timestamp: Date.now(),
    parentA: { id: parentA.id, name: parentA.name },
    parentB: { id: parentB.id, name: parentB.name },
    offspringCount: offspringCount,
    effects: effectNames || [],
  });
  if (log.length > 100) log = log.slice(-100);
  try { localStorage.setItem(BREED_LOG_KEY, JSON.stringify(log)); } catch(_) {}
}

function clearBreedLog() {
  try { localStorage.removeItem(BREED_LOG_KEY); } catch(_) {}
}
