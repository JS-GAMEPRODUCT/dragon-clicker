"use strict";
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "css", "style.css");
let s = fs.readFileSync(file, "utf8");

const marker = "  #panel-dragons .dragons-collection-scroll {";
const idx = s.indexOf(marker);
if (idx < 0) {
  console.error("marker not found");
  process.exit(1);
}

const endMarker = "  #panel-dragons .dragon-tile.undiscovered .dc-emoji {";
const end = s.indexOf(endMarker, idx);
if (end < 0) {
  console.error("end marker not found");
  process.exit(1);
}

const replacement = `  #panel-dragons .dragons-collection-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    overscroll-behavior-y: contain;
    padding: 0 2px 96px !important;
  }
  #panel-dragons .dragon-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    width: 100% !important;
    max-width: 100% !important;
    touch-action: pan-y;
  }
  #panel-dragons .dragon-tile {
    aspect-ratio: auto !important;
    width: 100% !important;
    max-width: none !important;
    min-height: 0 !important;
    height: auto !important;
    max-height: 250px !important;
    padding: 6px 6px 8px !important;
    margin: 0 !important;
    touch-action: pan-y;
    -webkit-user-select: none;
    user-select: none;
  }
  #panel-dragons .dragon-tile *,
  #panel-dragons .dt-art,
  #panel-dragons .dt-meta,
  #panel-dragons .dt-name,
  #panel-dragons .dt-stars,
  #panel-dragons .dt-bonus {
    touch-action: pan-y;
  }
  #panel-dragons .dt-art {
    flex: 0 0 auto !important;
    width: 100% !important;
    height: 130px !important;
    max-height: 130px !important;
    min-height: 120px !important;
    margin: 2px 0 !important;
    font-size: 2.1rem !important;
  }
  #panel-dragons .dt-art img {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    -webkit-user-drag: none;
    user-select: none;
    pointer-events: none;
  }
`;

s = s.slice(0, idx) + replacement + s.slice(end);
fs.writeFileSync(file, s);
console.log("OK dragons touch-action patched");
