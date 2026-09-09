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
