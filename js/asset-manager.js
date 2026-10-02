/**
 * Dragon Clicker — gestionnaire d'assets session.
 * Cache single-flight + préchargement idle (requestIdleCallback).
 * Aucune donnée de sauvegarde : cache mémoire de session uniquement.
 */
"use strict";

(function (global) {
  const cache = new Map();
  const ready = new Set();
  let idleHandle = null;
  let idleQueue = [];
  let idleRunning = false;

  function normalizePath(path) {
    if (!path) return "";
    return String(path);
  }

  function isLoaded(path) {
    return ready.has(normalizePath(path));
  }

  function loadImage(path) {
    const key = normalizePath(path);
    if (!key) return Promise.reject(new Error("empty asset path"));

    const existing = cache.get(key);
    if (existing) return existing.promise;

    const img = new Image();
    img.decoding = "async";
    const entry = { img: img, status: "loading", promise: null };

    entry.promise = new Promise(function (resolve, reject) {
      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        entry.status = "ready";
        ready.add(key);
        resolve(img);
      }
      function fail(err) {
        if (settled) return;
        settled = true;
        entry.status = "error";
        cache.delete(key);
        reject(err || new Error("asset load failed: " + key));
      }

      img.onload = function () {
        if (typeof img.decode === "function") {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      };
      img.onerror = function () {
        fail();
      };

      try {
        img.src = key;
        if (img.complete && img.naturalWidth > 0) {
          img.onload = null;
          if (typeof img.decode === "function") {
            img.decode().then(done).catch(done);
          } else {
            done();
          }
        }
      } catch (e) {
        fail(e);
      }
    });

    cache.set(key, entry);
    return entry.promise;
  }

  function preloadImages(paths) {
    var list = (paths || []).filter(Boolean);
    return Promise.all(
      list.map(function (p) {
        return loadImage(p).catch(function () {
          return null;
        });
      })
    );
  }

  function scheduleIdle(fn) {
    if (typeof requestIdleCallback === "function") {
      return requestIdleCallback(fn, { timeout: 1500 });
    }
    return setTimeout(function () {
      fn({ timeRemaining: function () { return 8; }, didTimeout: true });
    }, 50);
  }

  function cancelIdle(id) {
    if (id == null) return;
    if (typeof cancelIdleCallback === "function") {
      try {
        cancelIdleCallback(id);
      } catch (e) { /* ignore */ }
    }
    clearTimeout(id);
  }

  function startIdlePump() {
    if (idleRunning || !idleQueue.length) return;
    idleRunning = true;
    idleHandle = scheduleIdle(pumpIdle);
  }

  function pumpIdle(deadline) {
    idleRunning = false;
    idleHandle = null;
    var budget =
      deadline && typeof deadline.timeRemaining === "function"
        ? deadline.timeRemaining()
        : 8;
    var batch = budget > 12 ? 4 : budget > 5 ? 3 : 2;
    batch = Math.max(1, Math.min(4, batch));
    var slice = idleQueue.splice(0, batch);
    if (!slice.length) return;
    Promise.all(
      slice.map(function (p) {
        return loadImage(p).catch(function () {
          return null;
        });
      })
    ).then(function () {
      if (idleQueue.length) startIdlePump();
    });
  }

  function preloadIdle(paths) {
    var seen = Object.create(null);
    (paths || []).forEach(function (p) {
      var key = normalizePath(p);
      if (!key || seen[key] || ready.has(key)) return;
      if (cache.has(key)) return;
      seen[key] = true;
      idleQueue.push(key);
    });
    startIdlePump();
  }

  function prioritize(paths) {
    var keys = (paths || []).map(normalizePath).filter(Boolean);
    if (!keys.length) return;
    var front = [];
    var seen = Object.create(null);
    keys.forEach(function (k) {
      if (seen[k] || ready.has(k)) return;
      seen[k] = true;
      front.push(k);
    });
    idleQueue = front.concat(
      idleQueue.filter(function (p) {
        return !seen[p];
      })
    );
    startIdlePump();
  }

  function stopIdle() {
    cancelIdle(idleHandle);
    idleHandle = null;
    idleRunning = false;
  }

  global.DCAssets = {
    loadImage: loadImage,
    preloadImage: loadImage,
    preloadImages: preloadImages,
    preloadCritical: preloadImages,
    preloadIdle: preloadIdle,
    prioritize: prioritize,
    isLoaded: isLoaded,
    stopIdle: stopIdle,
    getStats: function () {
      return {
        ready: ready.size,
        inflight: Math.max(0, cache.size - ready.size),
        idleQueued: idleQueue.length
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
