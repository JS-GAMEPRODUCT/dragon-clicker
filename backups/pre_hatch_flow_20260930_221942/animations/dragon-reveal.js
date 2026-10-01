/**
 * Rarity-tuned reveal timing presets (visual only).
 */
(function (global) {
  "use strict";

  const DCAnim = global.DCAnim || (global.DCAnim = {});

  DCAnim.revealTiming = function revealTiming(rarity, isNew) {
    const reduce = DCAnim.prefersReducedMotion && DCAnim.prefersReducedMotion();
    const r = rarity || "common";
    let dur;
    if (r === "mythic" || r === "divine") dur = 1200;
    else if (r === "legendary") dur = 700;
    else if (r === "rare" || r === "epic") dur = 450;
    else dur = 320;

    if (!isNew) dur = Math.round(dur * 0.72);
    if (reduce) dur = Math.min(dur, 280);

    return {
      duration: dur,
      isMythic: r === "mythic" || r === "divine",
      isLegendary: r === "legendary",
      isRare: r === "rare" || r === "epic",
      dimScreen: (r === "mythic" || r === "divine") && !reduce,
      sparkTier: (r === "mythic" || r === "divine") ? "mythic"
        : r === "legendary" ? "hatch"
        : (r === "rare" || r === "epic") ? "crit"
        : "click"
    };
  };

})(typeof window !== "undefined" ? window : this);
