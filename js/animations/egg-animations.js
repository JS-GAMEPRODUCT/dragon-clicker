/**
 * Egg click / charged / crack / shockwave helpers (visual only).
 * Always animate egg-click-wrapper / egg-hatch-wrapper — never carousel wrappers.
 */
(function (global) {
  "use strict";

  const DCAnim = global.DCAnim || (global.DCAnim = {});

  /**
   * Click feedback keyframes — MUST stay ≤110ms so 7–8 CPS can retrigger every tap.
   * Applied on #egg-visual only (never carousel slot / hatch soft-pulse wrapper).
   */
  DCAnim.eggPressKeyframes = function eggPressKeyframes(kind, reduce) {
    if (reduce) {
      return {
        keyframes: [
          { transform: "scale3d(1, 1, 1)" },
          { transform: "scale3d(0.97, 0.97, 1)", offset: 0.45 },
          { transform: "scale3d(1, 1, 1)" }
        ],
        duration: 80
      };
    }
    if (kind === "chargedCrit") {
      return {
        keyframes: [
          { transform: "scale3d(1, 1, 1)" },
          { transform: "scale3d(0.92, 0.92, 1)", offset: 0.35 },
          { transform: "scale3d(1.03, 1.03, 1)", offset: 0.7 },
          { transform: "scale3d(1, 1, 1)" }
        ],
        duration: 105
      };
    }
    if (kind === "charged" || kind === "crit") {
      return {
        keyframes: [
          { transform: "scale3d(1, 1, 1)" },
          { transform: "scale3d(0.94, 0.94, 1)", offset: 0.35 },
          { transform: "scale3d(1.025, 1.025, 1)", offset: 0.7 },
          { transform: "scale3d(1, 1, 1)" }
        ],
        duration: 100
      };
    }
    /* normal — squash + light rebound */
    return {
      keyframes: [
        { transform: "scale3d(1, 1, 1)" },
        { transform: "scale3d(0.95, 0.95, 1)", offset: 0.4 },
        { transform: "scale3d(1, 1, 1)" }
      ],
      duration: 90
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
