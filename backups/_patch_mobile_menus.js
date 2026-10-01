const fs = require("fs");
const path = require("path");
const cssPath = path.join(__dirname, "..", "css", "style.css");
let css = fs.readFileSync(cssPath, "utf8");

const MARKER = "MOBILE MENUS ONLY";
if (css.includes(MARKER)) {
  const start = css.indexOf("\n/* =====");
  const markerIdx = css.indexOf(MARKER);
  // Find the comment start before marker
  const blockStart = css.lastIndexOf("\n/* =", markerIdx);
  if (blockStart !== -1) {
    css = css.slice(0, blockStart).trimEnd();
  }
}

const FINAL = `

/* =========================================================
   MOBILE MENUS ONLY — Equipe / Dragons / Boutique / Ameliorations
   Desktop rules above remain unchanged. This block wins on phones.
   ========================================================= */
@media (max-width: 768px) {
  html, body, #app {
    overflow-x: hidden;
    max-width: 100vw;
  }

  /* ---------- EQUIPE : popup fixed centree (sheetIn cassait translateX) ---------- */
  #team-module.team-module,
  #team-module.team-module.open {
    position: fixed !important;
    left: 50% !important;
    right: auto !important;
    top: 50% !important;
    bottom: auto !important;
    width: 90vw !important;
    max-width: 420px !important;
    height: auto !important;
    max-height: 72vh !important;
    margin: 0 !important;
    padding: 12px 12px 10px !important;
    box-sizing: border-box !important;
    transform: translate(-50%, -50%) !important;
    animation: none !important;
    overflow: hidden !important;
    z-index: 80 !important;
    display: none;
  }
  #team-module.team-module.open {
    display: flex !important;
    flex-direction: column !important;
  }
  #team-module .team-head {
    flex: 0 0 auto;
    margin-bottom: 8px;
    justify-content: center;
  }
  #team-module .team-close {
    display: grid !important;
    place-items: center;
    position: absolute;
    top: 8px;
    right: 8px;
    width: 36px;
    height: 36px;
    z-index: 5;
  }
  #team-module .team-title {
    font-size: clamp(0.78rem, 3.6vw, 0.92rem);
    letter-spacing: 0.14em;
    padding: 0 40px;
    text-align: center;
    max-width: 100%;
  }
  #team-module .team-title::before,
  #team-module .team-title::after {
    display: none !important;
  }
  #team-module .team-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    padding-bottom: 12px;
  }
  #team-module .team-slots { gap: 8px; }
  #team-module .team-slot {
    min-height: 72px !important;
    max-height: 82px !important;
    height: auto !important;
    gap: 8px !important;
    padding: 8px 10px !important;
    border-radius: 12px;
  }
  #team-module .team-slot:hover,
  #team-module .team-slot:focus-visible {
    transform: none !important;
  }
  #team-module .team-slot .ts-art {
    width: 48px !important;
    height: 48px !important;
    border-radius: 10px;
    font-size: 1.3rem !important;
  }
  #team-module .team-slot .ts-art img { object-fit: contain !important; }
  #team-module .team-slot.empty .ts-art.ts-plus { font-size: 1.3rem !important; }
  #team-module .team-slot.empty .ts-name,
  #team-module .team-slot.empty .ts-add {
    font-size: 0.94rem !important;
    letter-spacing: 0.04em;
  }
  #team-module .ts-name { font-size: 0.76rem !important; }
  #team-module .ts-rarity,
  #team-module .ts-bonus,
  #team-module .ts-add { font-size: 0.6rem !important; }
  #team-module .team-bonus {
    margin-top: 8px !important;
    padding: 8px !important;
  }
  #team-module .team-bonus-title {
    font-size: 0.66rem !important;
    margin-bottom: 4px !important;
  }
  #team-module .team-bonus-list { gap: 4px !important; }
  #team-module .team-bonus-list li {
    padding: 4px 6px !important;
    font-size: 0.7rem !important;
  }

  /* ---------- DRAGONS : grille 2 cols, cartes compactes ---------- */
  #panel-dragons.game-large-panel-overlay.overlay-panel.active {
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    overflow: hidden !important;
  }
  #panel-dragons .game-large-panel {
    left: 3vw !important;
    right: 3vw !important;
    width: 94vw !important;
    max-width: 94vw !important;
    top: max(56px, calc(env(safe-area-inset-top, 0px) + 48px)) !important;
    bottom: max(72px, calc(var(--nav-h, 64px) + env(safe-area-inset-bottom, 0px) + 8px)) !important;
    height: auto !important;
    max-height: 80vh !important;
    padding: 10px 10px 8px !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  #panel-dragons .dragons-menu-title,
  #panel-dragons .game-large-panel-title {
    font-size: clamp(24px, 7vw, 34px) !important;
    letter-spacing: 0.12em !important;
    margin-bottom: 6px !important;
    padding-bottom: 6px !important;
  }
  #panel-dragons .dragons-collection-bar {
    margin: 0 0 8px !important;
    padding: 8px 10px !important;
  }
  #panel-dragons .dragons-collection-label { font-size: 0.68rem !important; }
  #panel-dragons .dragons-collection-value { font-size: 0.8rem !important; }
  #panel-dragons .dragons-body {
    flex-direction: column !important;
    gap: 8px !important;
    margin: 0 !important;
    min-height: 0;
    overflow: hidden;
  }
  #panel-dragons .dragons-filters {
    flex: 0 0 auto !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    width: 100% !important;
    gap: 8px !important;
    padding: 0 0 6px !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    -webkit-overflow-scrolling: touch;
  }
  #panel-dragons .dragons-filter-btn {
    flex: 0 0 auto !important;
    width: auto !important;
    min-width: 72px !important;
    height: 34px !important;
    min-height: 34px !important;
    padding: 4px 10px !important;
    font-size: 0.62rem !important;
  }
  #panel-dragons .dragons-filter-btn.df-all,
  #panel-dragons .dragons-filter-btn.df-current,
  #panel-dragons .dragons-filter-btn.active:not(.df-all) {
    height: 34px !important;
    min-height: 34px !important;
    font-size: 0.62rem !important;
  }
  #panel-dragons .dragons-filter-btn.df-current .df-label,
  #panel-dragons .dragons-filter-btn.active:not(.df-all) .df-label {
    font-size: 0.62rem !important;
  }
  #panel-dragons .dragons-filter-btn .df-current-tag {
    display: none !important;
  }
  #panel-dragons .dragons-collection-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 2px 100px !important;
  }
  #panel-dragons .dragon-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  #panel-dragons .dragon-tile {
    aspect-ratio: auto !important;
    width: 100% !important;
    max-width: none !important;
    min-height: 0 !important;
    height: auto !important;
    max-height: 260px !important;
    padding: 8px !important;
    margin: 0 !important;
  }
  #panel-dragons .dt-art {
    flex: 0 0 auto !important;
    width: 100% !important;
    height: 120px !important;
    max-height: 120px !important;
    min-height: 110px !important;
    margin: 2px 0 !important;
    font-size: 2.2rem !important;
  }
  #panel-dragons .dt-art img {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
  }
  #panel-dragons .dragon-tile.undiscovered .dc-emoji {
    font-size: 2.2rem !important;
  }
  #panel-dragons .dt-name {
    font-size: 16px !important;
    letter-spacing: 0.06em !important;
    line-height: 1.15 !important;
  }
  #panel-dragons .dt-stars {
    font-size: 14px !important;
    min-height: 1em !important;
    letter-spacing: 0.06em !important;
  }
  #panel-dragons .dt-bonus {
    font-size: 11px !important;
    line-height: 1.2 !important;
    max-height: 2.6em;
    overflow: hidden;
  }
  #panel-dragons .dt-bonus-name,
  #panel-dragons .dt-bonus-value {
    font-size: 11px !important;
    line-height: 1.2 !important;
  }
  #panel-dragons .dt-status-badges {
    top: 4px;
    left: 4px;
    right: 4px;
  }
  #panel-dragons .dt-team-badge,
  #panel-dragons .dt-expedition-badge {
    font-size: 0.48rem !important;
    padding: 1px 5px !important;
  }

  /* ---------- BOUTIQUE + AMELIORATIONS : cartes compactes ---------- */
  #panel-shop.shop-panel.overlay-panel.active {
    overflow-x: hidden !important;
  }
  #panel-shop .shop-menu {
    width: 94vw !important;
    max-width: 94vw !important;
    height: min(82vh, calc(100dvh - 100px)) !important;
    max-height: min(82vh, calc(100dvh - 100px)) !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  #panel-shop .shop-menu-overlay {
    padding: max(3.5%, 16px) 3% 3% !important;
    overflow: hidden !important;
  }
  #panel-shop .shop-dual-layout {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 100px !important;
  }
  #panel-shop .shop-dual-divider { display: none !important; }
  #panel-shop .shop-column {
    flex: 0 0 auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    padding: 0 2px !important;
  }
  #panel-shop .shop-column-title {
    font-size: clamp(24px, 7vw, 34px) !important;
    letter-spacing: 0.1em !important;
    padding-bottom: 6px !important;
  }
  #panel-shop .shop-column-header {
    margin-bottom: 6px !important;
    padding-bottom: 4px !important;
  }
  #panel-shop .shop-column-zone { font-size: 0.65rem !important; }
  #panel-shop .shop-column-scroll {
    max-height: none !important;
    overflow: visible !important;
    padding-bottom: 6px !important;
  }
  #panel-shop .card-list { gap: 8px !important; }
  #panel-shop .shop-grid,
  #panel-shop .upgrades-grid {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }
  #panel-shop .item-row,
  #panel-shop .item-row.card {
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
    min-height: 0 !important;
    height: auto !important;
    padding: 10px 12px !important;
    margin: 0 !important;
  }
  #panel-shop .item-card-head {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    min-width: 0;
  }
  #panel-shop .item-icon {
    width: 52px !important;
    height: 52px !important;
    font-size: 1.45rem !important;
    border-radius: 10px !important;
  }
  #panel-shop .item-name {
    font-size: 16px !important;
    letter-spacing: 0.05em !important;
    line-height: 1.15 !important;
  }
  #panel-shop .item-level,
  #panel-shop .item-effect,
  #panel-shop .item-total,
  #panel-shop .item-desc {
    margin: 0 !important;
    padding-left: 62px !important;
    line-height: 1.2 !important;
  }
  #panel-shop .item-level { font-size: 12px !important; }
  #panel-shop .item-effect { font-size: 11px !important; }
  #panel-shop .item-total,
  #panel-shop .item-desc {
    font-size: 11px !important;
    max-height: 2.4em;
    overflow: hidden;
  }
  #panel-shop .item-card-foot {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
    min-height: 0 !important;
    margin-top: 4px !important;
    padding-top: 0 !important;
    width: 100%;
  }
  #panel-shop .item-progress-cost,
  #panel-shop .item-cost {
    font-size: 14px !important;
    text-align: left !important;
    margin: 0 !important;
  }
  #panel-shop .item-progress-max {
    font-size: 1rem !important;
    letter-spacing: 0.12em !important;
  }
  #panel-shop .item-card-foot .btn.gold-action-btn {
    width: auto !important;
    min-width: 110px !important;
    max-width: 140px !important;
    height: 36px !important;
    min-height: 36px !important;
    padding: 6px 12px !important;
    font-size: 0.72rem !important;
    margin-left: auto;
  }
  #panel-shop .shop-section-title {
    font-size: 0.72rem !important;
    margin: 2px 0 6px !important;
  }
}

@media (max-width: 480px) {
  #team-module.team-module,
  #team-module.team-module.open {
    width: 92vw !important;
    max-height: 70vh !important;
    padding: 10px 10px 8px !important;
  }
  #team-module .team-slot {
    min-height: 70px !important;
    max-height: 78px !important;
    padding: 6px 8px !important;
  }
  #team-module .team-slot .ts-art {
    width: 46px !important;
    height: 46px !important;
  }
  #panel-dragons .dt-art {
    height: 110px !important;
    max-height: 110px !important;
    min-height: 100px !important;
  }
  #panel-dragons .dragon-tile {
    max-height: 240px !important;
    padding: 6px !important;
  }
  #panel-dragons .dt-name { font-size: 15px !important; }
  #panel-dragons .dt-stars { font-size: 13px !important; }
  #panel-shop .item-icon {
    width: 48px !important;
    height: 48px !important;
  }
  #panel-shop .item-level,
  #panel-shop .item-effect,
  #panel-shop .item-total,
  #panel-shop .item-desc {
    padding-left: 58px !important;
  }
  #panel-shop .item-card-foot .btn.gold-action-btn {
    min-width: 100px !important;
    height: 34px !important;
    min-height: 34px !important;
  }
}
`;

fs.writeFileSync(cssPath, css.trimEnd() + FINAL);
console.log("OK appended mobile menus CSS, size=", fs.statSync(cssPath).size);