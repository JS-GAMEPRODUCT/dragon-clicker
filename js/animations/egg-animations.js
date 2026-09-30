/**
 * Egg click / charged / crack / shockwave helpers (visual only).
 * Always animate egg-click-wrapper / egg-hatch-wrapper — never carousel wrappers.
 */
(function (global) {
  "use strict";

  const DCAnim = global.DCAnim || (global.DCAnim = {});

  DCAnim.eggPressKeyframes = function eggPressKeyframes(kind, reduce) {
    if (reduce) {
      return {
        keyframes: [
          { transform: "scale(1) rotate(0deg)" },
          { transform: "scale(0.97) rotate(0deg)", offset: 0.45 },
          { transform: "scale(1) rotate(0deg)" }
        ],
        duration: 110
      };
    }
    if (kind === "chargedCrit") {
      return {
        keyframes: [
          { transform: "scale(1) rotate(0deg)" },
          { transform: "scale(0.90) rotate(-2.2deg)", offset: 0.28 },
          { transform: "scale(1.07) rotate(2deg)", offset: 0.62 },
          { transform: "scale(1) rotate(0deg)" }
        ],
        duration: 300
      };
    }
    if (kind === "charged") {
      return {
        keyframes: [
          { transform: "scale(1) rotate(0deg)" },
          { transform: "scale(0.92) rotate(-1.8deg)", offset: 0.3 },
          { transform: "scale(1.06) rotate(1.5deg)", offset: 0.65 },
          { transform: "scale(1) rotate(0deg)" }
        ],
        duration: 280
      };
    }
    if (kind === "crit") {
      return {
        keyframes: [
          { transform: "scale(1) rotate(0deg)" },
          { transform: "scale(0.93) rotate(-1.4deg)", offset: 0.3 },
          { transform: "scale(1.055) rotate(1.2deg)", offset: 0.62 },
          { transform: "scale(1) rotate(0deg)" }
        ],
        duration: 280
      };
    }
    /* normal click — soft squash + rebound */
    return {
      keyframes: [
        { transform: "scale(1) rotate(0deg)" },
        { transform: "scale(0.96) rotate(-1deg)", offset: 0.3 },
        { transform: "scale(1.045) rotate(1deg)", offset: 0.65 },
        { transform: "scale(1) rotate(0deg)" }
      ],
      duration: 160
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
