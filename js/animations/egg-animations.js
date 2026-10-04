/**
 * Egg click / charged / crack / shockwave helpers (visual only).
 * Always animate egg-click-wrapper / egg-hatch-wrapper — never carousel wrappers.
 */
(function (global) {
  "use strict";

  const DCAnim = global.DCAnim || (global.DCAnim = {});

  /**
   * Click feedback keyframes — durée courte (≤130ms) pour 7–8 CPS.
   * Desktop : amplitude douce. Mobile : amplitude marquée (inchangée).
   * Applied on #egg-click-wrapper only (never carousel / size / visual-inner).
   */
  DCAnim.eggPressKeyframes = function eggPressKeyframes(kind, reduce) {
    const mobile = !!(DCAnim.isMobileFx && DCAnim.isMobileFx());
    /*
      Paramètres par plateforme — même pipeline, amplitudes différentes.
      Mobile : squash fort + dip lisible. Desktop : plus discret.
    */
    const amp = mobile
      ? {
          dip: 10,
          dipCrit: 11,
          dipCombo: 12,
          reboundY: -3,
          minScale: 0.86,
          minScaleCrit: 0.85,
          minScaleCombo: 0.84,
          bounce: 1.05,
          bounceCrit: 1.055,
          bounceCombo: 1.06
        }
      : {
          dip: 3,
          dipCrit: 3.5,
          dipCombo: 4,
          reboundY: -1,
          minScale: 0.95,
          minScaleCrit: 0.94,
          minScaleCombo: 0.93,
          bounce: 1.01,
          bounceCrit: 1.015,
          bounceCombo: 1.02
        };

    const dur = mobile ? 130 : 110;
    if (reduce) {
      return {
        keyframes: [
          { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" },
          { transform: "translate3d(0, " + (mobile ? 4 : 2) + "px, 0) scale3d(" + (mobile ? 0.94 : 0.97) + ", " + (mobile ? 0.94 : 0.97) + ", 1)", offset: 0.45 },
          { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" }
        ],
        duration: mobile ? 100 : 90
      };
    }
    if (kind === "chargedCrit") {
      return {
        keyframes: [
          { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" },
          { transform: "translate3d(0, " + amp.dipCombo + "px, 0) scale3d(" + amp.minScaleCombo + ", " + amp.minScaleCombo + ", 1)", offset: 0.35 },
          { transform: "translate3d(0, " + amp.reboundY + "px, 0) scale3d(" + amp.bounceCombo + ", " + amp.bounceCombo + ", 1)", offset: 0.7 },
          { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" }
        ],
        duration: mobile ? 145 : 125
      };
    }
    if (kind === "charged" || kind === "crit") {
      return {
        keyframes: [
          { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" },
          { transform: "translate3d(0, " + amp.dipCrit + "px, 0) scale3d(" + amp.minScaleCrit + ", " + amp.minScaleCrit + ", 1)", offset: 0.35 },
          { transform: "translate3d(0, " + amp.reboundY + "px, 0) scale3d(" + amp.bounceCrit + ", " + amp.bounceCrit + ", 1)", offset: 0.7 },
          { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" }
        ],
        duration: mobile ? 135 : 115
      };
    }
    /* normal — squash + dip + rebound */
    return {
      keyframes: [
        { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" },
        { transform: "translate3d(0, " + amp.dip + "px, 0) scale3d(" + amp.minScale + ", " + amp.minScale + ", 1)", offset: 0.35 },
        { transform: "translate3d(0, " + amp.reboundY + "px, 0) scale3d(" + amp.bounce + ", " + amp.bounce + ", 1)", offset: 0.7 },
        { transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)" }
      ],
      duration: dur
    };
  };

  /**
   * Circular shockwave (radial only — never a rectangle).
   * @param {HTMLElement} host - usually #click-zone
   * @param {number} localX
   * @param {number} localY
   * @param {string} cls - shockwave | shockwave-charged | shockwave-crit
   */
  DCAnim.spawnShockwave = function spawnShockwave(host, localX, localY, cls) {
    if (!host || (DCAnim.prefersReducedMotion && DCAnim.prefersReducedMotion())) return;
    const el = document.createElement("div");
    el.className = "dc-shockwave " + (cls || "shockwave");
    el.style.left = localX + "px";
    el.style.top = localY + "px";
    host.appendChild(el);
    global.setTimeout(function () {
      if (el.parentNode) el.remove();
    }, 420);
  };

  /** Soft charged-aura state on #entity-wrap (radial glow only). */
  DCAnim.setChargedAura = function setChargedAura(active, intense) {
    const wrap = document.getElementById("entity-wrap");
    if (!wrap) return;
    wrap.classList.toggle("charged-aura", !!active);
    wrap.classList.toggle("charged-aura-hot", !!(active && intense));
  };

  /**
   * Short crack-stage crossfade: flash + micro shake on hatch wrapper, then swap.
   * @param {Function} applyNew - callback that swaps the image
   */
  DCAnim.playCrackTransition = function playCrackTransition(applyNew) {
    const hatch = document.getElementById("egg-hatch-wrapper");
    const glow = document.querySelector("#entity-wrap > .egg-glow");
    const reduce = DCAnim.prefersReducedMotion && DCAnim.prefersReducedMotion();

    if (reduce || !hatch || typeof hatch.animate !== "function") {
      if (typeof applyNew === "function") applyNew();
      return;
    }

    const flash = glow && typeof glow.animate === "function"
      ? glow.animate(
        [
          { opacity: 0.45, filter: "brightness(1)" },
          { opacity: 0.95, filter: "brightness(1.55)" },
          { opacity: 0.5, filter: "brightness(1)" }
        ],
        { duration: 180, easing: "ease-out" }
      )
      : null;

    const shake = hatch.animate(
      [
        { transform: "translate(0,0) rotate(0deg)" },
        { transform: "translate(-2px,0) rotate(-0.8deg)", offset: 0.35 },
        { transform: "translate(2px,0) rotate(0.8deg)", offset: 0.65 },
        { transform: "translate(0,0) rotate(0deg)" }
      ],
      { duration: 200, easing: "ease-in-out" }
    );

    global.setTimeout(function () {
      if (typeof applyNew === "function") applyNew();
    }, 90);

    DCAnim.waitAnim(shake).then(function () {
      if (hatch) {
        hatch.style.transform = "";
      }
    });
    if (flash) DCAnim.waitAnim(flash);
  };

})(typeof window !== "undefined" ? window : this);
