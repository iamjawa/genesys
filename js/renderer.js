/**
 * GENESYS — Renderer
 * Converts an organism into an SVG flower and DOM cards.
 *
 * Shape gene → flower type:
 *   Round   → Rose   (layered round petals)
 *   Pointed → Lily   (long pointed petals + stamens)
 *   Heart   → Tulip  (cup-shaped overlapping petals)
 *   Star    → Daisy  (many thin petals + large disc)
 */

var COLOR_HEX = {
  Red: '#e74c3c', White: '#e8e8e8', Green: '#2ecc71',
  Blue: '#3498db', Purple: '#9b59b6',
};

function hexShift(hex, amount) {
  var n = parseInt(hex.slice(1), 16);
  var r = Math.max(0, Math.min(255, (n >> 16) + amount));
  var g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  var b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function getHex(trait) { return COLOR_HEX[trait] || '#e74c3c'; }

// ── Rose (Round) ─────────────────────────────────────────────────────

function drawRose(fill, stroke, light) {
  var s = '';
  // Outer ring — 6 wider petals
  for (var i = 0; i < 6; i++) {
    var a = (i * 60 - 90) * Math.PI / 180;
    var px = 50 + Math.cos(a) * 26;
    var py = 50 + Math.sin(a) * 26;
    s += '<ellipse cx="' + px + '" cy="' + py + '" rx="14" ry="10" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1" opacity=".85" transform="rotate(' + (i * 60) + ', ' + px + ', ' + py + ')"/>';
  }
  // Inner ring — 5 smaller petals, offset
  for (var j = 0; j < 5; j++) {
    var a2 = (j * 72 - 90) * Math.PI / 180;
    var px2 = 50 + Math.cos(a2) * 14;
    var py2 = 50 + Math.sin(a2) * 14;
    s += '<ellipse cx="' + px2 + '" cy="' + py2 + '" rx="9" ry="7" fill="' + light + '" stroke="' + stroke + '" stroke-width=".8" opacity=".9" transform="rotate(' + (j * 72) + ', ' + px2 + ', ' + py2 + ')"/>';
  }
  // Tight centre
  s += '<circle cx="50" cy="50" r="6" fill="' + hexShift(fill, -60) + '" stroke="' + stroke + '" stroke-width="1"/>';
  return s;
}

// ── Lily (Pointed) ───────────────────────────────────────────────────

function drawLily(fill, stroke, light) {
  var s = '';
  // 6 long pointed petals
  for (var i = 0; i < 6; i++) {
    var deg = i * 60;
    var rad = (deg - 90) * Math.PI / 180;
    var px = 50 + Math.cos(rad) * 18;
    var py = 50 + Math.sin(rad) * 18;
    // Long teardrop shape pointing outward
    var tipX = px + Math.cos(rad) * 22;
    var tipY = py + Math.sin(rad) * 22;
    var cpx = px + Math.cos(rad) * 8;
    var cpy = py + Math.sin(rad) * 8;
    var perpX = Math.cos(rad + Math.PI / 2) * 7;
    var perpY = Math.sin(rad + Math.PI / 2) * 7;
    s += '<path d="M' + tipX + ',' + tipY + ' Q' + (cpx + perpX) + ',' + (cpy + perpY) + ' ' + (px + perpX * 1.5) + ',' + (py + perpY * 1.5) + ' Q' + (50 + perpX * 0.5) + ',' + (50 + perpY * 0.5) + ' 50,50 Q' + (50 - perpX * 0.5) + ',' + (50 - perpY * 0.5) + ' ' + (px - perpX * 1.5) + ',' + (py - perpY * 1.5) + ' Q' + (cpx - perpX) + ',' + (cpy - perpY) + ' ' + tipX + ',' + tipY + 'Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1" opacity=".9"/>';
    // Central vein line
    s += '<line x1="50" y1="50" x2="' + (50 + Math.cos(rad) * 36) + '" y2="' + (50 + Math.sin(rad) * 36) + '" stroke="' + hexShift(fill, -30) + '" stroke-width=".6" opacity=".3"/>';
  }
  // Stamens
  for (var k = 0; k < 4; k++) {
    var a3 = (k * 90 + 20) * Math.PI / 180;
    var sx = 50 + Math.cos(a3) * 14;
    var sy = 50 + Math.sin(a3) * 14;
    s += '<line x1="50" y1="50" x2="' + sx + '" y2="' + sy + '" stroke="#5a3a1a" stroke-width="1.5" opacity=".5"/>';
    s += '<circle cx="' + sx + '" cy="' + sy + '" r="2" fill="#d4a017" opacity=".7"/>';
  }
  return s;
}

// ── Tulip (Heart) ────────────────────────────────────────────────────

function drawTulip(fill, stroke, light) {
  var s = '';
  // 3 outer petals (wider)
  for (var i = 0; i < 3; i++) {
    var deg = i * 120 - 90;
    var rad = deg * Math.PI / 180;
    var px = 50 + Math.cos(rad) * 12;
    var py = 50 + Math.sin(rad) * 12;
    var tipX = 50 + Math.cos(rad) * 34;
    var tipY = 50 + Math.sin(rad) * 34;
    var midX = 50 + Math.cos(rad) * 18;
    var midY = 50 + Math.sin(rad) * 18;
    var perpX = Math.cos(rad + Math.PI / 2) * 12;
    var perpY = Math.sin(rad + Math.PI / 2) * 12;
    s += '<path d="M' + tipX + ',' + tipY + ' Q' + (midX + perpX * 0.7) + ',' + (midY + perpY * 0.7) + ' ' + (50 + perpX) + ',' + (50 + perpY) + ' Q' + (midX - perpX * 0.7) + ',' + (midY - perpY * 0.7) + ' ' + tipX + ',' + tipY + 'Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1" opacity=".85"/>';
  }
  // 3 inner petals (narrower, slightly different angle)
  for (var j = 0; j < 3; j++) {
    var deg2 = j * 120 - 90 + 45;
    var rad2 = deg2 * Math.PI / 180;
    var tipX2 = 50 + Math.cos(rad2) * 30;
    var tipY2 = 50 + Math.sin(rad2) * 30;
    var midX2 = 50 + Math.cos(rad2) * 16;
    var midY2 = 50 + Math.sin(rad2) * 16;
    var perpX2 = Math.cos(rad2 + Math.PI / 2) * 7;
    var perpY2 = Math.sin(rad2 + Math.PI / 2) * 7;
    s += '<path d="M' + tipX2 + ',' + tipY2 + ' Q' + (midX2 + perpX2 * 0.5) + ',' + (midY2 + perpY2 * 0.5) + ' 50,50 Q' + (midX2 - perpX2 * 0.5) + ',' + (midY2 - perpY2 * 0.5) + ' ' + tipX2 + ',' + tipY2 + 'Z" fill="' + light + '" stroke="' + stroke + '" stroke-width=".8" opacity=".9"/>';
  }
  return s;
}

// ── Daisy (Star) ─────────────────────────────────────────────────────

function drawDaisy(fill, stroke, light) {
  var s = '';
  // 13 thin petals
  for (var i = 0; i < 13; i++) {
    var deg = i * 27.7;
    var rad = (deg - 90) * Math.PI / 180;
    var px = 50 + Math.cos(rad) * 14;
    var py = 50 + Math.sin(rad) * 14;
    var tipX = px + Math.cos(rad) * 18;
    var tipY = py + Math.sin(rad) * 18;
    var perpX = Math.cos(rad + Math.PI / 2) * 4;
    var perpY = Math.sin(rad + Math.PI / 2) * 4;
    s += '<path d="M' + tipX + ',' + tipY + ' Q' + (px + perpX) + ',' + (py + perpY) + ' 50,50 Q' + (px - perpX) + ',' + (py - perpY) + ' ' + tipX + ',' + tipY + 'Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width=".6" opacity=".85"/>';
  }
  // Large prominent disc centre
  s += '<circle cx="50" cy="50" r="14" fill="' + hexShift(fill, -50) + '" stroke="' + hexShift(fill, -70) + '" stroke-width="1.5"/>';
  // Disc texture dots
  for (var k = 0; k < 8; k++) {
    var a3 = k * 45 * Math.PI / 180;
    s += '<circle cx="' + (50 + Math.cos(a3) * 8) + '" cy="' + (50 + Math.sin(a3) * 8) + '" r="1.5" fill="' + hexShift(fill, -30) + '" opacity=".4"/>';
  }
  return s;
}

// ── Main render ──────────────────────────────────────────────────────

function renderOrganismSVG(organism, size) {
  var color   = organism.phenotype.color;
  var pattern = organism.phenotype.pattern;
  var shape   = organism.phenotype.shape;
  var fill   = getHex(color);
  var stroke = hexShift(fill, -40);
  var light  = hexShift(fill, 50);
  var stemH = 18;

  var svg = '<svg viewBox="0 0 100 ' + (100 + stemH) + '" width="' + size + '" height="' + Math.round(size * (100 + stemH) / 100) + '" xmlns="http://www.w3.org/2000/svg">';

  // Draw petals based on shape
  if (shape === 'Round')       svg += drawRose(fill, stroke, light);
  else if (shape === 'Pointed') svg += drawLily(fill, stroke, light);
  else if (shape === 'Heart')   svg += drawTulip(fill, stroke, light);
  else if (shape === 'Star')    svg += drawDaisy(fill, stroke, light);

  // Pattern overlay
  if (pattern !== 'Solid') {
    var pid = organism.id + '_' + pattern;
    var def = '';
    if (pattern === 'Striped') {
      def = '<pattern id="' + pid + '" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="' + stroke + '" stroke-width="2" opacity=".3"/></pattern>';
    } else if (pattern === 'Dotted') {
      def = '<pattern id="' + pid + '" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="2.5" fill="' + stroke + '" opacity=".35"/></pattern>';
    } else if (pattern === 'Spotted') {
      def = '<pattern id="' + pid + '" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="5" fill="' + stroke + '" opacity=".3"/></pattern>';
    }
    if (def) svg += '<defs>' + def + '</defs><circle cx="50" cy="50" r="48" fill="url(#' + pid + ')" opacity=".8"/>';
  }

  // Stem
  svg += '<path d="M50,55 Q47,75 50,' + (100 + stemH) + '" fill="none" stroke="#3d6b4f" stroke-width="3" opacity=".5"/>';

  // Small leaf
  svg += '<path d="M50,65 Q60,60 65,68 Q58,72 50,65Z" fill="#4a7c59" opacity=".4"/>';

  svg += '</svg>';
  return svg;
}

function createOrganismCard(organism, size) {
  var card = document.createElement('div');
  card.className = 'organism-card rarity-' + organism.rarityLabel.toLowerCase();
  card.dataset.id = organism.id;

  var svg = renderOrganismSVG(organism, size || 80);
  var hex = getHex(organism.phenotype.color);

  var scent = expressScent(organism);
  var scentEmoji = { Sweet:'🌸', Spicy:'🌶', Fresh:'🌿', Earthy:'🌱', Exotic:'✨' };
  var emoji = scentEmoji[scent] || '🌸';

  card.innerHTML = '' +
    '<div class="card-svg">' + svg + '</div>' +
    '<div class="card-name">' + organism.name + '</div>' +
    '<div class="card-traits">' +
      '<span class="trait-dot" style="background:' + hex + '"></span>' +
      '<span class="trait-label">' + organism.phenotype.color + '</span>' +
      '<span class="trait-scent" title="' + scent + '">' + emoji + '</span>' +
    '</div>' +
    '<div class="card-gen">G' + organism.generation + '</div>' +
    '<div class="card-rarity ' + organism.rarityLabel.toLowerCase() + '">' + organism.rarityLabel + '</div>';
  return card;
}
