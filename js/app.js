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

(function() {
  var $ = function(sel) { return document.querySelector(sel); };
  var dom = {};

  function init() {
    cacheDOM();
    renderCollection();
    renderJournal();
    updateBreedingUI();
    bindEvents();
    updateStats();
    showNotification('Welcome to GENESYS! Breed your first two plants.', 'info');
  }

  function cacheDOM() {
    dom.collection     = $('#collection');
    dom.parentASelect  = $('#parent-a-select');
    dom.parentBSelect  = $('#parent-b-select');
    dom.parentAPreview = $('#parent-a-preview');
    dom.parentBPreview = $('#parent-b-preview');
    dom.breedBtn       = $('#breed-btn');
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
    dom.sortSelect     = $('#sort-select');
  }

  function bindEvents() {
    dom.breedBtn.addEventListener('click', handleBreed);
    dom.modalClose.addEventListener('click', closeModal);
    dom.modal.addEventListener('click', function(e) { if (e.target === dom.modal) closeModal(); });
    dom.parentASelect.addEventListener('change', updateBreedingUI);
    dom.parentBSelect.addEventListener('change', updateBreedingUI);
    if (dom.sortSelect) dom.sortSelect.addEventListener('change', renderCollection);
  }

  // ── Collection ─────────────────────────────────────────────────

  function renderCollection() {
    dom.collection.innerHTML = '';
    var sortBy = dom.sortSelect ? dom.sortSelect.value : 'discovered';
    var all = sortBy === 'discovered' ? store.getAll() : store.getAllSorted(sortBy);
    if (sortBy === 'discovered') all = all.reverse();
    if (!all.length) {
      dom.collection.innerHTML = '<div class="empty-state">No organisms yet. Start breeding!</div>';
      return;
    }
    var frag = document.createDocumentFragment();
    for (var i = all.length - 1; i >= 0; i--) {
      (function(org) {
        var card = createOrganismCard(org, 80);
        card.addEventListener('click', function(e) {
          if (e.target.closest('.card-name')) return;
          if (e.target.closest('.card-delete')) return;
          showDetail(org);
        });
        var nameEl = card.querySelector('.card-name');
        if (nameEl) {
          nameEl.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            inlineRename(org, nameEl);
          });
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
  }

  // ── Breeding ───────────────────────────────────────────────────

  function handleBreed() {
    var pA = store.getById(dom.parentASelect.value);
    var pB = store.getById(dom.parentBSelect.value);
    if (!pA || !pB) return;

    var count = 1 + Math.floor(Math.random() * 3);
    var offspring = [];
    var newMutationCount = 0;
    var newDiscoveries = false;

    for (var i = 0; i < count; i++) {
      var result = breed(pA, pB);
      var gen = Math.max(pA.generation, pB.generation) + 1;
      var org = createOrganism(result.genome, [pA.id, pB.id], gen);
      org.mutations = result.mutations;
      org.hasMutation = result.hasMutation;
      if (result.hasMutation) newMutationCount += result.mutations.length;

      if (tracker.record(org)) newDiscoveries = true;
      offspring.push(org);
    }

    for (var k = 0; k < offspring.length; k++) store.add(offspring[k]);

    showResults(offspring);
    renderCollection();
    renderJournal();
    updateBreedingUI();
    updateStats();

    if (newDiscoveries) showNotification('New allele discovered! Check the Journal.', 'discovery');
    if (newMutationCount > 0) showNotification('Mutation! A new allele appears!', 'mutation');

    var rares = [];
    var legs  = [];
    for (var m = 0; m < offspring.length; m++) {
      if (offspring[m].rarityLabel === 'Rare') rares.push(offspring[m]);
      if (offspring[m].rarityLabel === 'Legendary') legs.push(offspring[m]);
    }
    if (legs.length) showNotification('Legendary organism discovered!', 'rare');
    else if (rares.length) showNotification('Rare organism discovered!', 'rare');
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

    dom.modalBody.innerHTML = '' +
      '<div class="detail-layout">' +
        '<div class="detail-svg">' + svg + '</div>' +
        '<div class="detail-info">' +
          '<h2 class="detail-name">' + organism.name + '</h2>' +
          '<div class="detail-rarity ' + organism.rarityLabel.toLowerCase() + '">' + organism.rarityLabel + '</div>' +
          '<div class="detail-meta">' +
            '<span>Generation ' + organism.generation + '</span>' +
            '<span>ID: ' + organism.id + '</span>' +
          '</div>' +
          lineageHtml +
          '<div class="detail-traits">' +
            domInfo('color', 'Color') +
            domInfo('pattern', 'Pattern') +
            domInfo('shape', 'Shape') +
          '</div>' +
          '<div class="detail-actions">' +
            '<button class="btn btn-sm set-parent" data-id="' + organism.id + '" data-slot="a">Set as Parent A</button>' +
            '<button class="btn btn-sm set-parent" data-id="' + organism.id + '" data-slot="b">Set as Parent B</button>' +
            '<button class="btn btn-sm btn-delete" data-id="' + organism.id + '">Delete</button>' +
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
