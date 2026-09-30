/**
 * Lightweight canvas particle layer (transform/opacity equivalent via rAF).
 * Never accumulates unbounded DOM nodes.
 */
(function (global) {
  "use strict";

  const DCAnim = global.DCAnim || (global.DCAnim = {});
  const MAX_PARTICLES = 64;
  const pool = [];
  let canvas = null;
  let ctx = null;
  let rafId = 0;
  let attached = false;

  function ensureCanvas() {
    if (canvas && canvas.parentNode) return canvas;
    canvas = document.getElementById("dc-fx-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "dc-fx-canvas";
      canvas.className = "dc-fx-canvas";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext("2d", { alpha: true });
    resize();
    if (!attached) {
      attached = true;
      global.addEventListener("resize", resize, { passive: true });
    }
    return canvas;
  }

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    const w = global.innerWidth;
    const h = global.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function acquire() {
    return pool.length ? pool.pop() : {
      x: 0, y: 0, vx: 0, vy: 0, life: 0, lifeMax: 1,
      r: 3, color: "#ffb347", alpha: 1, drag: 0.96
    };
  }

  function release(p) {
    if (pool.length < MAX_PARTICLES) pool.push(p);
  }

  const live = [];

  function tick(now) {
    rafId = 0;
    if (!ctx || !live.length) return;
    const w = global.innerWidth;
    const h = global.innerHeight;
    ctx.clearRect(0, 0, w, h);
    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i];
      const t = (now - p.born) / p.lifeMax;
      if (t >= 1) {
        live.splice(i, 1);
        release(p);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy -= 0.04;
      const a = (1 - t) * p.alpha;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, a);
      ctx.arc(p.x, p.y, p.r * (1 - t * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (live.length) {
      rafId = global.requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }

  function kick() {
    if (!rafId) rafId = global.requestAnimationFrame(tick);
  }

  /**
   * @param {number} x - clientX
   * @param {number} y - clientY
   * @param {object} opts - { count, color, speed, size, life, palette }
   */
  DCAnim.burst = function burst(x, y, opts) {
    opts = opts || {};
    if (DCAnim.prefersReducedMotion && DCAnim.prefersReducedMotion()) return;
    ensureCanvas();
    let count = opts.count != null ? opts.count : 4;
    count = Math.min(count, MAX_PARTICLES - live.length);
    if (count <= 0) return;
    const palette = opts.palette || [opts.color || "#ffb347", "#ffe29a", "#ff8c42"];
    const speed = opts.speed != null ? opts.speed : 2.8;
    const size = opts.size != null ? opts.size : 3.2;
    const life = opts.life != null ? opts.life : 480;
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      const p = acquire();
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.55;
      const dist = speed * (0.55 + Math.random());
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * dist * 1.8;
      p.vy = Math.sin(angle) * dist * 1.8 - 0.6;
      p.r = size * (0.7 + Math.random() * 0.6);
      p.color = palette[i % palette.length];
      p.alpha = opts.alpha != null ? opts.alpha : 0.95;
      p.lifeMax = life * (0.75 + Math.random() * 0.4);
      p.born = now;
      p.drag = 0.94 + Math.random() * 0.03;
      live.push(p);
    }
    kick();
  };

  DCAnim.clearParticles = function clearParticles() {
    live.length = 0;
    if (ctx) ctx.clearRect(0, 0, global.innerWidth, global.innerHeight);
  };

  DCAnim.initParticles = function initParticles() {
    ensureCanvas();
  };

})(typeof window !== "undefined" ? window : this);
