/**
 * GENESYS — Application
 * ======================
 * Glues together the genetics engine, organism store, and renderer.
 */

import { expressGene, breed, getAllAllelesForGene } from './genetics.js';
import { OrganismStore, createOrganism } from './organisms.js';
import { renderOrganismSVG, createOrganismCard } from './renderer.js';
import { DiscoveryTracker } from './discovery-tracker.js';

const store = new OrganismStore();
const tracker = new DiscoveryTracker();

// Replay existing organisms into the tracker
for (const org of store.getAll()) {
  tracker.record(org);
}

const $ = (sel) => document.querySelector(sel);

const dom = {};

function init() {
  cacheDOM();
  renderCollection();
  renderJournal();
  updateBreedingUI();
  bindEvents();
  updateStats();
  showNotification('🌱 Welcome to GENESYS! Breed your first two plants.', 'info');
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
  dom.journalBody    = $('#journal-body');
}

function bindEvents() {
  dom.breedBtn.addEventListener('click', handleBreed);
  dom.modalClose.addEventListener('click', closeModal);
  dom.modal.addEventListener('click', (e) => { if (e.target === dom.modal) closeModal(); });
  dom.parentASelect.addEventListener('change', updateBreedingUI);
  dom.parentBSelect.addEventListener('change', updateBreedingUI);
}

// ── Collection ───────────────────────────────────────────────────────

function renderCollection() {
  dom.collection.innerHTML = '';
  const all = store.getAll();
  if (!all.length) {
    dom.collection.innerHTML = '<div class="empty-state">No organisms yet. Start breeding!</div>';
    return;
  }
  const frag = document.createDocumentFragment();
  for (const org of [...all].reverse()) {
    const card = createOrganismCard(org, 80);
    card.addEventListener('click', () => showDetail(org));
    frag.appendChild(card);
  }
  dom.collection.appendChild(frag);
}

// ── Trait Journal ────────────────────────────────────────────────────

function renderJournal() {
  if (!dom.journalBody) return;

  const allAlleles = tracker.getAll();
  const discovered = tracker.getDiscovered();
  const total = allAlleles.total;
  const seen = allAlleles.seen;
  const pct = total > 0 ? Math.round((seen / total) * 100) : 0;

  dom.journalBody.innerHTML = `
    <div class="journal-summary">
      <span class="journal-progress">${seen} / ${total} alleles</span>
      <span class="journal-bar"><span class="journal-fill" style="width:${pct}%"></span></span>
      <span class="journal-pct">${pct}%</span>
    </div>
    <div class="journal-grid">
      ${renderGeneGroup('color',   'Color',   allAlleles, discovered)}
      ${renderGeneGroup('pattern', 'Pattern', allAlleles, discovered)}
      ${renderGeneGroup('shape',   'Shape',   allAlleles, discovered)}
    </div>
  `;
}

function renderGeneGroup(geneType, label, allAlleles, discovered) {
  const gene = allAlleles.genes[geneType];
  if (!gene) return '';
  const entries = gene.map(a => {
    const found = discovered[geneType] && discovered[geneType].has(a.code);
    return `
      <div class="journal-allele ${found ? 'found' : 'hidden'}">
        <span class="journal-allele-code">${a.code}</span>
        <span class="journal-allele-name">${found ? a.trait : '???'}</span>
      </div>`;
  }).join('');
  return `
    <div class="journal-gene">
      <div class="journal-gene-label">${label}</div>
      <div class="journal-alleles">${entries}</div>
    </div>`;
}

// ── Breeding UI ──────────────────────────────────────────────────────

function updatePreview(selectEl, previewEl) {
  const id = selectEl.value;
  const org = id ? store.getById(id) : null;
  previewEl.innerHTML = org ? renderOrganismSVG(org, 46) : '';
  previewEl.classList.toggle('filled', !!org);
}

function updateBreedingUI() {
  const aId = dom.parentASelect.value;

  dom.parentASelect.innerHTML = '<option value="">— Select —</option>';
  for (const org of store.getAll()) {
    const opt = document.createElement('option');
    opt.value = org.id;
    opt.textContent = `${org.name}  (${org.phenotype.color}/${org.phenotype.pattern}/${org.phenotype.shape}) G${org.generation}`;
    dom.parentASelect.appendChild(opt);
  }
  if (aId && store.getById(aId)) dom.parentASelect.value = aId;

  const bId = dom.parentBSelect.value;
  dom.parentBSelect.innerHTML = '<option value="">— Select —</option>';
  for (const org of store.getAll()) {
    if (org.id === dom.parentASelect.value) continue;
    const opt = document.createElement('option');
    opt.value = org.id;
    opt.textContent = `${org.name}  (${org.phenotype.color}/${org.phenotype.pattern}/${org.phenotype.shape}) G${org.generation}`;
    dom.parentBSelect.appendChild(opt);
  }
  if (bId && store.getById(bId) && bId !== dom.parentASelect.value) dom.parentBSelect.value = bId;

  updatePreview(dom.parentASelect, dom.parentAPreview);
  updatePreview(dom.parentBSelect, dom.parentBPreview);
  dom.breedBtn.disabled = !dom.parentASelect.value || !dom.parentBSelect.value;
}

