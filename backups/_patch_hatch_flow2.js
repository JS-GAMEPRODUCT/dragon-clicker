/* Stage 2 — rewrite startHatchSequence + summon + reveal timing */
const fs = require("fs");
const path = "C:/Users/Utilisateur/Desktop/mm/js/game.js";
let s = fs.readFileSync(path, "utf8");

function mustReplace(label, oldStr, newStr) {
  if (!s.includes(oldStr)) {
    console.error("FAIL:", label);
    process.exit(1);
  }
  s = s.replace(oldStr, newStr);
  console.log("OK:", label);
}

const startMarker = "    function startHatchSequence(eggDef) {";
const endMarker = "    function loadAssetImage(imgEl, emojiEl, src, options) {";
const i0 = s.indexOf(startMarker);
const i1 = s.indexOf(endMarker);
if (i0 < 0 || i1 < 0 || i1 <= i0) {
  console.error("FAIL: startHatchSequence bounds", i0, i1);
  process.exit(1);
}

const newStartHatch = `    function preloadDragonSummonSprite() {
      if (dragonSummonSpriteReady) return dragonSummonSpriteReady;
      dragonSummonSpriteReady = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = DRAGON_SUMMON_SRC;
      });
      return dragonSummonSpriteReady;
    }

    function clearDragonSummonEffectDom() {
      if (dragonSummonActiveEl && dragonSummonActiveEl.parentNode) {
        try { dragonSummonActiveEl.parentNode.removeChild(dragonSummonActiveEl); } catch (e) { /* ignore */ }
      }
      dragonSummonActiveEl = null;
      document.querySelectorAll(".dragon-summon-effect").forEach((el) => {
        try { el.remove(); } catch (e) { /* ignore */ }
      });
    }

    /**
     * Sprite-sheet summon FX — dragon stays invisible until this resolves.
     * Duration driven by HATCH_SEQUENCE_TIMINGS.summonEffect (or twin override).
     */
    function playDragonSummonEffect(opts) {
      opts = opts || {};
      const T = HATCH_SEQUENCE_TIMINGS;
      const duration = Math.max(200, opts.duration != null ? opts.duration : T.summonEffect);
      const reduce = prefersReducedMotion();
      clearDragonSummonEffectDom();
      if (reduce) return Promise.resolve();

      return preloadDragonSummonSprite().then((img) => {
        if (!img || !img.naturalWidth) return;
        const host = document.getElementById("click-zone") || document.body;
        const el = document.createElement("div");
        el.className = "dragon-summon-effect";
        el.setAttribute("aria-hidden", "true");
        const frameW = img.naturalWidth / DRAGON_SUMMON_COLS;
        const frameH = img.naturalHeight / DRAGON_SUMMON_ROWS;
        el.style.width = Math.round(frameW) + "px";
        el.style.height = Math.round(frameH) + "px";
        el.style.backgroundImage = "url(\\"" + DRAGON_SUMMON_SRC + "\\")";
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundSize = (DRAGON_SUMMON_COLS * 100) + "% " + (DRAGON_SUMMON_ROWS * 100) + "%";
        host.appendChild(el);
        dragonSummonActiveEl = el;

        const frameMs = Math.max(40, Math.floor(duration / DRAGON_SUMMON_TOTAL_FRAMES));
        let frame = 0;
        return new Promise((resolve) => {
          const tick = () => {
            if (!el.parentNode) { resolve(); return; }
            const col = frame % DRAGON_SUMMON_COLS;
            const row = Math.floor(frame / DRAGON_SUMMON_COLS);
            el.style.backgroundPosition =
              (-Math.round(col * frameW)) + "px " + (-Math.round(row * frameH)) + "px";
            frame++;
            if (frame >= DRAGON_SUMMON_TOTAL_FRAMES) {
              el.classList.add("is-fading");
              setTimeout(() => {
                clearDragonSummonEffectDom();
                resolve();
              }, 120);
              return;
            }
            setTimeout(tick, frameMs);
          };
          /* Soft scale-in */
          try {
            el.animate(
              [
                { opacity: 0, transform: "translate(-50%, -50%) scale(0.72)" },
                { opacity: 1, transform: "translate(-50%, -50%) scale(1.05)", offset: 0.2 },
                { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }
              ],
              { duration: Math.min(280, duration * 0.35), easing: "ease-out", fill: "forwards" }
            );
          } catch (e) { /* optional */ }
          tick();
        });
      }).catch(() => {});
    }

    function startHatchSequence(eggDef) {
      if (hatchSequenceActive) return;
      if (!eggDef || !getEggHatchPool(eggDef.id).length) {
        console.warn("[DragonClicker] Éclosion impossible — pool vide pour", eggDef && eggDef.id);
        return;
      }

      hatchSequenceActive = true;
      clicksLocked = true;
      document.getElementById("click-zone").classList.add("clicks-disabled");
      const stageEl = document.getElementById("egg-stage");
      if (stageEl) stageEl.classList.add("is-hatching");
      updateEggCarouselPeer();

      /* EGG CRACK exactly once at 100% — before any reveal */
      const progForCrack = getEggProgress(eggDef.id);
      if (!progForCrack.crackSoundPlayed) {
        progForCrack.crackSoundPlayed = true;
        playSound("eggCrack", { force: true });
      }

      /* Resolve + save FIRST so refresh / spam cannot duplicate */
      const reveal = resolveHatchReward(eggDef);
      if (!reveal) {
        hatchSequenceActive = false;
        clicksLocked = false;
        document.getElementById("click-zone").classList.remove("clicks-disabled");
        if (stageEl) stageEl.classList.remove("is-hatching");
        updateEggCarouselPeer();
        return;
      }
      pendingReveal = reveal;
      preloadDragonSummonSprite();

      const wrap = document.getElementById("entity-wrap");
      const overlay = document.getElementById("hatch-overlay");
      const flash = document.getElementById("hatch-flash");
      const hatchWrap = getEggHatchWrapper();
      const clickWrap = getEggClickWrapper();
      const rarity = reveal.dragonDef.rarity;
      const isLegendary = rarity === "legendary" || rarity === "divine";
      const isMythic = rarity === "mythic" || rarity === "divine";
      const isRare = rarity === "rare" || rarity === "epic";
      const reduce = prefersReducedMotion();
      const T = HATCH_SEQUENCE_TIMINGS;

      safeCancelAnimation(eggClickAnimation);
      safeCancelAnimation(eggAmbientAnimation);
      safeCancelAnimation(eggHatchAnimation);
      eggClickAnimation = null;
      eggAmbientAnimation = null;
      eggHatchAnimation = null;
      clearHatchFxTimers();
      clearDragonSummonEffectDom();
      const token = ++hatchFxToken;

      wrap.classList.remove(
        "breathe",
        "egg-stage-normal",
        "egg-stage-awakening",
        "egg-stage-hatching",
        "egg-stage-critical",
        "prog-0", "prog-1", "prog-2", "prog-3", "prog-4",
        "hatched",
        "clicked"
      );
      if (hatchWrap) {
        hatchWrap.classList.remove("egg-soft-pulse", "egg-soft-pulse-mid", "egg-soft-pulse-fast");
      }
      wrap.classList.add("hatching");
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
      clearSuspenseText();

      (async function runHatchSequence() {
        setSuspenseText("L'œuf est en train d'éclore...");

        /* 0 → finalShake : tremblement / fissuration finale */
        if (!reduce && hatchWrap && typeof hatchWrap.animate === "function") {
          eggHatchAnimation = hatchWrap.animate(
            [
              { transform: "translate(0,0) rotate(0deg) scale(1)", filter: "brightness(1)" },
              { transform: "translate(-3px,1px) rotate(-1.5deg) scale(1.03)", filter: "brightness(1.2)" },
              { transform: "translate(4px,-1px) rotate(2deg) scale(1.05)", filter: "brightness(1.45)" },
              { transform: "translate(-4px,0) rotate(-2.2deg) scale(1.06)", filter: "brightness(1.65)" },
              { transform: "translate(0,0) rotate(0deg) scale(1.04)", filter: "brightness(1.5)" }
            ],
            { duration: T.finalShake, easing: "ease-in", fill: "none" }
          );
          spawnHatchParticles(isMythic ? 6 : isLegendary ? 4 : 3, isMythic);
          await waitAnimation(eggHatchAnimation);
          safeCancelAnimation(eggHatchAnimation);
          eggHatchAnimation = null;
          if (hatchWrap) {
            hatchWrap.style.transform = "";
            hatchWrap.style.filter = "";
          }
          if (token !== hatchFxToken) return;
        } else {
          if (!(await hatchDelay(Math.round(T.finalShake * 0.55), token))) return;
        }

        /* breakPhase : glow / rupture — HATCH SOUND ~650ms after crack */
        setSuspenseText("Quelque chose se réveille...");
        if (flash) {
          flash.classList.remove("burst");
          void flash.offsetWidth;
          flash.classList.add("burst");
        }

        const hatchSoundPromise = (async () => {
          if (!(await hatchDelay(T.hatchSoundAt, token))) return;
          playSound("hatch");
        })();

        if (!reduce && hatchWrap && typeof hatchWrap.animate === "function") {
          safeCancelAnimation(eggHatchAnimation);
          eggHatchAnimation = hatchWrap.animate(
            [
              { transform: "translate(0,0) rotate(0deg) scale(1.04)", filter: "brightness(1.5)" },
              { transform: "translate(-6px,2px) rotate(-3deg) scale(1.07)", filter: "brightness(1.9)" },
              { transform: "translate(6px,-2px) rotate(3deg) scale(1.09)", filter: "brightness(2.2)" },
              { transform: "translate(0,0) rotate(0deg) scale(1.05)", filter: "brightness(1.75)" }
            ],
            { duration: T.breakPhase, easing: "ease-in-out", fill: "none" }
          );
          spawnHatchParticles(isMythic ? 10 : isLegendary ? 7 : isRare ? 5 : 3, isMythic);
          if (window.DCAnim && DCAnim.burst) {
            const zone = document.getElementById("click-zone");
            if (zone) {
              const r = zone.getBoundingClientRect();
              DCAnim.burst(r.left + r.width / 2, r.top + r.height / 2, {
                count: DCAnim.particleCount(isMythic ? "mythic" : "hatch"),
                palette: isMythic ? ["#ff4ad2", "#ffe29a", "#7ad7ff"] : ["#ffe29a", "#ffb347"],
                speed: 3.2,
                life: 620
              });
            }
          }
          await waitAnimation(eggHatchAnimation);
          safeCancelAnimation(eggHatchAnimation);
          eggHatchAnimation = null;
          if (hatchWrap) {
            hatchWrap.style.transform = "";
            hatchWrap.style.filter = "";
          }
          if (token !== hatchFxToken) return;
        } else {
          if (!(await hatchDelay(Math.round(T.breakPhase * 0.6), token))) return;
          playSound("hatch");
        }
        await hatchSoundPromise;

        /* eggVanish : disparition progressive */
        wrap.classList.remove("hatching");
        wrap.classList.add("hatch-vanish");
        if (!reduce && clickWrap && typeof clickWrap.animate === "function") {
          safeCancelAnimation(eggClickAnimation);
          eggClickAnimation = clickWrap.animate(
            [
              { transform: "scale(1)", filter: "brightness(1.5)", opacity: 1 },
              { transform: "scale(0.9)", filter: "brightness(2)", opacity: 0.85 },
              { transform: "scale(1.08)", filter: "brightness(2.3)", opacity: 0.35 },
              { transform: "scale(0.65)", filter: "brightness(2.6)", opacity: 0 }
            ],
            { duration: T.eggVanish, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }
          );
          spawnHatchParticles(isMythic ? 12 : isLegendary ? 8 : 5, isMythic);
          if (window.DCAnim && DCAnim.spawnShockwave) {
            const zone = document.getElementById("click-zone");
            if (zone) {
              const r = zone.getBoundingClientRect();
              DCAnim.spawnShockwave(zone, r.width / 2, r.height / 2, isMythic ? "shockwave-combo" : "shockwave-crit");
            }
          }
          await waitAnimation(eggClickAnimation);
          safeCancelAnimation(eggClickAnimation);
          eggClickAnimation = null;
          if (token !== hatchFxToken) return;
        } else {
          if (!(await hatchDelay(Math.round(T.eggVanish * 0.65), token))) return;
        }

        wrap.classList.remove("hatch-vanish");
        wrap.style.opacity = "0";
        if (clickWrap) {
          clickWrap.style.transform = "";
          clickWrap.style.filter = "";
          clickWrap.style.opacity = "0";
        }
        if (isMythic) setSuspenseText("", true);
        else clearSuspenseText();

        /* Pause visuelle : l'œuf a éclos — pas encore le contenu */
        if (!(await hatchDelay(reduce ? 80 : T.pauseAfterBreak, token))) {
          if (token !== hatchFxToken) return;
          resetEggVisualState();
          return;
        }

        /* Effet magique — dragon encore invisible */
        if (token !== hatchFxToken) return;
        await playDragonSummonEffect({ duration: T.summonEffect });
        if (token !== hatchFxToken) return;

        /* Préparer la scène, garder l'œuf caché jusqu'à cleanup */
        clearSuspenseText();
        if (flash) flash.classList.remove("burst");
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        wrap.style.opacity = "0";
        wrap.classList.remove("hatch-vanish", "hatching", "hatched");
        safeCancelAnimation(eggClickAnimation);
        safeCancelAnimation(eggHatchAnimation);
        eggClickAnimation = null;
        eggHatchAnimation = null;
        if (hatchWrap) {
          hatchWrap.style.transform = "";
          hatchWrap.style.filter = "";
        }
        clearDragonSummonEffectDom();

        /* Unique reveal path — waits for sequence above */
        openRevealModal(pendingReveal);
        renderEggProgressUI();
        renderEggPicker();
      })();
    }

`;

