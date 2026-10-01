/* Slow hatch sequence ~4.2s — sequential awaits only */
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

mustReplace(
  "HATCH_SEQUENCE_TIMINGS",
  `    const HATCH_SEQUENCE_TIMINGS = {
      crackSound: 120,   /* EGG CRACK tôt dans le tremblement final (~100–150ms) */
      finalShake: 450,
      breakPhase: 350,
      hatchSoundAt: 200, /* offset into breakPhase → ~650ms after sequence start */
      eggVanish: 200,
      pauseAfterBreak: 200,
      summonEffect: 750,
      dragonReveal: 650,
      twinSummonEffect: 500
    };`,
  `    /**
     * Hatch reveal timeline — intentionally slow (~4.2s total).
     * Single source of truth; runHatchSequence awaits each phase in order.
     */
    const HATCH_SEQUENCE_TIMINGS = {
      crackSound: 100,          /* EGG CRACK ~100ms after 100% */
      finalShake: 750,          /* progressive final tremble */
      breakPhase: 550,          /* glow / fissure / open */
      hatchSoundAt: 200,        /* offset into breakPhase → ~1050ms absolute */
      eggVanish: 350,           /* progressive egg fade (not instant) */
      pauseAfterBreak: 250,     /* beat between egg gone and magic */
      summonEffect: 1000,       /* magic sprite sheet full play */
      dragonReveal: 1200,       /* slow materialize */
      dragonRevealSoundAt: 250, /* rarity SFX after dragon starts appearing */
      twinPause: 400,
      twinSummonEffect: 900
    };`
);

/* Replace entire runHatchSequence IIFE body from the async function start through openRevealModal */
const runStart = "      (async function runHatchSequence() {";
const runEnd = "      })();\n    }\n\n    function loadAssetImage";
const i0 = s.indexOf(runStart);
const i1 = s.indexOf(runEnd);
if (i0 < 0 || i1 < 0) {
  console.error("FAIL: runHatchSequence bounds", i0, i1);
  process.exit(1);
}

