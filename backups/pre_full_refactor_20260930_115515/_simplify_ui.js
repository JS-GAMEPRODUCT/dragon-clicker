const fs = require("fs");
const path = "C:/Users/Utilisateur/Desktop/mm/index.html";
let html = fs.readFileSync(path, "utf8");
const crlf = html.includes("\r\n");
html = html.replace(/\r\n/g, "\n");

function mustReplace(label, from, to) {
  if (!html.includes(from)) {
    console.error("NOT FOUND:", label);
    process.exit(1);
  }
  html = html.replace(from, to);
}

function replaceBetween(label, start, end, content) {
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a < 0 || b < 0 || b <= a) {
    console.error("RANGE NOT FOUND:", label, a, b);
    process.exit(1);
  }
  html = html.slice(0, a) + content + html.slice(b);
}

// ========== CSS: overlay panels as simple sheets ==========
mustReplace(
  "overlay panel css",
  `    .panel.overlay-panel.active {
      display: block;
      position: absolute;
      inset: 0;
      z-index: 25;
      background: rgba(8, 10, 14, 0.84);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: none;
      border-radius: 0;
      box-shadow: none;
      padding: 18px 16px;
    }`,
  `    .panel.overlay-panel.active {
      display: flex;
      flex-direction: column;
      position: absolute;
      inset: 0;
      z-index: 25;
      background: rgba(6, 10, 16, 0.88);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: none;
      border-radius: 0;
      box-shadow: none;
      padding: 0;
      overflow: hidden;
    }

    .panel-sheet-head {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(212, 168, 75, 0.28);
      background: linear-gradient(180deg, rgba(12, 18, 28, 0.95), rgba(8, 12, 20, 0.9));
    }

    .panel-sheet-head .panel-title {
      margin: 0;
      padding: 0;
      border: none;
      font-size: 1.05rem;
      letter-spacing: 0.1em;
    }

    .panel-close {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: 1px solid rgba(212, 168, 75, 0.35);
      background: rgba(0, 0, 0, 0.35);
      color: var(--gold-bright);
      font-size: 1.25rem;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .panel-close:hover {
      background: rgba(212, 168, 75, 0.15);
    }

    .panel-sheet-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 12px 18px;
      -webkit-overflow-scrolling: touch;
    }

    .panel-hint {
      text-align: center;
      color: var(--text-dim);
      font-size: 0.78rem;
      margin: 0 0 12px;
      opacity: 0.85;
    }`
);

mustReplace(
  "panel-title css",
  `    .panel-title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      color: var(--gold);
      letter-spacing: 0.08em;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }`,
  `    .panel-title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      color: var(--gold);
      letter-spacing: 0.08em;
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }`
);