s = s.slice(0, i0) + newStartHatch + s.slice(i1);
console.log("OK: startHatchSequence rewritten");

/* openRevealModal: defer popup sound to reveal animation */
mustReplace(
  "openRevealModal popup sound",
  `      modal.classList.add("reveal-animating");
      modal.classList.remove("hidden");
      /* Popup dragon SFX : synchronisé avec l'apparition visuelle (1× par révélation). */
      playDragonPopupSound();
      playDragonRevealAppear(dragonDef.rarity, !!reveal.isNew);
    }`,
  `      modal.classList.add("reveal-animating");
      modal.classList.remove("hidden");
      /* Popup SFX plays when the dragon portrait actually becomes visible. */
      playDragonRevealAppear(dragonDef.rarity, !!reveal.isNew);
    }`
);

/* Soften playDragonRevealAppear duration + portrait keyframes + popup timing */
mustReplace(
  "reveal duration base",
  `      let dragonDur = timing ? timing.duration : (isNew ? 900 : 700);
      if (!timing) {
        if (isMythic) dragonDur += 450;
        else if (isLegendary) dragonDur += 220;
        else if (isRare) dragonDur += 120;
        if (reduce) dragonDur = Math.min(dragonDur, 360);
      }`,
  `      /* Hatch reveal duration — single source HATCH_SEQUENCE_TIMINGS.dragonReveal */
      let dragonDur = HATCH_SEQUENCE_TIMINGS.dragonReveal;
      if (isMythic) dragonDur = Math.round(dragonDur * 1.15);
      else if (isLegendary) dragonDur = Math.round(dragonDur * 1.08);
      if (isNew) dragonDur = Math.round(dragonDur * 1.05);
      if (reduce) dragonDur = Math.min(dragonDur, 320);
      if (timing && timing.duration && timing.duration > dragonDur) {
        /* Keep rarity FX budget from DCAnim if longer, but never shorter than hatch timeline. */
        dragonDur = Math.max(dragonDur, Math.min(timing.duration, 900));
      }`
);