const newRun = `      (async function runHatchSequence() {
        setSuspenseText("L'œuf est en train d'éclore...");

        /* --- 1) CRACK puis tremblement (strictement séquentiel) --- */
        if (!(await hatchDelay(T.crackSound, token))) return;
        if (!sequenceCrackPlayed) {
          sequenceCrackPlayed = true;
          playSound("eggCrack", { force: true });
        }

        if (!reduce && hatchWrap && typeof hatchWrap.animate === "function") {
          eggHatchAnimation = hatchWrap.animate(
            [
              { transform: "translate(0,0) rotate(0deg) scale(1)", filter: "brightness(1)" },
              { transform: "translate(-3px,1px) rotate(-1.4deg) scale(1.025)", filter: "brightness(1.15)", offset: 0.25 },
              { transform: "translate(4px,-1px) rotate(2deg) scale(1.045)", filter: "brightness(1.35)", offset: 0.5 },
              { transform: "translate(-5px,1px) rotate(-2.4deg) scale(1.06)", filter: "brightness(1.55)", offset: 0.78 },
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
          if (!(await hatchDelay(Math.round(T.finalShake * 0.7), token))) return;
        }

        /* --- 2) Fissuration / glow / ouverture + HATCH SOUND --- */
        setSuspenseText("Quelque chose se réveille...");
        if (flash) {
          flash.classList.remove("burst");
          void flash.offsetWidth;
          flash.classList.add("burst");
        }

        if (!reduce && hatchWrap && typeof hatchWrap.animate === "function") {
          safeCancelAnimation(eggHatchAnimation);
          eggHatchAnimation = hatchWrap.animate(
            [
              { transform: "translate(0,0) rotate(0deg) scale(1.04)", filter: "brightness(1.5)" },
              { transform: "translate(-6px,2px) rotate(-3deg) scale(1.07)", filter: "brightness(1.85)", offset: 0.35 },
              { transform: "translate(6px,-2px) rotate(3deg) scale(1.1)", filter: "brightness(2.2)", offset: 0.7 },
              { transform: "translate(0,0) rotate(0deg) scale(1.05)", filter: "brightness(1.8)" }
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
                speed: 3.0,
                life: 700
              });
            }
          }
          /* Hatch SFX mid-break, then wait for the rest of the WAAPI */
          if (!(await hatchDelay(T.hatchSoundAt, token))) return;
          playSound("hatch");
          await waitAnimation(eggHatchAnimation);
          safeCancelAnimation(eggHatchAnimation);
          eggHatchAnimation = null;
          if (hatchWrap) {
            hatchWrap.style.transform = "";
            hatchWrap.style.filter = "";
          }
          if (token !== hatchFxToken) return;
        } else {
          if (!(await hatchDelay(T.hatchSoundAt, token))) return;
          playSound("hatch");
          if (!(await hatchDelay(Math.max(80, T.breakPhase - T.hatchSoundAt), token))) return;
        }

        /* --- 3) Disparition progressive de l'œuf --- */
        wrap.classList.remove("hatching");
        wrap.classList.add("hatch-vanish");
        if (!reduce && clickWrap && typeof clickWrap.animate === "function") {
          safeCancelAnimation(eggClickAnimation);
          eggClickAnimation = clickWrap.animate(
            [
              { transform: "scale(1)", filter: "brightness(1.5)", opacity: 1 },
              { transform: "scale(0.94)", filter: "brightness(1.9)", opacity: 0.85, offset: 0.3 },
              { transform: "scale(1.06)", filter: "brightness(2.25)", opacity: 0.4, offset: 0.65 },
              { transform: "scale(0.7)", filter: "brightness(2.5)", opacity: 0 }
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
          if (!(await hatchDelay(T.eggVanish, token))) return;
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

        /* --- 4) Pause réelle avant magie --- */
        if (!(await hatchDelay(reduce ? 100 : T.pauseAfterBreak, token))) {
          if (token !== hatchFxToken) return;
          resetEggVisualState();
          return;
        }

        /* --- 5) Effet magique (dragon encore invisible) --- */
        if (token !== hatchFxToken) return;
        await playDragonSummonEffect({ duration: T.summonEffect });
        if (token !== hatchFxToken) return;

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

        /* --- 6) Unique reveal path — await full dragon materialize --- */
        await openRevealModal(pendingReveal);
        renderEggProgressUI();
        renderEggPicker();
      })();
    }

    function loadAssetImage`;

s = s.slice(0, i0) + newRun + s.slice(i1 + runEnd.length - "    function loadAssetImage".length);
console.log("OK: runHatchSequence rewritten");

/* openRevealModal → return promise from playDragonRevealAppear */
mustReplace(
  "openRevealModal end",
  `      modal.classList.add("reveal-animating");
      modal.classList.remove("hidden");
      /* Popup SFX plays when the dragon portrait actually becomes visible. */
      playDragonRevealAppear(dragonDef.rarity, !!reveal.isNew);
    }

    function playDragonRevealAppear(rarity, isNew) {`,
  `      /* Hide portraits BEFORE showing modal — never flash opacity 1 */
      const preImg = document.getElementById("dragon-modal-img");
      const preEmoji = document.getElementById("dragon-modal-emoji");
      [preImg, preEmoji].forEach((el) => {
        if (!el) return;
        el.style.opacity = "0";
        el.style.transform = "scale(0.65)";
      });

      modal.classList.add("reveal-animating");
      modal.classList.remove("hidden");
      /* Await full materialize — sole reveal path after hatch sequence */
      return playDragonRevealAppear(dragonDef.rarity, !!reveal.isNew);
    }

    function playDragonRevealAppear(rarity, isNew) {`
);