// ========== CSS: simpler mobile cards ==========
mustReplace(
  "card css",
  `    .card {
      display: grid;
      grid-template-columns: 48px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 14px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      transition: border-color 0.2s, background 0.2s, transform 0.15s;
    }

    .card:hover:not(.disabled):not(.owned) {
      background: var(--bg-card-hover);
      border-color: var(--border-strong);
    }

    .card.disabled {
      opacity: 0.48;
      filter: grayscale(0.3);
    }

    .card.owned {
      border-color: rgba(76, 175, 122, 0.4);
      background: rgba(20, 40, 28, 0.5);
    }

    .card.unlocked {
      border-color: rgba(212, 168, 75, 0.5);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--border);
    }

    .card-info { min-width: 0; }

    .card-name {
      font-family: var(--font-display);
      font-size: 0.95rem;
      color: var(--gold-bright);
      margin-bottom: 2px;
    }

    .card-desc {
      font-size: 0.78rem;
      color: var(--text-dim);
      line-height: 1.35;
    }

    .card-meta {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 4px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .card-action { text-align: right; }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid var(--border-strong);
      background: linear-gradient(180deg, #5a2a12 0%, #3a1608 100%);
      color: var(--gold-bright);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,200,100,0.15);
      transition: transform 0.1s, filter 0.15s, opacity 0.15s;
      white-space: nowrap;
      min-height: 42px;
      min-width: 90px;
    }`,
  `    .card-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 560px;
      margin: 0 auto;
    }

    .card {
      display: grid;
      grid-template-columns: 44px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      background: linear-gradient(165deg, rgba(16, 22, 34, 0.92), rgba(8, 12, 18, 0.9));
      border: 1px solid rgba(212, 168, 75, 0.28);
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
      transition: border-color 0.15s, background 0.15s, transform 0.12s;
    }

    .card:hover:not(.disabled):not(.owned) {
      background: rgba(24, 32, 48, 0.95);
      border-color: rgba(212, 168, 75, 0.5);
    }

    .card.disabled {
      opacity: 0.55;
      filter: grayscale(0.2);
    }

    .card.owned {
      border-color: rgba(76, 175, 122, 0.45);
      background: rgba(16, 36, 28, 0.55);
    }

    .card.unlocked {
      border-color: rgba(212, 168, 75, 0.55);
    }

    .card-icon {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.45rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(212, 168, 75, 0.22);
    }

    .card-info { min-width: 0; }

    .card-name {
      font-family: var(--font-display);
      font-size: 0.9rem;
      color: var(--gold-bright);
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-desc {
      font-size: 0.74rem;
      color: var(--text-dim);
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-meta {
      font-size: 0.7rem;
      color: rgba(180, 165, 140, 0.85);
      margin-top: 2px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .card-action {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 700;
      border: 1px solid var(--border-strong);
      background: linear-gradient(180deg, #6a3214 0%, #3a1608 100%);
      color: var(--gold-bright);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,200,100,0.15);
      transition: transform 0.1s, filter 0.15s, opacity 0.15s;
      white-space: nowrap;
      min-height: 40px;
      min-width: 84px;
    }`
);

