/**
 * Menu / HUD / shop / expedition visual feedback (no gameplay).
 */
(function (global) {
  "use strict";

  const DCAnim = global.DCAnim || (global.DCAnim = {});

  DCAnim.staggerCards = function staggerCards(panel) {
    if (!panel || (DCAnim.prefersReducedMotion && DCAnim.prefersReducedMotion())) return;
    const cards = panel.querySelectorAll(
      ".shop-item, .dragon-card, .achievement-card, .zone-card, .expedition-card, .egg-picker-card, .kingdom-stat-card"
    );
    const max = Math.min(cards.length, 9);
    for (let i = 0; i < max; i++) {
      const el = cards[i];
      el.classList.remove("dc-card-enter");
      el.style.animationDelay = (i * 28) + "ms";
      void el.offsetWidth;
      el.classList.add("dc-card-enter");
      clearTimeout(el._dcCardTimer);
      el._dcCardTimer = global.setTimeout(function () {
        el.classList.remove("dc-card-enter");
        el.style.animationDelay = "";
      }, 420 + i * 28);
    }
  };

  DCAnim.pulseHudGain = function pulseHudGain() {
    const el = document.querySelector(".essence-stat") ||
      document.querySelector(".hud-resource-card--essence");
    if (el) DCAnim.triggerClass(el, "anim-pulse", 200);
  };

  DCAnim.pulseHudSpend = function pulseHudSpend() {
    const el = document.querySelector(".essence-stat") ||
      document.querySelector(".hud-resource-card--essence");
    if (el) DCAnim.triggerClass(el, "anim-hud-spend", 220);
  };

  DCAnim.pulseHudPower = function pulseHudPower() {
    const el = document.querySelector(".hud-power-card") ||
      document.querySelector(".power-stat") ||
      document.querySelector(".hud-resource-card--power") ||
      document.getElementById("dragon-power-value");
    if (el) DCAnim.triggerClass(el, "anim-pulse", 180);
  };

  DCAnim.purchaseFlash = function purchaseFlash(card, atMax) {
    if (!card) return;
    DCAnim.triggerClass(card, atMax ? "anim-purchase-max" : "anim-purchase", atMax ? 420 : 300);
  };

  DCAnim.expeditionLaunchFx = function expeditionLaunchFx(card) {
    if (!card) return;
    DCAnim.triggerClass(card, "anim-exp-launch", 420);
  };

  DCAnim.expeditionClaimFx = function expeditionClaimFx(host) {
    if (!host) return;
    DCAnim.triggerClass(host, "anim-exp-claim", 480);
    const rewards = host.querySelectorAll(".expedition-reward-line, .expedition-result-line");
    rewards.forEach(function (el, i) {
      if (i > 6) return;
      el.classList.remove("dc-reward-enter");
      el.style.animationDelay = (i * 50) + "ms";
      void el.offsetWidth;
      el.classList.add("dc-reward-enter");
      clearTimeout(el._dcRewTimer);
      el._dcRewTimer = global.setTimeout(function () {
        el.classList.remove("dc-reward-enter");
        el.style.animationDelay = "";
      }, 500 + i * 50);
    });
  };

})(typeof window !== "undefined" ? window : this);