mustReplace(
  "reduce path + popup",
  `      if (reduce) {
        if (art) {
          art.animate(
            [
              { transform: "scale(0.88)", opacity: 0.6 },
              { transform: "scale(1)", opacity: 1 }
            ],
            { duration: dragonDur, easing: "ease-out", fill: "forwards" }
          ).finished.catch(() => {});
        }
        if (modal) modal.classList.remove("reveal-animating");
        document.querySelectorAll("#dragon-modal .dragon-reveal-ui").forEach((el) => {
          el.style.opacity = "";
          el.style.transform = "";
        });
        return;
      }

      if (modalInner) {`,
  `      if (reduce) {
        playDragonPopupSound();
        if (art) {
          art.animate(
            [
              { transform: "scale(0.88)", opacity: 0.6 },
              { transform: "scale(1)", opacity: 1 }
            ],
            { duration: dragonDur, easing: "ease-out", fill: "forwards" }
          ).finished.catch(() => {});
        }
        if (modal) modal.classList.remove("reveal-animating");
        document.querySelectorAll("#dragon-modal .dragon-reveal-ui").forEach((el) => {
          el.style.opacity = "";
          el.style.transform = "";
        });
        return;
      }

      /* Hide portraits until reveal animation starts */
      portraits.forEach((p) => {
        if (!p) return;
        p.style.opacity = "0";
        p.style.transform = "scale(0.72)";
      });

      if (modalInner) {`
);

