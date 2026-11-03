/* =========================================================
   Interactive layer
   - Magnetic buttons (hero buttons pull toward the cursor)
   - Hero 3D object: tilts with the cursor
   - Project detail panel: click any project card (or its "Details" link)
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
      var mbtn = e.target.closest(".media-btn[data-action]");
      if (mbtn && card.contains(mbtn)) {
        // Watch gameplay / Play in browser: open the project, then start that media inside the panel
        open(card);
        var want = mbtn.textContent.trim();
        Array.prototype.some.call(actionsEl.querySelectorAll("button.btn"), function (b) {
          if (b.textContent.trim() === want) { b.click(); return true; }
          return false;
        });
        return;
      }
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
      if (document.hidden || window.__introBusy) return;
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
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
