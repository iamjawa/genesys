/**
 * GENESYS — Application
 * Glues together the genetics engine, organism store, renderer, and tracker.
 */

var store = new OrganismStore();
var tracker = new DiscoveryTracker();
var allOrgs = store.getAll();
for (var oi = 0; oi < allOrgs.length; oi++) {
  tracker.record(allOrgs[oi]);
}
var achievements = new AchievementTracker(store, tracker);
var _prevAchievementIds = achievements.getCompleted().map(function(a) { return a.id; });
var _marketOffer = null;
var _marketAdopted = false;

(function() {
  var $ = function(sel) { return document.querySelector(sel); };
  var dom = {};

  function init() {
    cacheDOM();
    renderCollection();
    renderJournal();
    renderAchievements();
    renderBreedLog();
    generateMarketOffer();
    updateBreedingUI();
    updateStats();
    renderBreedLog();
    showNotification('Welcome to GENESYS! Breed your first two plants.', 'info');
  }

  function cacheDOM() {
    dom.collection     = $('#collection');
    dom.parentASelect  = $('#parent-a-select');
    dom.parentBSelect  = $('#parent-b-select');
    dom.parentAPreview = $('#parent-a-preview');
    dom.parentBPreview = $('#parent-b-preview');
    dom.breedBtn       = $('#breed-btn');
    dom.offspringSlider = $('#offspring-slider');
    dom.offspringLabel  = $('#offspring-count-label');
    dom.results        = $('#results');
    dom.modal          = $('#modal');
    dom.modalBody      = $('#modal-body');
    dom.modalClose     = $('#modal-close');
    dom.notifContainer = $('#notification');
    dom.statsCount     = $('#stats-count');
    dom.statsGen       = $('#stats-gen');
    dom.statsRarest    = $('#stats-rarest');
    dom.statsCompletion = $('#stats-completion');
    dom.journalBody    = $('#journal-body');
    dom.achievementsBody = $('#achievements-body');
    dom.marketBody    = $('#market-body');
    dom.historyBody    = $('#history-body');
    dom.clearHistoryBtn = $('#clear-history-btn');
    dom.sortSelect     = $('#sort-select');
    dom.filterSearch   = $('#filter-search');
    dom.filterRarity   = $('#filter-rarity');
    dom.oddsPanel      = $('#odds-panel');
    dom.selectToggle   = $('#select-toggle');
    dom.bulkBar        = $('#bulk-bar');
    dom.bulkCount      = $('#bulk-count');
    dom.bulkDelete     = $('#bulk-delete');
    dom.bulkCancel     = $('#bulk-cancel');
    dom.selectMode     = false;
    dom.selectedIds    = {};
    dom.importInput    = $('#import-code-input');
    dom.importBtn      = $('#import-code-btn');
    dom.importStatus   = $('#import-status');
  }

  function bindEvents() {
    dom.breedBtn.addEventListener('click', handleBreed);
    dom.modalClose.addEventListener('click', closeModal);
    dom.modal.addEventListener('click', function(e) { if (e.target === dom.modal) closeModal(); });
    dom.parentASelect.addEventListener('change', updateBreedingUI);
    dom.parentBSelect.addEventListener('change', updateBreedingUI);
    if (dom.offspringSlider) dom.offspringSlider.addEventListener('input', function() {
      dom.offspringLabel.textContent = dom.offspringSlider.value;
    });
    if (dom.sortSelect) dom.sortSelect.addEventListener('change', renderCollection);
    if (dom.filterSearch) dom.filterSearch.addEventListener('input', renderCollection);
    if (dom.filterRarity) dom.filterRarity.addEventListener('change', renderCollection);
    if (dom.selectToggle) dom.selectToggle.addEventListener('click', toggleSelectMode);
    if (dom.bulkDelete) dom.bulkDelete.addEventListener('click', bulkDeleteSelected);
    if (dom.bulkCancel) dom.bulkCancel.addEventListener('click', exitSelectMode);
    if (dom.importBtn && dom.importInput) dom.importBtn.addEventListener('click', handleImport);
    if (dom.importInput) dom.importInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleImport(); });
    if (dom.clearHistoryBtn) dom.clearHistoryBtn.addEventListener('click', function() {
      if (confirm('Clear all breeding history?')) { clearBreedLog(); renderBreedLog(); }
    });
  }

  // ── Collection ─────────────────────────────────────────────────

  function toggleSelectMode() {
    dom.selectMode = !dom.selectMode;
    if (!dom.selectMode) exitSelectMode();
    renderCollection();
    dom.selectToggle.textContent = dom.selectMode ? 'Done' : 'Select';
  }

  function exitSelectMode() {
    dom.selectMode = false;
    dom.selectedIds = {};
    dom.bulkBar.classList.add('hidden');
    dom.bulkDelete.disabled = true;
    dom.bulkCount.textContent = '0 selected';
    if (dom.selectToggle) dom.selectToggle.textContent = 'Select';
  }

  function bulkDeleteSelected() {
    var ids = [];
    for (var key in dom.selectedIds) {
      if (dom.selectedIds.hasOwnProperty(key)) ids.push(key);
    }
    if (!ids.length) return;
    if (!confirm('Delete ' + ids.length + ' organism' + (ids.length > 1 ? 's' : '') + ' permanently?')) return;
    store.removeMultiple(ids);
    // Clear from parent selection
    for (var di = 0; di < ids.length; di++) {
      if (dom.parentASelect.value === ids[di]) dom.parentASelect.value = '';
      if (dom.parentBSelect.value === ids[di]) dom.parentBSelect.value = '';
    }
    exitSelectMode();
    renderCollection();
    renderJournal();
    updateBreedingUI();
    updateStats();
    showNotification('Deleted ' + ids.length + ' organism' + (ids.length > 1 ? 's' : ''), 'info');
  }

  function updateBulkBar() {
    var count = 0;
    for (var k in dom.selectedIds) { if (dom.selectedIds.hasOwnProperty(k)) count++; }
    dom.bulkCount.textContent = count + ' selected';
    dom.bulkDelete.disabled = count === 0;
    if (count === 0 && !dom.bulkBar.classList.contains('hidden')) {
      // keep visible so Cancel button is reachable
    }
  }

  function generateMarketOffer() {
    var genome = generateRandomGenome();
    _marketOffer = createOrganism(genome, [], 0);
    _marketAdopted = false;
    renderMarket();
  }

  function renderMarket() {
    if (!dom.marketBody) return;
    if (!_marketOffer) {
      dom.marketBody.innerHTML = '<div class="empty-state">Breed to generate a new offering.</div>';
      return;
    }
    var card = createOrganismCard(_marketOffer, 80);
    var adoptRow = document.createElement('div');
    adoptRow.className = 'market-actions';
    var adoptBtn = document.createElement('button');
    adoptBtn.className = 'btn btn-sm' + (_marketAdopted ? ' disabled' : '');
    adoptBtn.textContent = _marketAdopted ? 'Adopted ✓' : 'Adopt';
    adoptBtn.disabled = _marketAdopted;
    if (!_marketAdopted) {
      adoptBtn.addEventListener('click', function() {
        tracker.record(_marketOffer);
        store.add(_marketOffer);
        _marketAdopted = true;
        renderMarket();
        renderCollection();
        renderJournal();
        updateBreedingUI();
        updateStats();
        showNotification('Adopted: ' + _marketOffer.name, 'info');
      });
    }
    adoptRow.appendChild(adoptBtn);
    var codeStr = encodeOrganismCode(_marketOffer);
    var codeEl = document.createElement('span');
    codeEl.className = 'market-code';
    codeEl.textContent = codeStr;
    adoptRow.appendChild(codeEl);
    dom.marketBody.innerHTML = '';
    dom.marketBody.appendChild(card);
    dom.marketBody.appendChild(adoptRow);
  }

  function renderAchievements() {
    if (!dom.achievementsBody) return;
    var all = achievements.getAll();
    var html = '';
    for (var ai = 0; ai < all.length; ai++) {
      var a = all[ai];
      html += '' +
        '<div class="achievement-card ' + (a.completed ? 'completed' : 'locked') + '">' +
          '<div class="achievement-icon">' + (a.completed ? '\u2B50' : '\u25CB') + '</div>' +
          '<div class="achievement-info">' +
            '<div class="achievement-name">' + a.name + '</div>' +
            '<div class="achievement-desc">' + a.desc + '</div>' +
          '</div>' +
        '</div>';
    }
    dom.achievementsBody.innerHTML = html;
  }

  function renderBreedLog() {
    if (!dom.historyBody) return;
    var log = getBreedLog();
    if (!log.length) {
      dom.historyBody.innerHTML = '<div class="empty-state">No breeding history yet.</div>';
      return;
    }
    var html = '<div class="history-list">';
    for (var hi = log.length - 1; hi >= 0; hi--) {
      var entry = log[hi];
      var date = new Date(entry.timestamp);
      var timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      html += '<div class="history-entry">' +
        '<span class="history-time">' + timeStr + '</span>' +
        '<span class="history-parents">' + entry.parentA.name + ' × ' + entry.parentB.name + '</span>' +
        '<span class="history-count">' + entry.offspringCount + ' offspring</span>';
      if (entry.effects && entry.effects.length) {
        html += '<span class="history-effects">' + entry.effects.join(', ') + '</span>';
      }
      html += '</div>';
    }
    html += '</div>';
    dom.historyBody.innerHTML = html;
  }

  function renderCollection() {
    dom.collection.innerHTML = '';
    var sortBy = dom.sortSelect ? dom.sortSelect.value : 'discovered';
    var all;
    if (sortBy === 'scent' || sortBy === 'texture') {
      all = store.getAll().sort(function(a, b) {
        var va = sortBy === 'scent' ? expressScent(a) : expressTexture(a);
        var vb = sortBy === 'scent' ? expressScent(b) : expressTexture(b);
        return va.localeCompare(vb);
      });
    } else {
      all = sortBy === 'discovered' ? store.getAll() : store.getAllSorted(sortBy);
    }
    if (sortBy === 'discovered') all = all.reverse();

    // Apply filters
    var searchQ = dom.filterSearch ? dom.filterSearch.value.trim().toLowerCase() : '';
    var rarityF = dom.filterRarity ? dom.filterRarity.value : '';
    if (searchQ || rarityF) {
      all = all.filter(function(o) {
        if (searchQ && o.name.toLowerCase().indexOf(searchQ) === -1) return false;
        if (rarityF && o.rarityLabel !== rarityF) return false;
        return true;
      });
    }

    if (!all.length) {
      dom.collection.innerHTML = '<div class="empty-state">No organisms match your filters.</div>';
      return;
    }
    var frag = document.createDocumentFragment();
    for (var i = all.length - 1; i >= 0; i--) {
      (function(org) {
        var card = createOrganismCard(org, 80);
        card.addEventListener('click', function(e) {
          if (e.target.closest('.card-name')) return;
          if (e.target.closest('.card-delete')) return;
          if (e.target.closest('.card-check')) return;
          if (dom.selectMode) {
            // Toggle selection
            if (dom.selectedIds[org.id]) {
              delete dom.selectedIds[org.id];
              card.classList.remove('selected');
            } else {
              dom.selectedIds[org.id] = true;
              card.classList.add('selected');
            }
            updateBulkBar();
            return;
          }
          showDetail(org);
        });
        var nameEl = card.querySelector('.card-name');
        if (nameEl) {
          nameEl.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            inlineRename(org, nameEl);
          });
        }
        // Select-mode checkbox
        if (dom.selectMode) {
          var chk = document.createElement('input');
          chk.type = 'checkbox';
          chk.className = 'card-check';
          chk.addEventListener('change', function(e) {
            e.stopPropagation();
            if (chk.checked) {
              dom.selectedIds[org.id] = true;
              card.classList.add('selected');
            } else {
              delete dom.selectedIds[org.id];
              card.classList.remove('selected');
            }
            updateBulkBar();
          });
          card.appendChild(chk);
        }
        var delBtn = document.createElement('button');
        delBtn.className = 'card-delete';
        delBtn.textContent = '\u00D7';
        delBtn.title = 'Delete';
        delBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          deleteOrganism(org);
        });
        card.appendChild(delBtn);
        frag.appendChild(card);
      })(all[i]);
    }
    dom.collection.appendChild(frag);
  }

  // ── Trait Journal ──────────────────────────────────────────────

  function renderJournal() {
    if (!dom.journalBody) return;

    var allAlleles = tracker.getAll();
    var discovered = tracker.getDiscovered();
    var total = allAlleles.total;
    var seen = allAlleles.seen;
    var pct = total > 0 ? Math.round((seen / total) * 100) : 0;

    var html = '' +
      '<div class="journal-summary">' +
        '<span class="journal-progress">' + seen + ' / ' + total + ' alleles</span>' +
        '<span class="journal-bar"><span class="journal-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="journal-pct">' + pct + '%</span>' +
      '</div>' +
      '<div class="journal-grid">' +
        renderGeneGroup('color',   'Color',   allAlleles, discovered) +
        renderGeneGroup('pattern', 'Pattern', allAlleles, discovered) +
        renderGeneGroup('shape',   'Shape',   allAlleles, discovered) +
      '</div>';
    dom.journalBody.innerHTML = html;
  }

  function renderGeneGroup(geneType, label, allAlleles, discovered) {
    var gene = allAlleles.genes[geneType];
    if (!gene) return '';
    var entries = '';
    for (var i = 0; i < gene.length; i++) {
      var a = gene[i];
      var found = discovered[geneType] && discovered[geneType].hasOwnProperty(a.code);
      entries += '' +
        '<div class="journal-allele ' + (found ? 'found' : 'hidden') + '">' +
          '<span class="journal-allele-code">' + a.code + '</span>' +
          '<span class="journal-allele-name">' + (found ? a.trait : '???') + '</span>' +
        '</div>';
    }
    return '' +
      '<div class="journal-gene">' +
        '<div class="journal-gene-label">' + label + '</div>' +
        '<div class="journal-alleles">' + entries + '</div>' +
      '</div>';
  }

  // ── Breeding UI ────────────────────────────────────────────────

  function updatePreview(selectEl, previewEl) {
    var id = selectEl.value;
    var org = id ? store.getById(id) : null;
    previewEl.innerHTML = org ? renderOrganismSVG(org, 46) : '';
    if (org) previewEl.classList.add('filled');
    else previewEl.classList.remove('filled');
  }

  function updateBreedingUI() {
    var aId = dom.parentASelect.value;
    var orgs = store.getAll();

    dom.parentASelect.innerHTML = '<option value="">\u2014 Select \u2014</option>';
    for (var i = 0; i < orgs.length; i++) {
      var opt = document.createElement('option');
      opt.value = orgs[i].id;
      opt.textContent = orgs[i].name + '  (' + orgs[i].phenotype.color + '/' + orgs[i].phenotype.pattern + '/' + orgs[i].phenotype.shape + ') G' + orgs[i].generation;
      dom.parentASelect.appendChild(opt);
    }
    if (aId && store.getById(aId)) dom.parentASelect.value = aId;

    var bId = dom.parentBSelect.value;
    dom.parentBSelect.innerHTML = '<option value="">\u2014 Select \u2014</option>';
    for (var j = 0; j < orgs.length; j++) {
      if (orgs[j].id === dom.parentASelect.value) continue;
      var opt2 = document.createElement('option');
      opt2.value = orgs[j].id;
      opt2.textContent = orgs[j].name + '  (' + orgs[j].phenotype.color + '/' + orgs[j].phenotype.pattern + '/' + orgs[j].phenotype.shape + ') G' + orgs[j].generation;
      dom.parentBSelect.appendChild(opt2);
    }
    if (bId && store.getById(bId) && bId !== dom.parentASelect.value) dom.parentBSelect.value = bId;

    updatePreview(dom.parentASelect, dom.parentAPreview);
    updatePreview(dom.parentBSelect, dom.parentBPreview);
    dom.breedBtn.disabled = !dom.parentASelect.value || !dom.parentBSelect.value;
    renderOdds();
  }

  function renderOdds() {
    if (!dom.oddsPanel) return;
    var aId = dom.parentASelect.value;
    var bId = dom.parentBSelect.value;
    if (!aId || !bId) { dom.oddsPanel.innerHTML = ''; return; }
    var pA = store.getById(aId);
    var pB = store.getById(bId);
    if (!pA || !pB) { dom.oddsPanel.innerHTML = ''; return; }
    var odds = computeBreedingOdds(pA, pB);
    var html = '<div class="odds-title">Predicted outcomes</div><div class="odds-grid">';
    var geneLabels = { color: 'Color', pattern: 'Pattern', shape: 'Shape', size: 'Size' };
    for (var gi = 0; gi < GENE_TYPES.length; gi++) {
      var gt = GENE_TYPES[gi];
      var outcomes = odds[gt];
      html += '<div class="odds-gene"><div class="odds-gene-label">' + geneLabels[gt] + '</div>';
      for (var trait in outcomes) {
        if (outcomes.hasOwnProperty(trait)) {
          var pct = Math.round(outcomes[trait] * 100);
          html += '<div class="odds-row">' +
            '<span class="odds-label">' + trait + '</span>' +
            '<span class="odds-bar-track"><span class="odds-bar-fill" style="width:' + pct + '%"></span></span>' +
            '<span class="odds-pct">' + pct + '%</span>' +
          '</div>';
        }
      }
      html += '</div>';
    }
    html += '</div>';

    // Synergy effects
    var effects = getSynergyEffects(pA, pB);
    if (effects.length) {
      html += '<div class="odds-title" style="margin-top:.75rem">Synergy effects</div><div class="synergy-grid">';
      for (var ei = 0; ei < effects.length; ei++) {
        html += '<div class="synergy-entry">' +
          '<span class="synergy-name">' + effects[ei].name + '</span>' +
          '<span class="synergy-desc">' + effects[ei].desc + '</span>' +
        '</div>';
      }
      html += '</div>';
    }

    dom.oddsPanel.innerHTML = html;
  }

  // ── Breeding ───────────────────────────────────────────────────

  function handleBreed() {
    var pA = store.getById(dom.parentASelect.value);
    var pB = store.getById(dom.parentBSelect.value);
    if (!pA || !pB) return;

    var effects = getSynergyEffects(pA, pB);
    var hasPrimal = false;
    var hasRainbow = false;
    for (var ei = 0; ei < effects.length; ei++) {
      if (effects[ei].id === 'primal') hasPrimal = true;
      if (effects[ei].id === 'rainbow') hasRainbow = true;
    }
    var recipe = getBreedingRecipe(pA, pB);

    var count = dom.offspringSlider ? parseInt(dom.offspringSlider.value, 10) : (1 + Math.floor(Math.random() * 3));
    var offspring = [];
    var newMutationCount = 0;
    var newDiscoveries = false;

    for (var i = 0; i < count; i++) {
      var result = breed(pA, pB);

      // Rainbow: force color mutation
      if (hasRainbow && !result.hasMutation) {
        var newAllele = getRandomMutation('color');
        if (Math.random() < 0.5) result.genome.color.allele1 = newAllele;
        else result.genome.color.allele2 = newAllele;
        result.mutations.push({ gene: 'color', allele: newAllele });
        result.hasMutation = true;
        result.phenotype.color = expressGene('color', result.genome.color.allele1, result.genome.color.allele2).trait;
      }

      var gen = Math.max(pA.generation, pB.generation) + 1;
      var org = createOrganism(result.genome, [pA.id, pB.id], gen);
      if (recipe) org.name = recipe.name + ' ' + org.name;
      org.mutations = result.mutations;
      org.hasMutation = result.hasMutation;

      // Primal: +1 rarity score
      if (hasPrimal) {
        org.rarityScore = Math.min(org.rarityScore + 1, 5);
        org.rarityLabel = getRarityLabel(org.rarityScore);
      }

      if (result.hasMutation) newMutationCount += result.mutations.length;
      var org = createOrganism(result.genome, [pA.id, pB.id], gen);
      org.mutations = result.mutations;
      org.hasMutation = result.hasMutation;
      if (result.hasMutation) newMutationCount += result.mutations.length;

      if (tracker.record(org)) newDiscoveries = true;
      offspring.push(org);
    }

    for (var k = 0; k < offspring.length; k++) store.add(offspring[k]);

    var effectNames = [];
    for (var effi = 0; effi < effects.length; effi++) effectNames.push(effects[effi].name);
    if (recipe) effectNames.push(recipe.name);
    recordBreed(pA, pB, offspring.length, effectNames);
    if (recipe) showNotification('Recipe: ' + recipe.name + '!', 'rare');
    generateMarketOffer();

    showResults(offspring);
    renderCollection();
    renderJournal();
    renderAchievements();
    updateBreedingUI();
    updateStats();

    // Check for newly completed achievements
    var completedNow = achievements.getCompleted().map(function(a) { return a.id; });
    var newly = achievements.checkNew(_prevAchievementIds);
    _prevAchievementIds = completedNow;
    for (var nai = 0; nai < newly.length; nai++) {
      showNotification('Achievement unlocked: ' + newly[nai].name + '!', 'rare');
    }

    if (newDiscoveries) showNotification('New allele discovered! Check the Journal.', 'discovery');
    if (newMutationCount > 0) showNotification('Mutation! A new allele appears!', 'mutation');

    var rares = [];
    var legs  = [];
    for (var m = 0; m < offspring.length; m++) {
      if (offspring[m].rarityLabel === 'Rare') rares.push(offspring[m]);
      if (offspring[m].rarityLabel === 'Legendary') legs.push(offspring[m]);
    }
    if (legs.length) {
      showNotification('Legendary organism discovered!', 'rare');
      for (var lgi = 0; lgi < legs.length; lgi++) {
        showLegendaryReveal(legs[lgi]);
      }
    } else if (rares.length) {
      showNotification('Rare organism discovered!', 'rare');
    }
  }

  function showResults(offspring) {
    dom.results.innerHTML = '';
    var title = document.createElement('h3');
    title.className = 'results-title';
    title.textContent = 'Offspring';
    dom.results.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'offspring-grid';
    for (var i = 0; i < offspring.length; i++) {
      (function(org) {
        var card = createOrganismCard(org, 80);
        card.addEventListener('click', function() { showDetail(org); });
        if (org.hasMutation) {
          var badge = document.createElement('div');
          badge.className = 'mutation-badge';
          badge.textContent = '\uD83E\uDDEC';
          card.appendChild(badge);
        }
        grid.appendChild(card);
      })(offspring[i]);
    }
    dom.results.appendChild(grid);
    dom.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function handleImport() {
    var code = dom.importInput.value.trim();
    if (!code) return;
    var genome = decodeOrganismCode(code);
    if (!genome) {
      dom.importStatus.textContent = 'Invalid code';
      dom.importStatus.className = 'import-status error';
      return;
    }
    var org = createOrganism(genome, [], 0);
    var discovered = tracker.record(org);
    store.add(org);
    dom.importInput.value = '';
    dom.importStatus.textContent = 'Imported: ' + org.name;
    dom.importStatus.className = 'import-status ok';
    renderCollection();
    renderJournal();
    renderAchievements();
    updateBreedingUI();
    updateStats();
    if (discovered) showNotification('New allele discovered via import!', 'discovery');
  }

  // ── Detail Modal ───────────────────────────────────────────────

  function showDetail(organism) {
    dom.modalBody.innerHTML = '';
    dom.modal.classList.add('visible');

    var svg = renderOrganismSVG(organism, 130);
    var g = organism.genome;

    function domInfo(geneType, label) {
      var all = getAllAllelesForGene(geneType);
      var a1 = all[g[geneType].allele1];
      var a2 = all[g[geneType].allele2];
      var isDom = (a1 && a1.dominant) || (a2 && a2.dominant);
      return '' +
        '<div class="trait-row">' +
          '<span class="trait-label">' + label + '</span>' +
          '<span class="trait-value">' + organism.phenotype[geneType] + '</span>' +
          '<span class="trait-genotype ' + (isDom ? '' : 'recessive') + '">' + g[geneType].allele1 + ' / ' + g[geneType].allele2 + '</span>' +
        '</div>';
    }

    var lineage = store.getLineage(organism.id);
    var lineageHtml = '';
    if (lineage.length) {
      lineageHtml = '<div class="lineage">' +
        '<div class="lineage-label">Parents</div>' +
        '<div class="lineage-grid">';
      for (var li = 0; li < lineage.length; li++) {
        var p = lineage[li];
        lineageHtml += '' +
          '<div class="lineage-entry" data-id="' + p.id + '">' +
            renderOrganismSVG(p, 32) +
            '<span class="lineage-name">' + p.name + '</span>' +
          '</div>';
      }
      lineageHtml += '</div></div>';
    } else {
      lineageHtml = '<div class="lineage"><div class="lineage-label">Wild (original)</div></div>';
    }

    var breakdown = getRarityBreakdown(organism.genome);
    var breakdownHtml = '';
    if (breakdown.length) {
      breakdownHtml = '<div class="rarity-breakdown">';
      for (var bi = 0; bi < breakdown.length; bi++) {
        breakdownHtml += '<div class="breakdown-line">' + breakdown[bi] + '</div>';
      }
      breakdownHtml += '</div>';
    }

    dom.modalBody.innerHTML = '' +
      '<div class="detail-layout">' +
        '<div class="detail-svg">' + svg + '</div>' +
        '<div class="detail-info">' +
          '<h2 class="detail-name">' + organism.name + '</h2>' +
          '<div class="detail-rarity ' + organism.rarityLabel.toLowerCase() + '">' + organism.rarityLabel + '</div>' +
          breakdownHtml +
          '<div class="detail-meta">' +
            '<span>Generation ' + organism.generation + '</span>' +
            '<span>ID: ' + organism.id + '</span>' +
          '</div>' +
          lineageHtml +
          '<div class="detail-traits">' +
            domInfo('color', 'Color') +
            domInfo('pattern', 'Pattern') +
            domInfo('shape', 'Shape') +
            domInfo('size', 'Size') +
          '<div class="trait-row">' +
            '<span class="trait-label">Scent</span>' +
            '<span class="trait-value">' + expressScent(organism) + '</span>' +
            '<span class="trait-genotype">polygenic</span>' +
          '</div>' +
          '<div class="trait-row">' +
            '<span class="trait-label">Texture</span>' +
            '<span class="trait-value">' + expressTexture(organism) + '</span>' +
            '<span class="trait-genotype">polygenic</span>' +
          '</div>' +
          '</div>' +
          '<div class="detail-actions">' +
            '<button class="btn btn-sm set-parent" data-id="' + organism.id + '" data-slot="a">Set as Parent A</button>' +
            '<button class="btn btn-sm set-parent" data-id="' + organism.id + '" data-slot="b">Set as Parent B</button>' +
            '<button class="btn btn-sm" id="export-code-btn">Export Code</button>' +
            '<button class="btn btn-sm btn-delete" data-id="' + organism.id + '">Delete</button>' +
          '</div>' +
          '<div id="export-code-area" class="export-code-area hidden">' +
            '<input type="text" class="export-code-input" readonly>' +
            '<button class="btn btn-sm" id="copy-code-btn">Copy</button>' +
            '<span class="export-copied hidden">Copied!</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    var buttons = dom.modalBody.querySelectorAll('.set-parent');
    for (var i = 0; i < buttons.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var slot = btn.dataset.slot;
          var select = slot === 'a' ? dom.parentASelect : dom.parentBSelect;
          select.value = btn.dataset.id;
          select.dispatchEvent(new Event('change'));
          closeModal();
        });
      })(buttons[i]);
    }
    var delBtn = dom.modalBody.querySelector('.btn-delete');
    if (delBtn) {
      delBtn.addEventListener('click', function() {
        deleteOrganism(organism);
      });
    }
    var lineageEntries = dom.modalBody.querySelectorAll('.lineage-entry');
    for (var li = 0; li < lineageEntries.length; li++) {
      (function(entry) {
        entry.addEventListener('click', function(e) {
          e.stopPropagation();
          var pid = entry.dataset.id;
          var pOrg = store.getById(pid);
          if (pOrg) showDetail(pOrg);
        });
      })(lineageEntries[li]);
    }

    var exportBtn = dom.modalBody.querySelector('#export-code-btn');
    var exportArea = dom.modalBody.querySelector('#export-code-area');
    var exportInput = dom.modalBody.querySelector('.export-code-input');
    var copyBtn = dom.modalBody.querySelector('#copy-code-btn');
    var copiedMsg = dom.modalBody.querySelector('.export-copied');

    if (exportBtn && exportArea && exportInput) {
      exportBtn.addEventListener('click', function() {
        exportInput.value = encodeOrganismCode(organism);
        exportArea.classList.toggle('hidden');
      });
    }

    if (copyBtn && exportInput && copiedMsg) {
      copyBtn.addEventListener('click', function() {
        exportInput.select();
        try { document.execCommand('copy'); } catch(_) {}
        copiedMsg.classList.remove('hidden');
        setTimeout(function() { copiedMsg.classList.add('hidden'); }, 2000);
      });
    }
  }

  // ── Delete ─────────────────────────────────────────────────────

  function deleteOrganism(org) {
    if (!confirm('Delete "' + org.name + '" permanently?')) return;
    store.remove(org.id);
    // Clear from parent selection if selected
    if (dom.parentASelect.value === org.id) { dom.parentASelect.value = ''; }
    if (dom.parentBSelect.value === org.id) { dom.parentBSelect.value = ''; }
    closeModal();
    renderCollection();
    renderJournal();
    renderAchievements();
    updateBreedingUI();
    updateStats();
    showNotification('Deleted ' + org.name, 'info');
  }

  // ── Rename ─────────────────────────────────────────────────────

  function inlineRename(org, nameEl) {
    var input = document.createElement('input');
    input.className = 'inline-rename';
    input.type = 'text';
    input.value = org.name;
    input.maxLength = 30;

    var finish = function() {
      var val = input.value.trim();
      if (val && val !== org.name) {
        store.rename(org.id, val);
        org.name = val;
      }
      nameEl.textContent = org.name;
      nameEl.style.display = '';
      input.remove();
    };

    nameEl.style.display = 'none';
    nameEl.parentNode.insertBefore(input, nameEl);
    input.focus();
    input.select();

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = org.name; input.blur(); }
    });
  }

  // ── Legendary Reveal ──────────────────────────────────────────

  function showLegendaryReveal(organism, container) {
    if (!container) container = document.body;
    var overlay = document.createElement('div');
    overlay.className = 'legendary-overlay';

    var svg = renderOrganismSVG(organism, 80);

    overlay.innerHTML = '' +
      '<div class="legendary-sparkles"></div>' +
      '<div class="legendary-flower">' + svg + '</div>' +
      '<div class="legendary-title">Legendary!</div>' +
      '<div class="legendary-name">' + organism.name + '</div>';

    container.appendChild(overlay);

    // Auto-remove after animation
    setTimeout(function() {
      overlay.classList.add('legendary-fadeout');
      setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 500);
    }, 2800);
  }

  function closeModal() { dom.modal.classList.remove('visible'); }

  // ── Stats ──────────────────────────────────────────────────────

  function updateStats() {
    dom.statsCount.textContent = store.getCount();
    dom.statsGen.textContent   = store.getMaxGeneration();
    var r = store.getRarest();
    dom.statsRarest.textContent = r ? r.rarityLabel : '\u2014';
    if (dom.statsCompletion) {
      var a = tracker.getAll();
      var pct = a.total > 0 ? Math.round((a.seen / a.total) * 100) : 0;
      dom.statsCompletion.textContent = pct + '%';
    }
  }

  // ── Notifications ──────────────────────────────────────────────

  function showNotification(message, type) {
    var el = document.createElement('div');
    el.className = 'notif notif-' + (type || 'info');
    el.textContent = message;
    dom.notifContainer.appendChild(el);
    requestAnimationFrame(function() { el.classList.add('visible'); });
    setTimeout(function() {
      el.classList.remove('visible');
      setTimeout(function() { el.remove(); }, 400);
    }, 4000);
  }

  // ── Boot ───────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', init);
})();