/* Rewrite playDragonRevealAppear duration + frames + sound delay + return Promise */
mustReplace(
  "reveal duration calc",
  `      /* Hatch reveal duration — single source HATCH_SEQUENCE_TIMINGS.dragonReveal */
      let dragonDur = HATCH_SEQUENCE_TIMINGS.dragonReveal;
      if (isMythic) dragonDur = Math.round(dragonDur * 1.15);
      else if (isLegendary) dragonDur = Math.round(dragonDur * 1.08);
      if (isNew) dragonDur = Math.round(dragonDur * 1.05);
      if (reduce) dragonDur = Math.min(dragonDur, 320);
      if (timing && timing.duration && timing.duration > dragonDur) {
        /* Keep rarity FX budget from DCAnim if longer, but never shorter than hatch timeline. */
        dragonDur = Math.max(dragonDur, Math.min(timing.duration, 900));
      }`,
  `      /* Single source: HATCH_SEQUENCE_TIMINGS.dragonReveal (~1200ms) */
      let dragonDur = HATCH_SEQUENCE_TIMINGS.dragonReveal;
      if (isMythic) dragonDur = Math.round(dragonDur * 1.08);
      else if (isLegendary) dragonDur = Math.round(dragonDur * 1.04);
      if (reduce) dragonDur = Math.min(dragonDur, 400);
      const soundAt = Math.max(0, HATCH_SEQUENCE_TIMINGS.dragonRevealSoundAt || 250);`
);