mustReplace(
  "portrait keyframes",
  `      if (portraits.length) {
        const startScale = isNew ? 0.42 : 0.55;
        const peakScale = isMythic ? 1.12 : isNew ? 1.08 : 1.05;
        const frames = [
          {
            transform: "scale(" + startScale + ") translateY(28px)",
            opacity: 0,
            filter: "brightness(0.2) saturate(0.4) " + glow
          },
          {
            transform: "scale(" + (startScale + 0.18) + ") translateY(10px)",
            opacity: 0.55,
            filter: "brightness(0.7) saturate(0.8) " + glow,
            offset: 0.28
          },
          {
            transform: "scale(" + peakScale + ") translateY(-4px)",
            opacity: 1,
            filter: "brightness(1.35) saturate(1.15) " + glow,
            offset: 0.62
          },
          {
            transform: "scale(1) translateY(0)",
            opacity: 1,
            filter: "brightness(1) saturate(1) " + glow
          }
        ];
        portraits.forEach((portrait) => {
          if (!portrait || typeof portrait.animate !== "function") return;
          portrait.animate(frames, {
            duration: dragonDur,
            easing: "cubic-bezier(.18,.9,.22,1)",
            delay: 60
          }).finished.catch(() => {});
        });
      }`,
  `      if (portraits.length) {
        const frames = [
          {
            transform: "scale(0.72)",
            opacity: 0,
            filter: "brightness(0.25) saturate(0.45) " + glow,
            offset: 0
          },
          {
            transform: "scale(0.82)",
            opacity: 0.35,
            filter: "brightness(0.7) saturate(0.8) " + glow,
            offset: 0.35
          },
          {
            transform: "scale(1.05)",
            opacity: 0.85,
            filter: "brightness(1.25) saturate(1.1) " + glow,
            offset: 0.7
          },
          {
            transform: "scale(1)",
            opacity: 1,
            filter: "brightness(1) saturate(1) " + glow,
            offset: 1
          }
        ];
        /* Popup sound when dragon starts becoming visible */
        playDragonPopupSound();
        portraits.forEach((portrait) => {
          if (!portrait || typeof portrait.animate !== "function") return;
          const anim = portrait.animate(frames, {
            duration: dragonDur,
            easing: "cubic-bezier(.22,.8,.25,1)",
            delay: 0,
            fill: "forwards"
          });
          anim.finished.then(() => {
            portrait.style.opacity = "";
            portrait.style.transform = "";
            portrait.style.filter = "";
          }).catch(() => {
            portrait.style.opacity = "";
            portrait.style.transform = "";
            portrait.style.filter = "";
          });
        });
      } else {
        playDragonPopupSound();
      }`
);

