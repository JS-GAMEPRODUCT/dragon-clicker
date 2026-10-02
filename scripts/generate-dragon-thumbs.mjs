/**
 * Génère des miniatures WebP 512px pour les portraits dragons.
 *
 * Usage :
 *   npm run thumbs
 *   node scripts/generate-dragon-thumbs.mjs
 *
 * - Lit les chemins image de js/data/dragons.js (et tout PNG dragon sous assets/dragons/)
 * - Écrit assets/dragons/thumbs/<même-nom>.webp
 * - Ne modifie / n'écrase JAMAIS les PNG originaux
 * - Ignore une thumb déjà à jour (mtime source ≤ mtime thumb)
 */
"use strict";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRAGONS_DIR = path.join(ROOT, "assets", "dragons");
const THUMBS_DIR = path.join(DRAGONS_DIR, "thumbs");
const DRAGONS_DATA = path.join(ROOT, "js", "data", "dragons.js");
const MAX_SIZE = 512;
const WEBP_QUALITY = 88;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** Extrait les chemins assets/dragons/*.png|jpg|webp référencés dans dragons.js */
function collectPathsFromData() {
  const src = fs.readFileSync(DRAGONS_DATA, "utf8");
  const re = /image:\s*["'](assets\/dragons\/[^"']+\.(?:png|jpe?g|webp))["']/gi;
  const set = new Set();
  let m;
  while ((m = re.exec(src))) {
    set.add(m[1].replace(/\\/g, "/"));
  }
  return [...set];
}

/** Tous les PNG à la racine de assets/dragons/ (pas thumbs/) */
function collectPathsFromFolder() {
  if (!fs.existsSync(DRAGONS_DIR)) return [];
  return fs
    .readdirSync(DRAGONS_DIR)
    .filter((f) => /\.(png|jpe?g)$/i.test(f))
    .map((f) => "assets/dragons/" + f);
}

function thumbRelFromSource(rel) {
  const base = path.basename(rel).replace(/\.(png|jpe?g|webp)$/i, "");
  return "assets/dragons/thumbs/" + base + ".webp";
}

function isUpToDate(srcAbs, thumbAbs) {
  if (!fs.existsSync(thumbAbs)) return false;
  const s = fs.statSync(srcAbs).mtimeMs;
  const t = fs.statSync(thumbAbs).mtimeMs;
  return t >= s;
}

async function makeThumb(relSrc) {
  const srcAbs = path.join(ROOT, relSrc);
  if (!fs.existsSync(srcAbs)) {
    return { relSrc, status: "missing-source" };
  }
  const relThumb = thumbRelFromSource(relSrc);
  const thumbAbs = path.join(ROOT, relThumb);
  ensureDir(path.dirname(thumbAbs));

  if (isUpToDate(srcAbs, thumbAbs)) {
    return { relSrc, relThumb, status: "skipped" };
  }

  const meta = await sharp(srcAbs).metadata();
  const w = meta.width || MAX_SIZE;
  const h = meta.height || MAX_SIZE;
  const needsResize = w > MAX_SIZE || h > MAX_SIZE;

  let pipeline = sharp(srcAbs).ensureAlpha();
  if (needsResize) {
    pipeline = pipeline.resize(MAX_SIZE, MAX_SIZE, {
      fit: "inside",
      withoutEnlargement: true
    });
  }

  await pipeline
    .webp({
      quality: WEBP_QUALITY,
      alphaQuality: 100,
      smartSubsample: true,
      effort: 4
    })
    .toFile(thumbAbs);

  const outMeta = await sharp(thumbAbs).metadata();
  const srcSize = fs.statSync(srcAbs).size;
  const thumbSize = fs.statSync(thumbAbs).size;
  return {
    relSrc,
    relThumb,
    status: "written",
    srcWH: [w, h],
    outWH: [outMeta.width, outMeta.height],
    srcSize,
    thumbSize
  };
}

async function main() {
  ensureDir(THUMBS_DIR);
  const fromData = collectPathsFromData();
  const fromFolder = collectPathsFromFolder();
  const all = [...new Set([...fromData, ...fromFolder])].sort();

  console.log("[thumbs] sources:", all.length);
  console.log("[thumbs] max:", MAX_SIZE + "px", "quality:", WEBP_QUALITY);

  const results = [];
  for (const rel of all) {
    try {
      const r = await makeThumb(rel);
      results.push(r);
      const tag = r.status.padEnd(14);
      if (r.status === "written") {
        console.log(
          "  OK  ",
          tag,
          path.basename(rel),
          "→",
          path.basename(r.relThumb),
          `(${r.srcWH.join("x")} → ${r.outWH.join("x")}, ${(r.thumbSize / 1024).toFixed(1)} KiB)`
        );
      } else if (r.status === "skipped") {
        console.log("  --  ", tag, path.basename(rel));
      } else {
        console.log("  !!  ", tag, rel);
      }
    } catch (err) {
      console.error("  ERR ", rel, err && err.message ? err.message : err);
      results.push({ relSrc: rel, status: "error", error: String(err && err.message) });
    }
  }

  const written = results.filter((r) => r.status === "written").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const missing = results.filter((r) => r.status === "missing-source").length;
  const errors = results.filter((r) => r.status === "error").length;
  console.log(
    `[thumbs] done — written=${written} skipped=${skipped} missing=${missing} errors=${errors}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
