window.__fxReady = true; // tells the page's failsafe that scripts are running

// Storage can be blocked (sandboxed previews, strict privacy modes) - never let that break the page
const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
};

// Mobile nav toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  // Intro sequence (index.html only, plays once per browser session)
  const intro = document.getElementById("intro");
  if (intro) {
   try {
    const forceReplay = new URLSearchParams(location.search).get("intro") === "force";
    const alreadyPlayed = store.get("introPlayed") && !forceReplay;
    if (alreadyPlayed) {
      intro.remove();
    } else {
      document.body.classList.add("intro-active");
      const heroEl = document.querySelector(".hero");
      const bootLog = document.getElementById("boot-log");
      const bootBar = document.getElementById("boot-bar");
      const bootTitle = document.getElementById("boot-title");

      const lines = [
        { tag: "[ENGINE]", text: "Initializing viewport..." },
        { tag: "[ASSETS]", text: "Loading scene graph..." },
        { tag: "[SHADER]", text: "Compiling materials..." },
        { tag: "[READY]", text: "Handing off to renderer." },
      ];

      let cancelled = false;
      let timers = [];
      const setT = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

      function typeLine(el, text, speed, onDone) {
        let i = 0;
        el.classList.add("shown");
        const cursor = document.createElement("span");
        cursor.className = "cursor";
        function tick() {
          if (cancelled) return;
          el.textContent = text.slice(0, i);
          el.appendChild(cursor);
          i++;
          if (i <= text.length) {
            setT(tick, speed);
          } else {
            cursor.remove();
            if (onDone) onDone();
          }
        }
        tick();
      }

      function runBoot() {
        let delay = 0;
        lines.forEach((line, idx) => {
          setT(() => {
            const row = document.createElement("div");
            row.className = "line";
            const tagSpan = document.createElement("span");
            tagSpan.className = "tag";
            tagSpan.textContent = line.tag + " ";
            row.appendChild(tagSpan);
            const textSpan = document.createElement("span");
            row.appendChild(textSpan);
            bootLog.appendChild(row);
            typeLine(textSpan, line.text, 16);
          }, delay);
          delay += 380;
        });

        // Progress bar fills alongside the log
        setT(() => { bootBar.style.transition = "width 1.3s linear"; bootBar.style.width = "100%"; }, 150);

        // Title + glitch flash, then reveal
        setT(() => {
          intro.classList.add("boot-ready");
        }, delay + 150);

        setT(finishIntro, delay + 550);
      }

      const finishIntro = () => {
        if (cancelled) return;
        cancelled = true;
        timers.forEach(clearTimeout);
        intro.classList.add("boot-flash");
        setTimeout(() => {
          intro.classList.add("intro-hide");
          document.body.classList.remove("intro-active");
          store.set("introPlayed", "1");
          if (heroEl) heroEl.classList.add("zoom-reveal");
          setTimeout(() => intro.remove(), 650);
        }, 140);
      };

      runBoot();
      intro.addEventListener("click", finishIntro);
      document.addEventListener("keydown", finishIntro, { once: true });
    }
   } catch (err) {
     intro.remove();
     document.body.classList.remove("intro-active");
   }
  }

  // Cursor glow — soft light that follows the mouse (desktop/hover-capable only)
  if (window.matchMedia("(hover: hover)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);
    let ticking = false;
    window.addEventListener("mousemove", (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          glow.style.setProperty("--mx", e.clientX + "px");
          glow.style.setProperty("--my", e.clientY + "px");
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // Hero background: drifting node-graph animation (mouse-reactive)
  const heroCanvas = document.querySelector(".hero-bg .node-canvas");
  if (heroCanvas) {
    const ctx = heroCanvas.getContext("2d");
    const hero = heroCanvas.closest(".hero");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = ["#e5484d", "#4cc38a", "#3b9eff"]; // gizmo axis colors
    let nodes = [];
    let w = 0, h = 0, rafId = null;
    const mouse = { x: 0, y: 0, active: false };

    function hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function resize() {
      w = hero.offsetWidth;
      h = hero.offsetHeight;
      heroCanvas.width = w * devicePixelRatio;
      heroCanvas.height = h * devicePixelRatio;
      heroCanvas.style.width = w + "px";
      heroCanvas.style.height = h + "px";
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function initNodes() {
      const count = Math.max(14, Math.min(28, Math.floor((w * h) / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1.6 + Math.random() * 1.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      const linkDist = 150;

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Mouse repulsion
        if (mouse.active) {
          const dx = n.x - mouse.x, dy = n.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = 110;
          if (dist < influence && dist > 0.01) {
            const force = (1 - dist / influence) * 0.6;
            n.x += (dx / dist) * force;
            n.y += (dy / dist) * force;
          }
        }
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx.strokeStyle = "rgba(154, 160, 172, " + (1 - dist / linkDist) * 0.25 + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Connect nearby nodes to the cursor itself
      if (mouse.active) {
        nodes.forEach((n) => {
          const dx = n.x - mouse.x, dy = n.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const linkToCursor = 170;
          if (dist < linkToCursor) {
            ctx.strokeStyle = hexToRgba(n.color, (1 - dist / linkToCursor) * 0.5);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        });
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(234, 234, 228, 0.7)";
        ctx.fill();
      }

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      rafId = requestAnimationFrame(step);
    }

    function start() {
      resize();
      initNodes();
      if (!prefersReducedMotion) {
        cancelAnimationFrame(rafId);
        step();
      } else {
        // Draw a single static frame, no motion
        step();
        cancelAnimationFrame(rafId);
      }
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else if (!prefersReducedMotion) {
        step();
      }
    });

    window.addEventListener("resize", () => {
      resize();
      initNodes();
    });

    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    hero.addEventListener("mouseleave", () => { mouse.active = false; });

    start();
  }

  // Scroll reveal animations
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach((el) => observer.observe(el));
    } else {
      // Fallback: no IntersectionObserver support, just show everything
      revealEls.forEach((el) => el.classList.add("in-view"));
    }
  }

  // Video / play-in-browser toggles on project cards
  document.querySelectorAll(".card").forEach((card) => {
    const thumb = card.querySelector(".card-thumb");
    const actions = card.querySelector(".media-actions");
    if (!thumb || !actions) return;

    const originalHTML = thumb.innerHTML;

    const showBack = () => {
      let backBtn = actions.querySelector(".back-btn");
      if (!backBtn) {
        backBtn = document.createElement("button");
        backBtn.className = "media-btn back-btn";
        backBtn.textContent = "← Back to screenshot";
        backBtn.addEventListener("click", () => {
          thumb.innerHTML = originalHTML;
          actions.querySelectorAll(".media-btn").forEach((b) => b.classList.remove("is-active"));
          backBtn.remove();
        });
        actions.appendChild(backBtn);
      }
    };

    actions.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.dataset.src;
        if (!src) return;
        actions.querySelectorAll(".media-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        if (btn.dataset.action === "video") {
          thumb.innerHTML = `<video controls autoplay playsinline src="${src}"></video>`;
        } else if (btn.dataset.action === "play") {
          thumb.innerHTML = `<iframe src="${src}" loading="lazy" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>`;
        }
        showBack();
      });
    });
  });

  // Project filter (only present on projects.html)
  const filterBar = document.querySelector(".filters");
  if (filterBar) {
    const buttons = filterBar.querySelectorAll("button");
    const cards = document.querySelectorAll(".project-grid .card");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.dataset.filter;
        cards.forEach((card) => {
          const engines = card.dataset.engine || "";
          card.style.display =
            filter === "all" || engines.includes(filter) ? "" : "none";
        });
      });
    });
  }
});