/* finishHatchCleanup — restore egg opacity + clear summon */
mustReplace(
  "finishHatchCleanup",
  `    function finishHatchCleanup() {
      hatchFxToken++;
      clearHatchFxTimers();
      hatchSequenceActive = false;
      clicksLocked = false;
      const stageEl = document.getElementById("egg-stage");
      if (stageEl) stageEl.classList.remove("is-hatching");
      const clickZone = document.getElementById("click-zone");
      if (clickZone) clickZone.classList.remove("clicks-disabled");
      const dragonImg = document.getElementById("hatch-dragon-img");
      if (dragonImg) dragonImg.hidden = true;
      const dragonEmoji = document.getElementById("hatch-dragon-emoji");
      if (dragonEmoji) dragonEmoji.style.display = "";
      pendingReveal = null;
      lastEggAmbientShakeAt = 0;
      currentEggImageStage = null;
      currentEggImageEggId = null;
      renderCurrentEgg();
      renderRecentHatches();
      refreshDragonCollectionUI();
    }`,
  `    function finishHatchCleanup() {
      hatchFxToken++;
      clearHatchFxTimers();
      clearDragonSummonEffectDom();
      hatchSequenceActive = false;
      clicksLocked = false;
      const stageEl = document.getElementById("egg-stage");
      if (stageEl) stageEl.classList.remove("is-hatching");
      const clickZone = document.getElementById("click-zone");
      if (clickZone) clickZone.classList.remove("clicks-disabled");
      const wrap = document.getElementById("entity-wrap");
      if (wrap) wrap.style.opacity = "";
      const clickWrap = getEggClickWrapper();
      if (clickWrap) {
        clickWrap.style.opacity = "";
        clickWrap.style.transform = "";
        clickWrap.style.filter = "";
      }
      const dragonImg = document.getElementById("hatch-dragon-img");
      if (dragonImg) dragonImg.hidden = true;
      const dragonEmoji = document.getElementById("hatch-dragon-emoji");
      if (dragonEmoji) dragonEmoji.style.display = "";
      pendingReveal = null;
      lastEggAmbientShakeAt = 0;
      currentEggImageStage = null;
      currentEggImageEggId = null;
      renderCurrentEgg();
      renderRecentHatches();
      refreshDragonCollectionUI();
    }`
);

