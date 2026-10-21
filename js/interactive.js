/* =========================================================
   Interactive layer
   - Magnetic buttons (hero buttons pull toward the cursor)
   - Hero 3D object: tilts with the cursor
   - Project detail panel: click any project card (or its "Details" link)
   - Playground page: Scene Builder + Neon Collector mini-game
   Every block checks that its elements exist, so this one file is
   safe to load on every page.
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function $(id) { return document.getElementById(id); }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!fine || reduce) return;
    document.querySelectorAll(".hero-actions .btn, .magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.14;
        var y = (e.clientY - r.top - r.height / 2) * 0.2;
        b.style.translate = x + "px " + y + "px";
      });
      b.addEventListener("pointerleave", function () { b.style.translate = ""; });
    });
  }

  /* ---------- Hero 3D object ---------- */
  function initHeroObject() {
    var stage = document.querySelector(".hx-stage");
    var core = document.querySelector(".hx-core");
    if (!stage || !core || reduce || !fine) return;
    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      core.style.transform = "rotateY(" + (x * 34) + "deg) rotateX(" + (-y * 30) + "deg) translateZ(20px)";
    });
    stage.addEventListener("pointerleave", function () { core.style.transform = ""; });
  }

  /* ---------- Project detail panel ---------- */
  function initProjectPanel() {
    var cards = document.querySelectorAll(".card");
    if (!cards.length) return;

    // Capture each card's content up front (before the video/play buttons swap the thumbnail)
    var info = new Map();
    cards.forEach(function (card) {
      var q = function (s) { return card.querySelector(s); };
      var img = q(".card-thumb img");
      var label = q(".thumb-label");
      var title = q("h3");
      var desc = q(".card-body > p");
      info.set(card, {
        eyebrow: label ? label.textContent.trim() : "Project",
        title: title ? title.textContent.trim() : "Project",
        tags: Array.prototype.map.call(card.querySelectorAll(".card-meta .tag"), function (t) { return t.textContent.trim(); }),
        desc: desc ? desc.textContent.trim() : "",
        detail: card.getAttribute("data-detail") || "",
        gallery: (card.getAttribute("data-gallery") || "").split(",").filter(Boolean),
        img: img ? img.getAttribute("src") : "",
        media: Array.prototype.map.call(card.querySelectorAll(".media-btn[data-action]"), function (b) {
          return { action: b.dataset.action, src: b.dataset.src, text: b.textContent.trim() };
        }),
        links: Array.prototype.map.call(card.querySelectorAll(".card-links a"), function (a) {
          return { href: a.getAttribute("href"), text: a.textContent.trim(), download: a.hasAttribute("download"), external: a.getAttribute("target") === "_blank" };
        })
      });

      // A real button so keyboard users can open the panel too
      var links = q(".card-links");
      if (links) {
        var open = document.createElement("button");
        open.type = "button";
        open.className = "card-open";
        open.textContent = "Details ↗";
        open.setAttribute("aria-label", "Open details for " + info.get(card).title);
        links.insertBefore(open, links.firstChild);
      }
    });

    var modal = null, box, closeBtn, eyebrowEl, titleEl, tagsEl, mediaEl, descEl, detailEl, actionsEl, galleryEl;
    var lastFocus = null;

    function build() {
      modal = document.createElement("div");
      modal.className = "pm";
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML =
        '<div class="pm-box" role="dialog" aria-modal="true" aria-labelledby="pm-title">' +
        '<button class="pm-close" type="button" aria-label="Close">×</button>' +
        '<div class="pm-eyebrow"></div><h2 id="pm-title"></h2>' +
        '<div class="pm-tags"></div><div class="pm-media"></div>' +
        '<div class="pm-gallery"></div><p class="pm-desc"></p><p class="pm-detail"></p><div class="pm-actions"></div></div>';
      document.body.appendChild(modal);
      box = modal.querySelector(".pm-box");
      closeBtn = modal.querySelector(".pm-close");
      eyebrowEl = modal.querySelector(".pm-eyebrow");
      titleEl = modal.querySelector("h2");
      tagsEl = modal.querySelector(".pm-tags");
      mediaEl = modal.querySelector(".pm-media");
      descEl = modal.querySelector(".pm-desc");
      detailEl = modal.querySelector(".pm-detail");
      galleryEl = modal.querySelector(".pm-gallery");
      actionsEl = modal.querySelector(".pm-actions");
      closeBtn.addEventListener("click", close);
      modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    }

    function open(card) {
      var d = info.get(card);
      if (!d) return;
      if (!modal) build();
      lastFocus = document.activeElement;

      eyebrowEl.textContent = d.eyebrow;
      titleEl.textContent = d.title;
      descEl.textContent = d.desc;
      detailEl.textContent = d.detail;
      detailEl.style.display = d.detail ? "" : "none";

      tagsEl.innerHTML = "";
      d.tags.forEach(function (t) {
        var s = document.createElement("span");
        s.textContent = t;
        tagsEl.appendChild(s);
      });

      mediaEl.innerHTML = "";
      if (d.img) {
        var im = document.createElement("img");
        im.alt = d.title;
        im.onerror = function () { im.remove(); };
        im.src = d.img;
        mediaEl.appendChild(im);
      }

      galleryEl.innerHTML = "";
      if (d.gallery.length > 1) {
        d.gallery.forEach(function (src, i) {
          var t = document.createElement("button");
          t.type = "button";
          t.className = "pm-thumb";
          t.setAttribute("aria-label", "Show screenshot " + (i + 1));
          var ti = document.createElement("img");
          ti.src = src; ti.alt = "";
          t.appendChild(ti);
          t.addEventListener("click", function () {
            mediaEl.innerHTML = "";
            var big = document.createElement("img");
            big.alt = d.title + " screenshot " + (i + 1);
            big.src = src;
            mediaEl.appendChild(big);
          });
          galleryEl.appendChild(t);
        });
      }

      actionsEl.innerHTML = "";
      d.media.forEach(function (m) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.textContent = m.text;
        b.addEventListener("click", function () {
          mediaEl.innerHTML = "";
          var el;
          if (m.action === "video") {
            el = document.createElement("video");
            el.controls = true; el.autoplay = true; el.playsInline = true;
            el.src = m.src;
          } else {
            el = document.createElement("iframe");
            el.setAttribute("allow", "autoplay; fullscreen; gamepad");
            el.setAttribute("allowfullscreen", "");
            el.src = m.src;
          }
          mediaEl.appendChild(el);
        });
        actionsEl.appendChild(b);
      });
      d.links.forEach(function (l) {
        if (l.text === "Read more") return; // pointless inside the panel itself
        var a = document.createElement("a");
        a.className = "btn";
        a.href = l.href;
        a.textContent = l.text;
        if (l.download) a.setAttribute("download", "");
        if (l.external) { a.target = "_blank"; a.rel = "noopener"; }
        actionsEl.appendChild(a);
      });
      var back = document.createElement("button");
      back.type = "button";
      back.className = "btn";
      back.textContent = "Close";
      back.addEventListener("click", close);
      actionsEl.appendChild(back);

      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("pm-open");
      closeBtn.focus();
    }

    function close() {
      if (!modal || !modal.classList.contains("open")) return;
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("pm-open");
      mediaEl.innerHTML = ""; // stops any playing video / game
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener("click", function (e) {
      var card = e.target.closest && e.target.closest(".card");
      if (!card || !info.has(card)) return;
      var opener = e.target.closest(".card-open");
      if (!opener) {
        // leave links, other buttons and playing media alone
        if (e.target.closest("a, button, video, iframe")) return;
      }
      open(card);
    });

    document.addEventListener("keydown", function (e) {
      if (!modal || !modal.classList.contains("open")) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "Tab") {
        var f = box.querySelectorAll("button, a[href]");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Playground: Scene Builder ---------- */
  function initScene() {
    var world = $("scWorld");
    if (!world) return;
    var fog = $("scFog"), light = $("scLight");
    var rainBtn = $("scRain"), glowBtn = $("scGlow"), hero = $("scHero");

    var THEMES = {
      day: { label: "DAYLIGHT", title: "Sunny outpost", subtitle: "Daylight · clear atmosphere", badge: "SUNNY OUTPOST" },
      sunset: { label: "GOLDEN HOUR", title: "Sunset district", subtitle: "Golden hour · long shadows", badge: "SUNSET DISTRICT" },
      night: { label: "NIGHT MODE", title: "Neon after dark", subtitle: "Night · city lights online", badge: "NEON AFTER DARK" }
    };

    function setTheme(t) {
      var d = THEMES[t]; if (!d) return;
      world.dataset.theme = t;
      document.querySelectorAll("[data-sc-theme]").forEach(function (b) {
        b.classList.toggle("active", b.dataset.scTheme === t);
      });
      $("scThemeLabel").textContent = d.label;
      $("scTitle").textContent = d.title;
      $("scSub").textContent = d.subtitle;
      $("scBadge").textContent = d.badge;
    }
    function setSwitch(btn, key, on) {
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
      world.dataset[key] = on ? "on" : "off";
    }
    function setFog(v) {
      world.style.setProperty("--fog-level", (v / 100).toFixed(2));
      $("scFogVal").textContent = v + "%";
    }
    function setLight(v) {
      world.style.setProperty("--light-level", (v / 80).toFixed(2));
      $("scLightVal").textContent = v + "%";
    }

    document.querySelectorAll("[data-sc-theme]").forEach(function (b) {
      b.addEventListener("click", function () { setTheme(b.dataset.scTheme); });
    });
    rainBtn.addEventListener("click", function () { setSwitch(rainBtn, "rain", !rainBtn.classList.contains("active")); });
    glowBtn.addEventListener("click", function () { setSwitch(glowBtn, "glow", !glowBtn.classList.contains("active")); });
    fog.addEventListener("input", function () { setFog(+fog.value); });
    light.addEventListener("input", function () { setLight(+light.value); });

    $("scReset").addEventListener("click", function () {
      setTheme("day");
      setSwitch(rainBtn, "rain", false);
      setSwitch(glowBtn, "glow", true);
      fog.value = 12; light.value = 80;
      setFog(12); setLight(80);
      hero.style.left = "48%";
    });

    // click anywhere in the scene to walk the character there
    world.addEventListener("click", function (e) {
      if (e.target.closest(".sc-badge, .sc-bottom")) return;
      var r = world.getBoundingClientRect();
      var pct = Math.max(7, Math.min(93, ((e.clientX - r.left) / r.width) * 100));
      hero.style.left = pct + "%";
    });
  }

  /* ---------- Playground: Neon Collector mini-game ---------- */
  function initGame() {
    var arena = $("mgArena");
    if (!arena) return;
    var player = $("mgPlayer"), overlay = $("mgOverlay");
    var scoreEl = $("mgScore"), statusEl = $("mgStatus");
    var ovTitle = $("mgOvTitle"), ovText = $("mgOvText"), startBtn = $("mgStart"), resetBtn = $("mgReset");

    var SPOTS = [[18, 24], [76, 22], [29, 72], [76, 70], [51, 43]];
    var SPEED = 48; // % of the arena per second
    var DEFAULT_TEXT = "Collect all five energy orbs to activate the portal. A tiny example of a playable moment inside a portfolio.";

    var running = false, done = false, collected = 0, coins = [];
    var pos = { x: 50, y: 50 }, angle = 0, target = null, keys = {};
    var t0 = 0, last = 0, raf = 0;

    function showOverlay(title, text, btn) {
      ovTitle.textContent = title;
      ovText.textContent = text;
      startBtn.textContent = btn;
      overlay.classList.remove("hidden");
    }
    function drawPlayer() {
      player.style.left = pos.x + "%";
      player.style.top = pos.y + "%";
      player.style.transform = "translate(-50%, -50%) rotate(" + angle + "deg)";
    }
    function renderCoins() {
      arena.querySelectorAll(".mg-coin").forEach(function (c) { c.remove(); });
      coins = SPOTS.map(function (p) {
        var el = document.createElement("i");
        el.className = "mg-coin";
        el.style.left = p[0] + "%";
        el.style.top = p[1] + "%";
        arena.appendChild(el);
        return { el: el, x: p[0], y: p[1], got: false };
      });
    }
    function reset() {
      cancelAnimationFrame(raf);
      running = false; done = false; collected = 0; angle = 0; target = null;
      pos = { x: 50, y: 50 };
      drawPlayer();
      scoreEl.textContent = "00 / 05";
      statusEl.textContent = "READY";
      showOverlay("Can you collect them all?", DEFAULT_TEXT, "Start demo ▷");
      renderCoins();
    }
    function start() {
      if (done) reset();
      running = true;
      overlay.classList.add("hidden");
      statusEl.textContent = "RUNNING";
      t0 = performance.now();
      last = 0;
      arena.focus({ preventScroll: true });
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
    function finish() {
      running = false; done = true;
      var secs = ((performance.now() - t0) / 1000).toFixed(1);
      statusEl.textContent = "COMPLETE";
      showOverlay("Portal activated ✦", "All five orbs collected in " + secs + "s. Imagine this grown into a short playable level.", "Play again ↻");
    }

    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;

      var dx = 0, dy = 0;
      if (keys.arrowleft || keys.a) dx -= 1;
      if (keys.arrowright || keys.d) dx += 1;
      if (keys.arrowup || keys.w) dy -= 1;
      if (keys.arrowdown || keys.s) dy += 1;
      if (!dx && !dy && target) { // pointer / touch steering
        var tx = target.x - pos.x, ty = target.y - pos.y;
        if (Math.hypot(tx, ty) > 1.4) { dx = tx; dy = ty; }
      }
      var len = Math.hypot(dx, dy);
      if (len > 0) {
        pos.x = Math.max(3, Math.min(97, pos.x + (dx / len) * SPEED * dt));
        pos.y = Math.max(5, Math.min(90, pos.y + (dy / len) * SPEED * dt));
        angle = Math.atan2(dx, -dy) * 180 / Math.PI;
      }
      drawPlayer();

      coins.forEach(function (c) {
        if (!c.got && Math.hypot(pos.x - c.x, pos.y - c.y) < 5) {
          c.got = true;
          c.el.classList.add("got");
          setTimeout(function () { c.el.style.display = "none"; }, 350);
          collected++;
          scoreEl.textContent = (collected < 10 ? "0" : "") + collected + " / 05";
          statusEl.textContent = "ORB ACQUIRED";
        }
      });
      if (collected === SPOTS.length) { finish(); return; }
      raf = requestAnimationFrame(frame);
    }

    var MOVE_KEYS = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
    window.addEventListener("keydown", function (e) {
      var k = e.key.toLowerCase();
      if (MOVE_KEYS.indexOf(k) === -1) return;
      keys[k] = true;
      if (running) e.preventDefault(); // stop the page scrolling while playing
    });
    window.addEventListener("keyup", function (e) { keys[e.key.toLowerCase()] = false; });
    window.addEventListener("blur", function () { keys = {}; });

    function setTarget(e) {
      var r = arena.getBoundingClientRect();
      target = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
    }
    arena.addEventListener("pointerdown", function (e) {
      if (!running) return;
      setTarget(e);
      try { arena.setPointerCapture(e.pointerId); } catch (err) {}
    });
    arena.addEventListener("pointermove", function (e) { if (target && running) setTarget(e); });
    arena.addEventListener("pointerup", function () { target = null; });
    arena.addEventListener("pointercancel", function () { target = null; });

    startBtn.addEventListener("click", start);
    resetBtn.addEventListener("click", reset);
    reset();
  }

  /* ---------- Background particle network (reference style) ---------- */
  function initNetwork() {
    if (reduce) return;
    var cv = document.createElement("canvas");
    cv.id = "particles";
    cv.setAttribute("aria-hidden", "true");
    document.body.insertBefore(cv, document.body.firstChild);
    var ctx = cv.getContext("2d");
    if (!ctx) return;
    var W = 0, H = 0, dots = [], mx = -999, my = -999;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(90, Math.floor(W * H / 16000));
      dots = [];
      for (var i = 0; i < n; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 });
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    function frame() {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d;
      for (i = 0; i < dots.length; i++) {
        a = dots[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        ctx.fillStyle = "rgba(166,255,203,0.55)";
        ctx.fillRect(a.x, a.y, 1.8, 1.8);
        for (j = i + 1; j < dots.length; j++) {
          b = dots[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
          if (d < 14000) { ctx.strokeStyle = "rgba(166,255,203," + (0.11 * (1 - d / 14000)) + ")"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        dx = a.x - mx; dy = a.y - my; d = dx * dx + dy * dy;
        if (d < 22000) { ctx.strokeStyle = "rgba(102,232,255," + (0.28 * (1 - d / 22000)) + ")"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke(); }
      }
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    initNetwork();
    initMagnetic();
    initHeroObject();
    initProjectPanel();
    initScene();
    initGame();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
