/* =========================================================
   Game VFX
   - Particle canvas: floating energy motes, cursor spark trail,
     click shockwave + burst (additive "glow" blending like game VFX)
   - 3D tilt + glare on project cards
   - XP-style scroll progress bar
   Nothing here is required for the site to work: every effect
   is skipped for visitors who prefer reduced motion.
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- XP-style scroll bar ---------- */
  function initXP() {
    var bar = document.createElement("div");
    bar.className = "xp-bar";
    bar.innerHTML = "<i></i>";
    document.body.appendChild(bar);
    var fill = bar.firstChild;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = "scaleX(" + p + ")";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Card tilt + glare ---------- */
  function initTilt() {
    if (!fine || reduce) return;
    document.querySelectorAll(".card").forEach(function (card) {
      // after the entrance animation, let tilt respond instantly (see .card.settled in CSS)
      setTimeout(function () { card.classList.add("settled"); }, 1800);
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (py - 0.5) * -9;
        var ry = (px - 0.5) * 9;
        var ang = Math.sqrt(rx * rx + ry * ry);
        card.style.setProperty("rotate", ang < 0.01 ? "none" : rx + " " + ry + " 0 " + ang + "deg");
        card.style.setProperty("--gx", (px * 100) + "%");
        card.style.setProperty("--gy", (py * 100) + "%");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("rotate", "none");
      });
    });
  }

  /* ---------- Particle canvas ---------- */
  function initParticles() {
    if (reduce) return;
    var cv = document.createElement("canvas");
    cv.id = "fx";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0;
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // Pre-rendered soft glow sprites (mint, cyan, violet, white)
    var COLORS = [[166, 255, 203], [102, 232, 255], [159, 133, 255], [234, 242, 240]];
    var sprites = COLORS.map(function (c) {
      var s = document.createElement("canvas");
      s.width = s.height = 64;
      var g = s.getContext("2d");
      var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      var rgb = c[0] + "," + c[1] + "," + c[2];
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.18, "rgba(" + rgb + ",0.9)");
      gr.addColorStop(0.5, "rgba(" + rgb + ",0.28)");
      gr.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
      return s;
    });

    var parts = [];   // sparks + burst particles
    var rings = [];   // shockwave rings
    var motes = [];   // ambient floating energy motes
    var mx = -999, my = -999, lastX = -999, lastY = -999;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function pickColor() { var r = Math.random(); return r < 0.45 ? 0 : r < 0.75 ? 1 : r < 0.92 ? 2 : 3; }

    function makeMote(initial) {
      return {
        x: rnd(0, W),
        y: initial ? rnd(0, H) : H + rnd(10, 60),
        vy: -rnd(0.25, 0.8),
        s: rnd(8, 22),
        f: rnd(0.6, 1.6),
        ph: rnd(0, 6.28),
        ci: pickColor()
      };
    }
    var moteCount = fine ? 38 : 16;
    for (var i = 0; i < moteCount; i++) motes.push(makeMote(true));

    function emit(x, y, vx, vy, life, size, ci, drag, grav) {
      if (parts.length > 600) parts.shift();
      parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, size: size, ci: ci, drag: drag || 0.96, grav: grav || 0 });
    }

    // Cursor spark trail (mouse only)
    if (fine) {
      window.addEventListener("pointermove", function (e) {
        mx = e.clientX; my = e.clientY;
        var dx = mx - lastX, dy = my - lastY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (lastX < -500) { lastX = mx; lastY = my; return; }
        var n = Math.min(3, Math.floor(dist / 14));
        for (var k = 0; k < n; k++) {
          var t = k / Math.max(1, n);
          emit(lastX + dx * t, lastY + dy * t,
               rnd(-0.6, 0.6) + dx * 0.02, rnd(-0.6, 0.6) + dy * 0.02,
               rnd(0.45, 0.9), rnd(10, 22), (Math.floor(performance.now() / 350)) % 3, 0.94, 0.02);
        }
        if (n > 0) { lastX = mx; lastY = my; }
      }, { passive: true });
    }

    // Click: shockwave ring + particle burst
    window.addEventListener("pointerdown", function (e) {
      var x = e.clientX, y = e.clientY, i;
      rings.push({ x: x, y: y, life: 0.55, max: 0.55, size: 110, ci: 0 });
      rings.push({ x: x, y: y, life: 0.4, max: 0.4, size: 60, ci: 3 });
      for (i = 0; i < 28; i++) {
        var a = rnd(0, 6.283), sp = rnd(1.5, 6.5);
        emit(x, y, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.5, 1.1), rnd(14, 28), pickColor(), 0.93, 0.05);
      }
    }, { passive: true });

    var last = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      var k60 = dt * 60;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // ambient motes drifting upward, gently pulled toward the cursor
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y += m.vy * k60;
        m.x += Math.sin(now / 1000 * m.f + m.ph) * 0.3 * k60;
        if (fine) {
          var ddx = mx - m.x, ddy = my - m.y;
          if (ddx * ddx + ddy * ddy < 22000) { m.x += ddx * 0.012 * k60; m.y += ddy * 0.012 * k60; }
        }
        if (m.y < -30) { motes[i] = makeMote(false); continue; }
        ctx.globalAlpha = 0.22 + 0.2 * Math.sin(now / 700 * m.f + m.ph);
        ctx.drawImage(sprites[m.ci], m.x - m.s / 2, m.y - m.s / 2, m.s, m.s);
      }

      // sparks + burst particles
      for (var j = parts.length - 1; j >= 0; j--) {
        var p = parts[j];
        p.life -= dt;
        if (p.life <= 0) { parts.splice(j, 1); continue; }
        var drag = Math.pow(p.drag, k60);
        p.vx *= drag; p.vy *= drag;
        p.vy += p.grav * k60;
        p.x += p.vx * k60; p.y += p.vy * k60;
        var kf = p.life / p.max;
        var sz = p.size * (0.35 + 0.65 * kf);
        ctx.globalAlpha = kf * kf;
        ctx.drawImage(sprites[p.ci], p.x - sz / 2, p.y - sz / 2, sz, sz);
      }

      // shockwave rings
      for (var q = rings.length - 1; q >= 0; q--) {
        var rg = rings[q];
        rg.life -= dt;
        if (rg.life <= 0) { rings.splice(q, 1); continue; }
        var prog = 1 - rg.life / rg.max;
        var c = COLORS[rg.ci];
        ctx.globalAlpha = (1 - prog) * 0.9;
        ctx.strokeStyle = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
        ctx.lineWidth = 3 * (1 - prog) + 0.5;
        ctx.beginPath();
        ctx.arc(rg.x, rg.y, rg.size * Math.sqrt(prog), 0, 6.2832);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    initXP();
    initTilt();
    initParticles();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
