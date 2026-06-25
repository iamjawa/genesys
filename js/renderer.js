/**
 * GENESYS — Renderer
 * ====================
 * Converts an organism into an SVG flower and into DOM cards.
 *
 * Flower anatomy:
 *   • 6 petals arranged in a circle — shape varies by shape gene
 *   • Petal fill colour — determined by colour gene
 *   • Pattern overlay — stripes, dots, or spots from pattern gene
 *   • Centre disc — slightly lighter shade
 *   • Subtle stem
 */

const COLOR_HEX = {
  Red:    '#e74c3c',
  White:  '#e8e8e8',
  Green:  '#2ecc71',
  Blue:   '#3498db',
  Purple: '#9b59b6',
};

function hexShift(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function getHex(trait) { return COLOR_HEX[trait] || '#e74c3c'; }

// ── SVG flower ─────────────────────────────────────────────────────────────

function renderOrganismSVG(organism, size) {
  const { color, pattern, shape } = organism.phenotype;
  const fill   = getHex(color);
  const stroke = hexShift(fill, -40);
  const light  = hexShift(fill, 50);

  const CX = 50, CY = 50, petalDist = 27, petalR = 16, stemH = 18;

  let svg = `<svg viewBox="0 0 100 ${100 + stemH}" width="${size}" height="${Math.round(size * (100 + stemH) / 100)}" xmlns="http://www.w3.org/2000/svg">`;

  // ── Petals ──
  for (let i = 0; i < 6; i++) {
    const deg = i * 60;
    const rad = (deg - 90) * Math.PI / 180;
    const px = CX + Math.cos(rad) * petalDist;
    const py = CY + Math.sin(rad) * petalDist;

    if (shape === 'Round') {
      svg += `<circle cx="${px}" cy="${py}" r="${petalR}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity=".92"/>`;

    } else if (shape === 'Pointed') {
      svg += `<ellipse cx="${px}" cy="${py}" rx="${petalR * 0.45}" ry="${petalR * 0.95}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity=".92" transform="rotate(${deg}, ${px}, ${py})"/>`;

    } else if (shape === 'Heart') {
      const s = petalR * 0.7;
      svg += `<path d="M${px},${py + s * 0.35} C${px + s * 0.85},${py - s * 0.35} ${px + s * 1.15},${py + s * 0.3} ${px},${py + s * 0.9} C${px - s * 1.15},${py + s * 0.3} ${px - s * 0.85},${py - s * 0.35} ${px},${py + s * 0.35}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity=".92"/>`;

    } else if (shape === 'Star') {
      const outer = petalR * 0.85, inner = outer * 0.4;
      let pts = '';
      for (let j = 0; j < 5; j++) {
        const a1 = (j * 72 - 90) * Math.PI / 180;
        const a2 = (j * 72 + 36 - 90) * Math.PI / 180;
        pts += `${px + Math.cos(a1) * outer},${py + Math.sin(a1) * outer} `;
        pts += `${px + Math.cos(a2) * inner},${py + Math.sin(a2) * inner} `;
      }
      svg += `<polygon points="${pts.trim()}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity=".92"/>`;
    }
  }

  // ── Pattern overlay ──
  if (pattern !== 'Solid') {
    const pid = `${organism.id}_${pattern}`;
    let patternSvg = '';
    if (pattern === 'Striped') {
      patternSvg = `<pattern id="${pid}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${stroke}" stroke-width="1.5" opacity=".35"/></pattern>`;
    } else if (pattern === 'Dotted') {
      patternSvg = `<pattern id="${pid}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.5" fill="${stroke}" opacity=".4"/></pattern>`;
    } else if (pattern === 'Spotted') {
      patternSvg = `<pattern id="${pid}" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="4.5" fill="${stroke}" opacity=".35"/></pattern>`;
    }
    if (patternSvg) {
      svg += `<defs>${patternSvg}</defs><circle cx="${CX}" cy="${CY}" r="46" fill="url(#${pid})"/>`;
    }
  }

  // ── Center ──
  svg += `<circle cx="${CX}" cy="${CY}" r="9" fill="${light}" stroke="${stroke}" stroke-width="2"/>`;

  // ── Stem ──
  svg += `<path d="M${CX},${CY + 5} Q${CX - 3},${CY + 30} ${CX},${100 + stemH}" fill="none" stroke="#3d6b4f" stroke-width="3" opacity=".55"/>`;

  svg += `</svg>`;
  return svg;
}

// ── Card ──────────────────────────────────────────────────────────────────

function createOrganismCard(organism, size) {
  const card = document.createElement('div');
  card.className = `organism-card rarity-${organism.rarityLabel.toLowerCase()}`;
  card.dataset.id = organism.id;

  const svg = renderOrganismSVG(organism, size || 80);
  const hex = getHex(organism.phenotype.color);

  card.innerHTML = `
    <div class="card-svg">${svg}</div>
    <div class="card-name">${organism.name}</div>
    <div class="card-traits">
      <span class="trait-dot" style="background:${hex}"></span>
      <span class="trait-label">${organism.phenotype.color}</span>
    </div>
    <div class="card-gen">G${organism.generation}</div>
    <div class="card-rarity ${organism.rarityLabel.toLowerCase()}">${organism.rarityLabel}</div>
  `;
  return card;
}
