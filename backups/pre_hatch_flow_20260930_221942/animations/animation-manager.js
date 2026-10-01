/**
 * Dragon Clicker — Animation manager (visual only)
 * Central helpers: reduced-motion, mobile scale, cancel/wait, DOM fx pools.
 */
(function (global) {
  "use strict";

  const DCAnim = global.DCAnim || (global.DCAnim = {});

  DCAnim.prefersReducedMotion = function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };

  DCAnim.isMobileFx = function isMobileFx() {
    return global.innerWidth <= 799 ||
      !!(global.matchMedia && global.matchMedia("(max-width: 768px)").matches);
  };

  /** 0 = almost none, 1 = full. Mobile + reduced motion lower the budget. */
  DCAnim.fxScale = function fxScale() {
    if (DCAnim.prefersReducedMotion()) return 0.15;
    if (DCAnim.isMobileFx()) return 0.65;
    return 1;
  };

  DCAnim.safeCancel = function safeCancel(anim) {
    if (!anim) return;
    try { anim.cancel(); } catch (e) { /* ignore */ }
  };

  DCAnim.waitAnim = function waitAnim(anim) {
    if (!anim || !anim.finished) return Promise.resolve();
    return anim.finished.catch(function () { /* cancelled */ });
  };

  DCAnim.pruneList = function pruneList(list, max) {
    if (!list) return;
    while (list.length >= max) {
      const old = list.shift();
      if (old && old.parentNode) old.remove();
    }
  };

  DCAnim.scheduleRemove = function scheduleRemove(list, el, ms) {
    global.setTimeout(function () {
      if (list) {
        const i = list.indexOf(el);
        if (i >= 0) list.splice(i, 1);
      }
      if (el && el.parentNode) el.remove();
    }, ms);
  };

  DCAnim.triggerClass = function triggerClass(el, className, ms) {
    if (!el || DCAnim.prefersReducedMotion()) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
    clearTimeout(el._dcAnimTimer);
    el._dcAnimTimer = global.setTimeout(function () {
      el.classList.remove(className);
    }, ms || 320);
  };

  /** Particle / float budgets by intensity tier */
  DCAnim.budgets = {
    click: { particles: 2, mobile: 1 },
    crit: { particles: 5, mobile: 3 },
    charged: { particles: 7, mobile: 4 },
    chargedCrit: { particles: 10, mobile: 5 },
    hatch: { particles: 12, mobile: 6 },
    mythic: { particles: 18, mobile: 8 }
  };

  DCAnim.particleCount = function particleCount(tier) {
    const b = DCAnim.budgets[tier] || DCAnim.budgets.click;
    const scale = DCAnim.fxScale();
    if (scale < 0.2) return 0;
    const base = DCAnim.isMobileFx() ? b.mobile : b.particles;
    return Math.max(0, Math.round(base * scale));
  };

})(typeof window !== "undefined" ? window : this);