mustReplace(
  "reduce + portrait reveal block",
  `      if (reduce) {
        playDragonRevealSound(rarity);
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

      if (modalInner) {
        modalInner.animate(
          [
            { transform: "scale(0.92) translateY(18px)", opacity: 0 },
            { transform: "scale(1.015) translateY(-2px)", opacity: 1, offset: 0.7 },
            { transform: "scale(1) translateY(0)", opacity: 1 }
          ],
          { duration: 420, easing: "cubic-bezier(.2,.85,.25,1)" }
        ).finished.catch(() => {});
      }

      if (ring) {
        ring.animate(
          [
            { opacity: 0, transform: "translate(-50%, -50%) scale(0.35)" },
            { opacity: 1, transform: "translate(-50%, -50%) scale(1.05)", offset: 0.35 },
            { opacity: 0.55, transform: "translate(-50%, -50%) scale(1.55)", offset: 0.7 },
            { opacity: 0, transform: "translate(-50%, -50%) scale(2.1)" }
          ],
          { duration: isMythic ? 900 : 700, easing: "cubic-bezier(.15,.8,.25,1)", delay: 80 }
        ).finished.catch(() => {});
      }

      if (flash) {
        flash.animate(
          [
            { opacity: 0, transform: "scale(0.5)" },
            { opacity: isMythic ? 1 : 0.85, transform: "scale(1.05)", offset: 0.25 },
            { opacity: 0, transform: "scale(1.35)" }
          ],
          { duration: isMythic ? 520 : 380, easing: "ease-out", delay: 120 }
        ).finished.catch(() => {});
      }

      if (aura) {
        aura.animate(
          [
            { opacity: 0, transform: "scale(0.45)" },
            { opacity: 1, transform: "scale(1.12)", offset: 0.55 },
            { opacity: 1, transform: "scale(1)" }
          ],
          { duration: dragonDur * 0.85, easing: "cubic-bezier(.2,.85,.25,1)", delay: 100 }
        ).finished.catch(() => {});
      }

      if (portraits.length) {
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
        playDragonRevealSound(rarity);
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
        playDragonRevealSound(rarity);
      }

      if (art) {
        art.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.025)", offset: 0.5 },
            { transform: "scale(1)" }
          ],
          {
            duration: isMythic ? 700 : 520,
            delay: Math.max(200, dragonDur - 80),
            easing: "ease-in-out"
          }
        ).finished.catch(() => {});
      }

      spawnDragonRevealSparks(sparksHost, rarity, isNew);

      const uiNodes = Array.prototype.slice.call(
        document.querySelectorAll("#dragon-modal .dragon-reveal-ui")
      );
      uiNodes.forEach((el, i) => {
        if (el.hidden) return;
        const delay = 280 + i * 90 + (isNew ? 40 : 0) + (isMythic ? 60 : 0);
        if (el.getAnimations) el.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) {} });
        el.animate(
          [
            { opacity: 0, transform: "translateY(16px) scale(0.96)" },
            { opacity: 1, transform: "translateY(0) scale(1)" }
          ],
          {
            duration: 420,
            delay: delay,
            easing: "cubic-bezier(.2,.85,.25,1)",
            fill: "both"
          }
        ).finished.catch(() => {});
      });

      const clearAt = dragonDur + 520 + uiNodes.length * 90;
      setTimeout(() => {
        if (modal) modal.classList.remove("reveal-animating");
      }, clearAt);

      if (isMythic) spawnHatchParticles(10, true);
      else if (isLegendary) spawnHatchParticles(6, false);
      else if (isRare) spawnHatchParticles(4, false);
    }`,
  `      const finishPortraitStyles = (portrait) => {
        if (!portrait) return;
        portrait.style.opacity = "";
        portrait.style.transform = "";
        portrait.style.filter = "";
      };

      if (reduce) {
        playDragonRevealSound(rarity);
        const tasks = [];
        if (art && typeof art.animate === "function") {
          tasks.push(waitAnimation(art.animate(
            [
              { transform: "scale(0.88)", opacity: 0.6 },
              { transform: "scale(1)", opacity: 1 }
            ],
            { duration: dragonDur, easing: "ease-out", fill: "forwards" }
          )));
        }
        return Promise.all(tasks).then(() => {
          if (modal) modal.classList.remove("reveal-animating");
          document.querySelectorAll("#dragon-modal .dragon-reveal-ui").forEach((el) => {
            el.style.opacity = "";
            el.style.transform = "";
          });
        });
      }

      /* Force invisible before any frame paints */
      portraits.forEach((p) => {
        if (!p) return;
        p.style.opacity = "0";
        p.style.transform = "scale(0.65)";
      });

      if (modalInner && typeof modalInner.animate === "function") {
        modalInner.animate(
          [
            { transform: "scale(0.94) translateY(14px)", opacity: 0 },
            { transform: "scale(1.01) translateY(-2px)", opacity: 1, offset: 0.65 },
            { transform: "scale(1) translateY(0)", opacity: 1 }
          ],
          { duration: Math.min(700, dragonDur * 0.55), easing: "cubic-bezier(.2,.85,.25,1)" }
        );
      }

      if (ring && typeof ring.animate === "function") {
        ring.animate(
          [
            { opacity: 0, transform: "translate(-50%, -50%) scale(0.35)" },
            { opacity: 1, transform: "translate(-50%, -50%) scale(1.05)", offset: 0.35 },
            { opacity: 0.55, transform: "translate(-50%, -50%) scale(1.55)", offset: 0.7 },
            { opacity: 0, transform: "translate(-50%, -50%) scale(2.1)" }
          ],
          { duration: Math.round(dragonDur * 0.85), easing: "cubic-bezier(.15,.8,.25,1)", delay: 120 }
        );
      }

      if (flash && typeof flash.animate === "function") {
        flash.animate(
          [
            { opacity: 0, transform: "scale(0.5)" },
            { opacity: isMythic ? 1 : 0.85, transform: "scale(1.05)", offset: 0.25 },
            { opacity: 0, transform: "scale(1.35)" }
          ],
          { duration: isMythic ? 640 : 480, easing: "ease-out", delay: 160 }
        );
      }

      if (aura && typeof aura.animate === "function") {
        aura.animate(
          [
            { opacity: 0, transform: "scale(0.45)" },
            { opacity: 1, transform: "scale(1.12)", offset: 0.55 },
            { opacity: 1, transform: "scale(1)" }
          ],
          { duration: dragonDur * 0.9, easing: "cubic-bezier(.2,.85,.25,1)", delay: 140 }
        );
      }

      const portraitAnims = [];
      if (portraits.length) {
        const frames = [
          {
            transform: "scale(0.65)",
            opacity: 0,
            filter: "brightness(0.2) saturate(0.4) " + glow,
            offset: 0
          },
          {
            transform: "scale(0.72)",
            opacity: 0.1,
            filter: "brightness(0.45) saturate(0.55) " + glow,
            offset: 0.2
          },
          {
            transform: "scale(0.85)",
            opacity: 0.4,
            filter: "brightness(0.75) saturate(0.85) " + glow,
            offset: 0.45
          },
          {
            transform: "scale(1.04)",
            opacity: 0.75,
            filter: "brightness(1.2) saturate(1.1) " + glow,
            offset: 0.7
          },
          {
            transform: "scale(1.02)",
            opacity: 1,
            filter: "brightness(1.1) saturate(1.05) " + glow,
            offset: 0.9
          },
          {
            transform: "scale(1)",
            opacity: 1,
            filter: "brightness(1) saturate(1) " + glow,
            offset: 1
          }
        ];
        portraits.forEach((portrait) => {
          if (!portrait || typeof portrait.animate !== "function") return;
          const anim = portrait.animate(frames, {
            duration: dragonDur,
            easing: "cubic-bezier(.22,.75,.25,1)",
            delay: 0,
            fill: "forwards"
          });
          portraitAnims.push(
            waitAnimation(anim).then(() => finishPortraitStyles(portrait))
          );
        });
      }

      /* Rarity SFX ~250ms into materialize — not at magic start */
      const soundPromise = hatchDelay(soundAt, hatchFxToken).then((ok) => {
        if (ok) playDragonRevealSound(rarity);
      });

      if (art && typeof art.animate === "function") {
        art.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.02)", offset: 0.5 },
            { transform: "scale(1)" }
          ],
          {
            duration: Math.round(dragonDur * 0.55),
            delay: Math.max(280, Math.round(dragonDur * 0.55)),
            easing: "ease-in-out"
          }
        );
      }

      spawnDragonRevealSparks(sparksHost, rarity, isNew);

      const uiNodes = Array.prototype.slice.call(
        document.querySelectorAll("#dragon-modal .dragon-reveal-ui")
      );
      uiNodes.forEach((el, i) => {
        if (el.hidden) return;
        const delay = 420 + i * 110 + (isNew ? 40 : 0) + (isMythic ? 60 : 0);
        if (el.getAnimations) el.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) {} });
        el.animate(
          [
            { opacity: 0, transform: "translateY(16px) scale(0.96)" },
            { opacity: 1, transform: "translateY(0) scale(1)" }
          ],
          {
            duration: 520,
            delay: delay,
            easing: "cubic-bezier(.2,.85,.25,1)",
            fill: "both"
          }
        );
      });

      if (isMythic) spawnHatchParticles(10, true);
      else if (isLegendary) spawnHatchParticles(6, false);
      else if (isRare) spawnHatchParticles(4, false);

      const waitList = portraitAnims.length ? portraitAnims.slice() : [hatchDelay(dragonDur, hatchFxToken)];
      waitList.push(soundPromise);

      return Promise.all(waitList).then(() => {
        if (modal) modal.classList.remove("reveal-animating");
      });
    }`
);

mustReplace(
  "twin path",
  `          showTwinHatchBanner(() => {
            playDragonSummonEffect({ duration: HATCH_SEQUENCE_TIMINGS.twinSummonEffect }).then(() => {
              openRevealModal(pendingReveal);
              /* Popup via reveal — pas de 2e crack/hatch. */
            });
          });`,
  `          showTwinHatchBanner(() => {
            const TT = HATCH_SEQUENCE_TIMINGS;
            (async () => {
              await hatchDelay(TT.twinPause, hatchFxToken);
              await playDragonSummonEffect({ duration: TT.twinSummonEffect });
              await openRevealModal(pendingReveal);
              /* Pas de 2e crack/hatch — reveal lent du dragon 2 uniquement. */
            })();
          });`
);

fs.writeFileSync(path, s);
console.log("done, length", s.length);