/* Twin: summon then reveal — no crack/hatch */
mustReplace(
  "twin path",
  `          showTwinHatchBanner(() => {
            openRevealModal(pendingReveal);
            /* Popup dragon rejoué via openRevealModal — pas de 2e son d'éclosion. */
          });`,
  `          showTwinHatchBanner(() => {
            playDragonSummonEffect({ duration: HATCH_SEQUENCE_TIMINGS.twinSummonEffect }).then(() => {
              openRevealModal(pendingReveal);
              /* Popup via reveal — pas de 2e crack/hatch. */
            });
          });`
);

/* eggCrack force support */
mustReplace(
  "playEggCrack force",
  `      playEggCrack() {
        const level = this.sfx();
        if (level <= 0) return;
        if (!this.canPlay("eggCrack", 400)) return;
        const el = this.ensureEggCrack();
        el.volume = Math.max(0, Math.min(1, this.eggCrackBaseVolume * level));
        try {
          el.currentTime = 0;
        } catch (e) { /* ignore seek errors before load */ }
        const p = el.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => { /* autoplay / unlock may block once */ });
        }
      },`,
  `      playEggCrack(opts) {
        opts = opts || {};
        const level = this.sfx();
        if (level <= 0) return;
        if (!opts.force && !this.canPlay("eggCrack", 400)) return;
        if (opts.force) this.lastPlayAt.eggCrack = performance.now();
        const el = this.ensureEggCrack();
        el.volume = Math.max(0, Math.min(1, this.eggCrackBaseVolume * level));
        try {
          el.currentTime = 0;
        } catch (e) { /* ignore seek errors before load */ }
        const p = el.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => { /* autoplay / unlock may block once */ });
        }
      },`
);

mustReplace(
  "play eggCrack opts",
  `        if (type === "eggCrack") {
          this.playEggCrack();
          return;
        }`,
  `        if (type === "eggCrack") {
          this.playEggCrack(opts);
          return;
        }`
);

fs.writeFileSync(path, s);
console.log("stage2 written");