// Fix duplicate .card-list if exists earlier
if ((html.match(/\.card-list \{/g) || []).length > 1) {
  // leave both - second might conflict; check
  console.log("note: multiple .card-list rules");
}

mustReplace(
  "shop-section-title",
  `    .shop-section-title {
      font-family: var(--font-display);
      color: var(--gold);
      font-size: 0.92rem;
      letter-spacing: 0.06em;
      margin: 18px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border);
    }
    .shop-section-title:first-child { margin-top: 0; }`,
  `    .shop-section-title {
      font-family: var(--font-display);
      color: rgba(240, 208, 120, 0.85);
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin: 14px 0 8px;
      padding: 0;
      border-bottom: none;
    }
    .shop-section-title:first-child { margin-top: 0; }`
);

// Dragon grid denser
mustReplace(
  "dragon grid",
  `    .collection-header {
      text-align: center;
      margin-bottom: 16px;
      font-family: var(--font-display);
      color: var(--gold);
      font-size: 1rem;
    }
    .dragon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 12px;
      max-width: 780px;
      margin: 0 auto;
    }
    .dragon-card {
      padding: 14px 12px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      text-align: center;
      min-height: 220px;
    }`,
  `    .collection-header {
      text-align: center;
      margin-bottom: 10px;
      font-family: var(--font-display);
      color: var(--gold);
      font-size: 0.85rem;
      letter-spacing: 0.06em;
    }
    .dragon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
      gap: 8px;
      max-width: 720px;
      margin: 0 auto;
    }
    .dragon-card {
      padding: 10px 8px;
      background: linear-gradient(165deg, rgba(16, 22, 34, 0.92), rgba(8, 12, 18, 0.9));
      border: 1px solid rgba(212, 168, 75, 0.28);
      border-radius: 14px;
      text-align: center;
      min-height: 0;
    }`
);

mustReplace(
  "dragon art size",
  `    .dragon-card .dc-art {
      width: 140px;
      height: 140px;
      margin: 0 auto 10px;
      border-radius: 12px;`,
  `    .dragon-card .dc-art {
      width: 96px;
      height: 96px;
      margin: 0 auto 6px;
      border-radius: 12px;`
);

mustReplace(
  "dc-bonus date hide-ish",
  `    .dragon-card .dc-bonus {
      margin-top: 8px;
      font-size: 0.72rem;
      color: var(--success);
    }
    .dragon-card .dc-date {
      margin-top: 6px;
      font-size: 0.65rem;
      color: var(--text-muted);
    }`,
  `    .dragon-card .dc-bonus {
      margin-top: 4px;
      font-size: 0.68rem;
      color: var(--success);
    }
    .dragon-card .dc-date {
      display: none;
    }`
);

// Stats denser
mustReplace(
  "stats grid",
  `    .stats-grid {
      display: grid;
      gap: 8px;
      max-width: 520px;
      margin: 0 auto;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
    }`,
  `    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      max-width: 560px;
      margin: 0 auto;
    }

    @media (max-width: 520px) {
      .stats-grid { grid-template-columns: 1fr; }
    }

    .stat-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 12px;
      background: linear-gradient(165deg, rgba(16, 22, 34, 0.92), rgba(8, 12, 18, 0.9));
      border: 1px solid rgba(212, 168, 75, 0.25);
      border-radius: 12px;
    }`
);

// Settings simpler
mustReplace(
  "settings block",
  `    .settings-block {
      max-width: 480px;
      margin: 0 auto 20px;
      padding: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }`,
  `    .settings-block {
      max-width: 480px;
      margin: 0 auto 12px;
      padding: 12px;
      background: linear-gradient(165deg, rgba(16, 22, 34, 0.92), rgba(8, 12, 18, 0.9));
      border: 1px solid rgba(212, 168, 75, 0.28);
      border-radius: 14px;
    }`
);

// ========== CSS: More sheet + simplified nav ==========
mustReplace(
  "nav block end insert more",
  `    .nav-btn:hover .nav-ico {
      filter: none;
    }

    /* ---------- Notifications ---------- */`,
  `    .nav-btn:hover .nav-ico {
      filter: none;
    }

    .nav-btn[data-nav="more"].open {
      color: var(--gold-bright);
      background: linear-gradient(180deg, rgba(212, 168, 75, 0.2) 0%, rgba(212, 168, 75, 0.08) 100%);
      border-color: rgba(212, 168, 75, 0.4);
    }

    .more-sheet {
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: calc(var(--nav-h, 64px) + 8px);
      z-index: 45;
      display: none;
      flex-direction: column;
      gap: 6px;
      padding: 10px;
      border-radius: 16px;
      border: 1px solid rgba(212, 168, 75, 0.35);
      background: linear-gradient(180deg, rgba(12, 18, 28, 0.96), rgba(6, 10, 16, 0.98));
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
      max-width: 420px;
      margin: 0 auto;
    }

    .more-sheet.open { display: flex; }

    .more-sheet-title {
      font-family: var(--font-display);
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(240, 208, 120, 0.75);
      text-align: center;
      margin-bottom: 2px;
    }

    .more-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .more-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 12px 6px;
      min-height: 72px;
      border-radius: 12px;
      border: 1px solid rgba(212, 168, 75, 0.28);
      background: rgba(0, 0, 0, 0.28);
      color: #f0e4c8;
      font-family: var(--font-display);
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .more-btn .more-ico { font-size: 1.35rem; line-height: 1; }
    .more-btn:hover,
    .more-btn.active {
      border-color: rgba(240, 208, 120, 0.55);
      background: rgba(212, 168, 75, 0.12);
      color: var(--gold-bright);
    }

    /* ---------- Notifications ---------- */`
);

// Fix media query that forces nav-btn row on desktop - keep column for mobile feel
mustReplace(
  "desktop nav row",
  `      .nav-btn {
        flex-direction: row;
        gap: 8px;
        padding: 10px 8px;
        font-size: 0.78rem;
      }

      .nav-btn .nav-label { font-size: 0.75rem; }`,
  `      .nav-btn {
        flex-direction: column;
        gap: 3px;
        padding: 8px 6px;
        font-size: 0.68rem;
      }

      .nav-btn .nav-label { font-size: 0.68rem; }`
);

// ========== HTML: panels with sheet headers ==========
mustReplace(
  "panel eggs html",
  `      <section id="panel-eggs" class="panel overlay-panel" data-panel="eggs">
        <h2 class="panel-title">🥚 Œufs</h2>
        <p id="eggs-zone-note" style="text-align:center;color:var(--text-dim);font-size:0.85rem;margin-bottom:14px">Zone actuelle : Sanctuaire ancien</p>
        <div class="egg-picker" id="egg-picker">
          <div class="egg-picker-row" id="egg-picker-row"></div>
        </div>
      </section>`,
  `      <section id="panel-eggs" class="panel overlay-panel" data-panel="eggs">
        <div class="panel-sheet-head">
          <h2 class="panel-title">🥚 Œufs</h2>
          <button type="button" class="panel-close" data-close-panel aria-label="Fermer">✕</button>
        </div>
        <div class="panel-sheet-body">
          <p class="panel-hint" id="eggs-zone-note">Sanctuaire ancien</p>
          <div class="egg-picker" id="egg-picker">
            <div class="egg-picker-row" id="egg-picker-row"></div>
          </div>
        </div>
      </section>`
);

mustReplace(
  "panel zones html",
  `      <section id="panel-zones" class="panel overlay-panel" data-panel="zones">
        <h2 class="panel-title">🗺️ Zones</h2>
        <p style="text-align:center;color:var(--text-dim);font-size:0.85rem;margin-bottom:14px">Les zones sont de grands paliers de progression. Les anciennes restent accessibles.</p>
        <div class="zones-list" id="zones-list"></div>
      </section>`,
  `      <section id="panel-zones" class="panel overlay-panel" data-panel="zones">
        <div class="panel-sheet-head">
          <h2 class="panel-title">🗺️ Zones</h2>
          <button type="button" class="panel-close" data-close-panel aria-label="Fermer">✕</button>
        </div>
        <div class="panel-sheet-body">
          <div class="zones-list" id="zones-list"></div>
        </div>
      </section>`
);

mustReplace(
  "panel dragons html",
  `      <section id="panel-dragons" class="panel overlay-panel" data-panel="dragons">
        <h2 class="panel-title">🐉 BESTIAIRE</h2>
        <div class="collection-header" id="dragons-count">Dragons découverts : 0 / 0</div>
        <div class="dragon-grid" id="dragons-grid"></div>
      </section>`,
  `      <section id="panel-dragons" class="panel overlay-panel" data-panel="dragons">
        <div class="panel-sheet-head">
          <h2 class="panel-title">🐉 Dragons</h2>
          <button type="button" class="panel-close" data-close-panel aria-label="Fermer">✕</button>
        </div>
        <div class="panel-sheet-body">
          <div class="collection-header" id="dragons-count">0 / 0</div>
          <div class="dragon-grid" id="dragons-grid"></div>
        </div>
      </section>`
);

mustReplace(
  "panel shop html",
  `      <section id="panel-shop" class="panel overlay-panel" data-panel="shop">
        <h2 class="panel-title">🛒 Boutique</h2>
        <p style="text-align:center;color:var(--text-dim);font-size:0.82rem;margin-bottom:12px">Producteurs passifs et accès de progression.</p>
        <div class="card-list" id="shop-list"></div>
      </section>`,
  `      <section id="panel-shop" class="panel overlay-panel" data-panel="shop">
        <div class="panel-sheet-head">
          <h2 class="panel-title">🛒 Boutique</h2>
          <button type="button" class="panel-close" data-close-panel aria-label="Fermer">✕</button>
        </div>
        <div class="panel-sheet-body">
          <div class="card-list" id="shop-list"></div>
        </div>
      </section>`
);

mustReplace(
  "panel upgrades html",
  `      <section id="panel-upgrades" class="panel overlay-panel" data-panel="upgrades">
        <h2 class="panel-title">⭐ Améliorations</h2>
        <p style="text-align:center;color:var(--text-dim);font-size:0.82rem;margin-bottom:12px">Optimisez le clic, les critiques et les systèmes actifs.</p>
        <div class="card-list" id="upgrades-list"></div>
      </section>`,
  `      <section id="panel-upgrades" class="panel overlay-panel" data-panel="upgrades">
        <div class="panel-sheet-head">
          <h2 class="panel-title">⭐ Améliorations</h2>
          <button type="button" class="panel-close" data-close-panel aria-label="Fermer">✕</button>
        </div>
        <div class="panel-sheet-body">
          <div class="card-list" id="upgrades-list"></div>
        </div>
      </section>`
);

mustReplace(
  "panel achievements html",
  `      <section id="panel-achievements" class="panel overlay-panel" data-panel="achievements">
        <h2 class="panel-title">🏆 Succès</h2>
        <div class="card-list" id="achievements-list"></div>
      </section>`,
  `      <section id="panel-achievements" class="panel overlay-panel" data-panel="achievements">
        <div class="panel-sheet-head">
          <h2 class="panel-title">🏆 Succès</h2>
          <button type="button" class="panel-close" data-close-panel aria-label="Fermer">✕</button>
        </div>
        <div class="panel-sheet-body">
          <div class="card-list" id="achievements-list"></div>
        </div>
      </section>`
);

mustReplace(
  "panel stats html",
  `      <section id="panel-stats" class="panel overlay-panel" data-panel="stats">
        <h2 class="panel-title">📊 Statistiques</h2>
        <div class="stats-grid" id="stats-grid"></div>
      </section>`,
  `      <section id="panel-stats" class="panel overlay-panel" data-panel="stats">
        <div class="panel-sheet-head">
          <h2 class="panel-title">📊 Stats</h2>
          <button type="button" class="panel-close" data-close-panel aria-label="Fermer">✕</button>
        </div>
        <div class="panel-sheet-body">
          <div class="stats-grid" id="stats-grid"></div>
        </div>
      </section>`
);

mustReplace(
  "panel settings html",
  `      <section id="panel-settings" class="panel overlay-panel" data-panel="settings">
        <h2 class="panel-title">⚙️ Paramètres</h2>

        <div class="settings-block">
          <h3>Audio</h3>
          <div class="toggle-row">
            <span>🔊 Sons</span>
            <button type="button" class="toggle" id="toggle-sfx" aria-pressed="true" title="Sons"></button>
          </div>
          <div class="toggle-row">
            <span>🎵 Musique</span>
            <button type="button" class="toggle" id="toggle-music" aria-pressed="true" title="Musique"></button>
          </div>
        </div>

        <div class="settings-block">
          <h3>Sauvegarde</h3>
          <div class="settings-actions">
            <button type="button" class="btn" id="btn-save">💾 Sauvegarder</button>
            <button type="button" class="btn btn-secondary" id="btn-export">📤 Exporter sauvegarde</button>
            <button type="button" class="btn btn-secondary" id="btn-import">📥 Importer sauvegarde</button>
            <textarea class="import-area" id="import-area" placeholder="Collez ici votre sauvegarde exportée…" spellcheck="false"></textarea>
            <button type="button" class="btn btn-danger" id="btn-reset">🗑️ Réinitialiser partie</button>
          </div>
        </div>
      </section>`,
  `      <section id="panel-settings" class="panel overlay-panel" data-panel="settings">
        <div class="panel-sheet-head">
          <h2 class="panel-title">⚙️ Réglages</h2>
          <button type="button" class="panel-close" data-close-panel aria-label="Fermer">✕</button>
        </div>
        <div class="panel-sheet-body">
          <div class="settings-block">
            <h3>Audio</h3>
            <div class="toggle-row">
              <span>Sons</span>
              <button type="button" class="toggle" id="toggle-sfx" aria-pressed="true" title="Sons"></button>
            </div>
            <div class="toggle-row">
              <span>Musique</span>
              <button type="button" class="toggle" id="toggle-music" aria-pressed="true" title="Musique"></button>
            </div>
          </div>

          <div class="settings-block">
            <h3>Sauvegarde</h3>
            <div class="settings-actions">
              <button type="button" class="btn" id="btn-save">Sauvegarder</button>
              <button type="button" class="btn btn-secondary" id="btn-export">Exporter</button>
              <button type="button" class="btn btn-secondary" id="btn-import">Importer</button>
              <textarea class="import-area" id="import-area" placeholder="Collez la sauvegarde…" spellcheck="false"></textarea>
              <button type="button" class="btn btn-danger" id="btn-reset">Réinitialiser</button>
            </div>
          </div>
        </div>
      </section>`
);

// ========== HTML: simplified nav + more sheet ==========
mustReplace(
  "main nav html",
  `    <nav class="nav" id="main-nav" aria-label="Navigation principale">
      <button type="button" class="nav-btn active" data-nav="kingdom">
        <span class="nav-ico">🐉</span><span class="nav-label">Royaume</span>
      </button>
      <button type="button" class="nav-btn" data-nav="dragons">
        <span class="nav-ico">🐲</span><span class="nav-label">Dragons</span>
      </button>
      <button type="button" class="nav-btn" data-nav="eggs">
        <span class="nav-ico">🥚</span><span class="nav-label">Œufs</span>
      </button>
      <button type="button" class="nav-btn" data-nav="zones">
        <span class="nav-ico">🗺️</span><span class="nav-label">Zones</span>
      </button>
      <button type="button" class="nav-btn" data-nav="shop">
        <span class="nav-ico">🛒</span><span class="nav-label">Boutique</span>
      </button>
      <button type="button" class="nav-btn" data-nav="upgrades">
        <span class="nav-ico">⭐</span><span class="nav-label">Amélio.</span>
      </button>
      <button type="button" class="nav-btn" data-nav="achievements">
        <span class="nav-ico">🏆</span><span class="nav-label">Succès</span>
      </button>
      <button type="button" class="nav-btn" data-nav="stats">
        <span class="nav-ico">📊</span><span class="nav-label">Stats</span>
      </button>
      <button type="button" class="nav-btn" data-nav="settings">
        <span class="nav-ico">⚙️</span><span class="nav-label">Réglages</span>
      </button>
    </nav>`,
  `    <div class="more-sheet" id="more-sheet" hidden>
      <div class="more-sheet-title">Menu</div>
      <div class="more-grid">
        <button type="button" class="more-btn" data-nav="eggs">
          <span class="more-ico">🥚</span><span>Œufs</span>
        </button>
        <button type="button" class="more-btn" data-nav="zones">
          <span class="more-ico">🗺️</span><span>Zones</span>
        </button>
        <button type="button" class="more-btn" data-nav="achievements">
          <span class="more-ico">🏆</span><span>Succès</span>
        </button>
        <button type="button" class="more-btn" data-nav="stats">
          <span class="more-ico">📊</span><span>Stats</span>
        </button>
        <button type="button" class="more-btn" data-nav="settings">
          <span class="more-ico">⚙️</span><span>Réglages</span>
        </button>
      </div>
    </div>

    <nav class="nav" id="main-nav" aria-label="Navigation principale">
      <button type="button" class="nav-btn active" data-nav="kingdom">
        <span class="nav-ico">🐉</span><span class="nav-label">Royaume</span>
      </button>
      <button type="button" class="nav-btn" data-nav="dragons">
        <span class="nav-ico">🐲</span><span class="nav-label">Dragons</span>
      </button>
      <button type="button" class="nav-btn" data-nav="shop">
        <span class="nav-ico">🛒</span><span class="nav-label">Boutique</span>
      </button>
      <button type="button" class="nav-btn" data-nav="upgrades">
        <span class="nav-ico">⭐</span><span class="nav-label">Amélio.</span>
      </button>
      <button type="button" class="nav-btn" data-nav="more" id="nav-more">
        <span class="nav-ico">☰</span><span class="nav-label">Plus</span>
      </button>
    </nav>`
);

// ========== JS: switchPanel + more menu + close + simpler texts ==========
mustReplace(
  "switchPanel",
  `    function switchPanel(name) {
      document.querySelectorAll(".panel").forEach((p) => {
        const id = p.dataset.panel;
        if (id === "kingdom") {
          /* Sanctuary always visible under overlays */
          p.classList.add("active");
          p.classList.toggle("dimmed", name !== "kingdom");
          return;
        }
        p.classList.toggle("active", id === name);
      });
      document.querySelectorAll(".nav-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.nav === name);
      });
      uiDirty = true;
      if (name === "shop") shopDirty = true;
      if (name === "upgrades") upgradesDirty = true;
      if (name === "achievements") achievementsDirty = true;
      if (name === "dragons") dragonsDirty = true;
      if (name === "eggs") eggsDirty = true;
      if (name === "zones") zonesDirty = true;
      renderUI();
    }`,
  `    const PRIMARY_NAV = new Set(["kingdom", "dragons", "shop", "upgrades"]);
    const MORE_NAV = new Set(["eggs", "zones", "achievements", "stats", "settings"]);

    function closeMoreSheet() {
      const sheet = document.getElementById("more-sheet");
      const moreBtn = document.getElementById("nav-more");
      if (sheet) {
        sheet.classList.remove("open");
        sheet.hidden = true;
      }
      if (moreBtn) moreBtn.classList.remove("open");
    }

    function toggleMoreSheet() {
      const sheet = document.getElementById("more-sheet");
      const moreBtn = document.getElementById("nav-more");
      if (!sheet) return;
      const opening = !sheet.classList.contains("open");
      sheet.classList.toggle("open", opening);
      sheet.hidden = !opening;
      if (moreBtn) moreBtn.classList.toggle("open", opening);
    }

    function switchPanel(name) {
      if (name === "more") {
        toggleMoreSheet();
        return;
      }
      closeMoreSheet();
      document.querySelectorAll(".panel").forEach((p) => {
        const id = p.dataset.panel;
        if (id === "kingdom") {
          p.classList.add("active");
          p.classList.toggle("dimmed", name !== "kingdom");
          return;
        }
        p.classList.toggle("active", id === name);
      });
      document.querySelectorAll(".nav-btn").forEach((b) => {
        const nav = b.dataset.nav;
        if (nav === "more") {
          b.classList.toggle("active", MORE_NAV.has(name));
        } else {
          b.classList.toggle("active", nav === name);
        }
      });
      document.querySelectorAll(".more-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.nav === name);
      });
      uiDirty = true;
      if (name === "shop") shopDirty = true;
      if (name === "upgrades") upgradesDirty = true;
      if (name === "achievements") achievementsDirty = true;
      if (name === "dragons") dragonsDirty = true;
      if (name === "eggs") eggsDirty = true;
      if (name === "zones") zonesDirty = true;
      renderUI();
    }`
);

mustReplace(
  "bind nav events",
  `      document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.addEventListener("click", () => switchPanel(btn.dataset.nav));
      });`,
  `      document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.addEventListener("click", () => switchPanel(btn.dataset.nav));
      });
      document.querySelectorAll(".more-btn").forEach((btn) => {
        btn.addEventListener("click", () => switchPanel(btn.dataset.nav));
      });
      document.querySelectorAll("[data-close-panel]").forEach((btn) => {
        btn.addEventListener("click", () => switchPanel("kingdom"));
      });`
);

// Simpler shop texts
mustReplace(
  "shop section titles text",
  `      prodTitle.textContent = "⚙️ Producteurs — économie passive";`,
  `      prodTitle.textContent = "Producteurs";`
);

mustReplace(
  "shop meta text",
  `        card.querySelector(".card-meta").textContent =
          "Indiv. : +" + formatNumber(unitProd) + "/sec · Total : +" + formatNumber(totalProd) + "/sec";
        card.querySelector(".qty-badge").textContent = "Possédés : " + owned;`,
  `        card.querySelector(".card-meta").textContent =
          "+" + formatNumber(totalProd) + "/sec";
        card.querySelector(".qty-badge").textContent = "×" + owned;`
);

mustReplace(
  "shop prog title",
  `      progTitle.textContent = "🗺️ Progression — accès aux zones";`,
  `      progTitle.textContent = "Zones";`
);

mustReplace(
  "zone key name",
  `        card.querySelector(".card-name").textContent = "Clé — " + zone.name;
        card.querySelector(".card-desc").textContent = unlocked
          ? "Zone déjà débloquée. Achat unique."
          : (zone.description || "Débloque une nouvelle zone.");`,
  `        card.querySelector(".card-name").textContent = zone.name;
        card.querySelector(".card-desc").textContent = unlocked
          ? "Débloquée"
          : "Débloquer la zone";`
);

// Simpler dragons count text - find where it's set
mustReplace(
  "shop owned badge zone",
  `          action.innerHTML = '<span class="owned-badge">Débloquée</span>';`,
  `          action.innerHTML = '<span class="owned-badge">OK</span>';`
);

// Achievements shorter
mustReplace(
  "achievements action text",
  `        card.querySelector(".card-action").innerHTML = unlocked
          ? '<span class="owned-badge">Débloqué</span>'
          : '<span class="qty-badge">Verrouillé</span>';`,
  `        card.querySelector(".card-action").innerHTML = unlocked
          ? '<span class="owned-badge">✓</span>'
          : '<span class="qty-badge">🔒</span>';`
);

// Stats: keep essential rows only for cleaner mobile feel
mustReplace(
  "stats rows",
  `      const rows = [
        ["Zone actuelle", (getZoneDef(gameState.currentZoneId) || {}).name || "—"],
        ["Zones débloquées", (gameState.unlockedZones || []).length + " / " + ZONE_DEFS.length],
        ["Temps de jeu", formatDuration(gameState.playTimeMs)],
        ["Puissance actuelle", formatNumber(gameState.dragonPower) + " 🔥"],
        ["Puissance totale gagnée", formatNumber(gameState.totalPowerEarned) + " 🔥"],
        ["Clics totaux", formatNumber(gameState.totalClicks)],
        ["Clics manuels (lifetime)", formatNumber(gameState.lifetimeManualClicks)],
        ["CPS actuel", String(gameState.currentCps || 0)],
        ["Record CPS", String(gameState.peakCps || 0)],
        ["Clics critiques", formatNumber(gameState.totalCriticalClicks)],
        ["Puissance via clics", formatNumber(gameState.powerFromClicks) + " 🔥"],
        ["Puissance automatique", formatNumber(gameState.powerFromAuto) + " 🔥"],
        ["Producteurs totaux", formatNumber(getTotalProducers(gameState))],
        ["Améliorations achetées", formatNumber(getUpgradesBought(gameState))],
        ["🥚 Œufs éclos", formatNumber(gameState.totalEggsHatched || 0)],
        ["🥚 Œufs Draconiques éclos", formatNumber(basicHatches)],
        ["🐉 Dragons obtenus", formatNumber(gameState.totalDragonsObtained || 0)],
        ["🐉 Dragons uniques", countOwnedDragons(gameState) + " / " + getCatalogDragonCount()],
        ["⚪ Communs obtenus", formatNumber(rs.common || 0)],
        ["🔹 Rares obtenus", formatNumber(rs.rare || 0)],
        ["✨ Légendaires obtenus", formatNumber(rs.legendary || 0)],
        ["🌌 Mythiques obtenus", formatNumber(rs.mythic || 0)],
        ["Dragon le plus rare découvert", getRarestOwnedLabel()],
        ["Production actuelle/sec", formatNumber(gameState.powerPerSecond) + " 🔥"]
      ];`,
  `      const rows = [
        ["Zone", (getZoneDef(gameState.currentZoneId) || {}).name || "—"],
        ["Temps", formatDuration(gameState.playTimeMs)],
        ["Puissance", formatNumber(gameState.dragonPower)],
        ["Total gagné", formatNumber(gameState.totalPowerEarned)],
        ["Production/s", formatNumber(gameState.powerPerSecond)],
        ["Clics", formatNumber(gameState.totalClicks)],
        ["CPS / Record", (gameState.currentCps || 0) + " / " + (gameState.peakCps || 0)],
        ["Critiques", formatNumber(gameState.totalCriticalClicks)],
        ["Œufs éclos", formatNumber(gameState.totalEggsHatched || 0)],
        ["Dragons", countOwnedDragons(gameState) + " / " + getCatalogDragonCount()],
        ["Commun / Rare", formatNumber(rs.common || 0) + " / " + formatNumber(rs.rare || 0)],
        ["Lég. / Myth.", formatNumber(rs.legendary || 0) + " / " + formatNumber(rs.mythic || 0)]
      ];`
);

mustReplace(
  "dragons count text",
  `      document.getElementById("dragons-count").textContent =
        "Dragons découverts : " + ownedCount + " / " + visibleDefs.length;`,
  `      document.getElementById("dragons-count").textContent =
        ownedCount + " / " + visibleDefs.length;`
);

// Fix eggs zone note text in JS
mustReplace(
  "eggs zone note",
  `        zoneNote.textContent = "Zone actuelle : " + getCurrentZone().name;`,
  `        zoneNote.textContent = getCurrentZone().name;`
);

if (crlf) html = html.replace(/\n/g, "\r\n");
fs.writeFileSync(path, html);
console.log("OK simplified UI");
