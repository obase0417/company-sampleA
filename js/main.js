document.addEventListener("DOMContentLoaded", () => {
  // --- 1. HERO専用: 激しいデジタル波形ラインアニメーション ---
  (() => {
    const canvas = document.getElementById("hero-wave-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    let count = 0;
    // 重なり合う3本の波線をシミュレート（よりエネルギッシュな動き）
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      count += 0.04; // 速度（数値を上げると激しくなります）

      const lines = [
        {
          color: "rgba(56, 189, 248, 0.25)",
          amplitude: 55,
          speed: 1,
          freq: 0.006,
        },
        {
          color: "rgba(74, 222, 128, 0.2)",
          amplitude: 75,
          speed: 1.4,
          freq: 0.004,
        },
        {
          color: "rgba(37, 99, 219, 0.15)",
          amplitude: 35,
          speed: 0.8,
          freq: 0.009,
        },
      ];

      lines.forEach((line) => {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = line.color;

        for (let x = 0; x < canvas.width; x += 5) {
          // サイン波を幾重にも組み合わせて激しく不規則なウエーブを表現
          const y =
            canvas.height / 2 +
            Math.sin(x * line.freq + count * line.speed) * line.amplitude +
            Math.cos(x * 0.002 - count * 0.5) * (line.amplitude * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    }
    animate();
  })();

  // --- 2. 実績数値カウンター ---
  document.querySelectorAll(".counter").forEach((c) => {
    let t = +c.dataset.target,
      v = 0;
    const run = () => {
      v += Math.max(1, t / 60);
      if (v < t) {
        c.textContent = Math.floor(v);
        requestAnimationFrame(run);
      } else {
        c.textContent = t + (t === 98 ? "%" : "+");
      }
    };

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        run();
        obs.disconnect();
      }
    });
    obs.observe(c);
  });

  // --- 3. 導入事例 (WORKS) 自動無限スクロール ---
  (() => {
    const slider = document.getElementById("works-slider");
    const track = document.getElementById("works-track");
    if (!slider || !track) return;

    const items = Array.from(track.children);
    items.forEach((item) => {
      const clone = item.cloneNode(true);
      track.appendChild(clone);
    });

    let currentX = 0;
    let isDragging = false;
    let startX = 0;
    let dragStartX = 0;
    const autoSpeed = 0.6;

    function getHalfWidth() {
      const card = track.querySelector(".work-card");
      if (!card) return 0;
      const style = window.getComputedStyle(track);
      const gap = parseInt(style.gap) || 32;
      return (card.offsetWidth + gap) * items.length;
    }

    function updateScroll() {
      const halfWidth = getHalfWidth();
      if (!isDragging && halfWidth > 0) {
        currentX -= autoSpeed;
        if (currentX <= -halfWidth) {
          currentX += halfWidth;
        }
      }
      if (currentX > 0 && halfWidth > 0) {
        currentX -= halfWidth;
      }
      track.style.transform = `translateX(${currentX}px)`;
      requestAnimationFrame(updateScroll);
    }

    const dragStart = (x) => {
      isDragging = true;
      startX = x;
      dragStartX = currentX;
    };
    const dragMove = (x) => {
      if (!isDragging) return;
      const deltaX = x - startX;
      currentX = dragStartX + deltaX;
    };
    const dragEnd = () => {
      isDragging = false;
    };

    slider.addEventListener("mousedown", (e) => dragStart(e.clientX));
    window.addEventListener("mousemove", (e) => dragMove(e.clientX));
    window.addEventListener("mouseup", dragEnd);
    slider.addEventListener(
      "touchstart",
      (e) => dragStart(e.touches[0].clientX),
      { passive: true },
    );
    window.addEventListener(
      "touchmove",
      (e) => dragMove(e.touches[0].clientX),
      { passive: true },
    );
    window.addEventListener("touchend", dragEnd);

    requestAnimationFrame(updateScroll);
  })();
});