// ── Breeding ─────────────────────────────────────────────────────────

function handleBreed() {
  const pA = store.getById(dom.parentASelect.value);
  const pB = store.getById(dom.parentBSelect.value);
  if (!pA || !pB) return;

  const count = 1 + Math.floor(Math.random() * 3);
  const offspring = [];
  let newMutationCount = 0;
  let newDiscoveries = false;

  for (let i = 0; i < count; i++) {
    const result = breed(pA, pB);
    const gen = Math.max(pA.generation, pB.generation) + 1;
    const org = createOrganism(result.genome, [pA.id, pB.id], gen);
    org.mutations = result.mutations;
    org.hasMutation = result.hasMutation;
    if (result.hasMutation) newMutationCount += result.mutations.length;

    const fresh = tracker.record(org);
    if (fresh) newDiscoveries = true;

    offspring.push(org);
  }

  for (const org of offspring) store.add(org);

  showResults(offspring);
  renderCollection();
  renderJournal();
  updateBreedingUI();
  updateStats();

  if (newDiscoveries) showNotification('📖 New allele discovered! Check the Journal.', 'discovery');
  if (newMutationCount > 0) showNotification('🧬 Mutation! A new allele appears!', 'mutation');
  const rares = offspring.filter(o => o.rarityLabel === 'Rare');
  const legs  = offspring.filter(o => o.rarityLabel === 'Legendary');
  if (legs.length) showNotification('🌟 Legendary organism discovered!', 'rare');
  else if (rares.length) showNotification('✨ Rare organism discovered!', 'rare');
}

function showResults(offspring) {
  dom.results.innerHTML = '';
  const title = document.createElement('h3');
  title.className = 'results-title';
  title.textContent = '🌱 Offspring';
  dom.results.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'offspring-grid';
  for (const org of offspring) {
    const card = createOrganismCard(org, 80);
    card.addEventListener('click', () => showDetail(org));
    if (org.hasMutation) {
      const badge = document.createElement('div');
      badge.className = 'mutation-badge';
      badge.textContent = '🧬';
      card.appendChild(badge);
    }
    grid.appendChild(card);
  }
  dom.results.appendChild(grid);
  dom.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Detail Modal ─────────────────────────────────────────────────────

function showDetail(organism) {
  dom.modalBody.innerHTML = '';
  dom.modal.classList.add('visible');

  const svg = renderOrganismSVG(organism, 130);
  const g = organism.genome;

  const domInfo = (geneType, label) => {
    const all = getAllAllelesForGene(geneType);
    const a1 = all[g[geneType].allele1];
    const a2 = all[g[geneType].allele2];
    const isDom = a1 && a1.dominant || a2 && a2.dominant;
    return `
      <div class="trait-row">
        <span class="trait-label">${label}</span>
        <span class="trait-value">${organism.phenotype[geneType]}</span>
        <span class="trait-genotype ${isDom ? '' : 'recessive'}">${g[geneType].allele1} / ${g[geneType].allele2}</span>
      </div>`;
  };

  const parentInfo = organism.parents.length
    ? organism.parents.map(id => { const p = store.getById(id); return p ? p.name : 'Unknown'; }).join(' × ')
    : 'Wild';

  dom.modalBody.innerHTML = `
    <div class="detail-layout">
      <div class="detail-svg">${svg}</div>
      <div class="detail-info">
        <h2 class="detail-name">${organism.name}</h2>
        <div class="detail-rarity ${organism.rarityLabel.toLowerCase()}">${organism.rarityLabel}</div>
        <div class="detail-meta">
          <span>Generation ${organism.generation}</span>
          <span>ID: ${organism.id}</span>
        </div>
        <div class="detail-parents">
          <span class="parents-label">Parents:</span>
          <span>${parentInfo}</span>
        </div>
        <div class="detail-traits">
          ${domInfo('color', 'Color')}
          ${domInfo('pattern', 'Pattern')}
          ${domInfo('shape', 'Shape')}
        </div>
        <div class="detail-actions">
          <button class="btn btn-sm set-parent" data-id="${organism.id}" data-slot="a">Set as Parent A</button>
          <button class="btn btn-sm set-parent" data-id="${organism.id}" data-slot="b">Set as Parent B</button>
        </div>
      </div>
    </div>
  `;

  dom.modalBody.querySelectorAll('.set-parent').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = btn.dataset.slot;
      const select = slot === 'a' ? dom.parentASelect : dom.parentBSelect;
      select.value = btn.dataset.id;
      select.dispatchEvent(new Event('change'));
      closeModal();
    });
  });
}

function closeModal() { dom.modal.classList.remove('visible'); }

function updateStats() {
  dom.statsCount.textContent = store.getCount();
  dom.statsGen.textContent = store.getMaxGeneration();
  const r = store.getRarest();
  dom.statsRarest.textContent = r ? r.rarityLabel : '—';
}

function showNotification(message, type) {
  const el = document.createElement('div');
  el.className = `notif notif-${type || 'info'}`;
  el.textContent = message;
  dom.notifContainer.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 400);
  }, 4000);
}

document.addEventListener('DOMContentLoaded', init);
