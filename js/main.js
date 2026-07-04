document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* --------------------------------------------------------------------
     1. Header: shrink + background on scroll
  -------------------------------------------------------------------- */
  (() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* --------------------------------------------------------------------
     2. Mobile nav toggle
  -------------------------------------------------------------------- */
  (() => {
    const toggle = document.getElementById("nav-toggle");
    const overlay = document.getElementById("nav-overlay");
    if (!toggle || !overlay) return;

    const close = () => {
      toggle.classList.remove("active");
      overlay.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };
    const open = () => {
      toggle.classList.add("active");
      overlay.classList.add("active");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };

    toggle.addEventListener("click", () => {
      const isActive = toggle.classList.contains("active");
      isActive ? close() : open();
    });

    overlay.querySelectorAll("a[data-nav]").forEach((link) => {
      link.addEventListener("click", close);
    });
  })();

  /* --------------------------------------------------------------------
     3. Hero network canvas (subtle particle / node network)
  -------------------------------------------------------------------- */
  (() => {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height, particles;
    const DENSITY = 14000; // px^2 per particle
    const LINK_DIST = 150;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      const count = Math.min(90, Math.max(30, Math.floor((width * height) / DENSITY)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx.strokeStyle = `rgba(90, 160, 230, ${0.16 * (1 - dist / LINK_DIST)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120, 200, 255, 0.55)";
        ctx.fill();
      });

      if (!prefersReducedMotion) requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    step();
  })();

  /* --------------------------------------------------------------------
     4. Scroll reveal animations
  -------------------------------------------------------------------- */
  (() => {
    const targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const groups = new Map();
    targets.forEach((el) => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const siblings = groups.get(el.parentElement) || [el];
          const idx = siblings.indexOf(el);
          setTimeout(() => el.classList.add("is-visible"), Math.min(idx, 6) * 90);
          observer.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );

    targets.forEach((el) => observer.observe(el));
  })();

  /* --------------------------------------------------------------------
     5. Stat counters
  -------------------------------------------------------------------- */
  (() => {
    const counters = document.querySelectorAll(".counter");
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseFloat(el.dataset.target);
      const decimals = parseInt(el.dataset.decimal || "0", 10);
      const suffix = el.dataset.suffix || "";
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = value.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };

      if (prefersReducedMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
      } else {
        requestAnimationFrame(tick);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    counters.forEach((c) => observer.observe(c));
  })();

  /* --------------------------------------------------------------------
     6. Case study slider (auto-scroll + drag)
  -------------------------------------------------------------------- */
  (() => {
    const slider = document.getElementById("case-slider");
    const track = document.getElementById("case-track");
    if (!slider || !track) return;

    const originalItems = Array.from(track.children);
    originalItems.forEach((item) => track.appendChild(item.cloneNode(true)));

    let currentX = 0;
    let isDragging = false;
    let startX = 0;
    let dragStartX = 0;
    let autoSpeed = 0.45;
    let paused = false;

    function halfWidth() {
      const card = track.querySelector(".case-card");
      if (!card) return 0;
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.gap) || 28;
      return (card.offsetWidth + gap) * originalItems.length;
    }

    function frame() {
      const hw = halfWidth();
      if (!isDragging && !paused && hw > 0) {
        currentX -= autoSpeed;
      }
      if (hw > 0) {
        if (currentX <= -hw) currentX += hw;
        if (currentX > 0) currentX -= hw;
      }
      track.style.transform = `translateX(${currentX}px)`;
      requestAnimationFrame(frame);
    }

    const dragStart = (x) => {
      isDragging = true;
      startX = x;
      dragStartX = currentX;
    };
    const dragMove = (x) => {
      if (!isDragging) return;
      currentX = dragStartX + (x - startX);
    };
    const dragEnd = () => {
      isDragging = false;
    };

    slider.addEventListener("mousedown", (e) => dragStart(e.clientX));
    window.addEventListener("mousemove", (e) => dragMove(e.clientX));
    window.addEventListener("mouseup", dragEnd);
    slider.addEventListener("touchstart", (e) => dragStart(e.touches[0].clientX), { passive: true });
    window.addEventListener("touchmove", (e) => dragMove(e.touches[0].clientX), { passive: true });
    window.addEventListener("touchend", dragEnd);

    slider.addEventListener("mouseenter", () => (paused = true));
    slider.addEventListener("mouseleave", () => (paused = false));

    if (!prefersReducedMotion) {
      requestAnimationFrame(frame);
    }
  })();

  /* --------------------------------------------------------------------
     7. Contact form (client-side only demo submission)
  -------------------------------------------------------------------- */
  (() => {
    const form = document.getElementById("contact-form");
    const note = document.getElementById("form-note");
    if (!form || !note) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        note.textContent = "未入力の必須項目があります。ご確認ください。";
        note.classList.add("error");
        form.reportValidity();
        return;
      }
      note.classList.remove("error");
      note.textContent = "お問い合わせありがとうございます。担当者より折り返しご連絡いたします。";
      form.reset();
    });
  })();
});
