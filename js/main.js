// --- マウスストーカー (Cursor Glow) の制御 ---
document.addEventListener("mousemove", (e) => {
  const g = document.querySelector(".cursor-glow");
  if (g) {
    g.style.left = e.clientX - 150 + "px";
    g.style.top = e.clientY - 150 + "px";
  }
});

// --- 数値カウンターのアニメーション ---
document.querySelectorAll(".counter").forEach((c) => {
  let t = +c.dataset.target,
    v = 0;
  const run = () => {
    v += Math.max(1, t / 80);
    if (v < t) {
      c.textContent = Math.floor(v);
      requestAnimationFrame(run);
    } else {
      c.textContent = t + "+";
    }
  };
  run();
});

// --- 導入事例 (WORKS) 自動スクロール ＆ 手動加減速ハイブリッドシステム ---
(() => {
  const slider = document.getElementById("works-slider");
  const track = document.getElementById("works-track");
  if (!slider || !track) return;

  // シームレスな無限ループ用にカード群を複製
  const items = Array.from(track.children);
  items.forEach((item) => {
    const clone = item.cloneNode(true);
    track.appendChild(clone);
  });

  let currentX = 0; // 現在の横スクロール位置
  let isDragging = false; // ドラッグ中フラグ
  let startX = 0; // ドラッグ開始時のマウス/タッチX座標
  let dragStartX = 0; // ドラッグ開始時のスライダー位置
  const autoSpeed = 0.8; // 自動スクロールの速度（じわじわ動く速度。値を大きくすると速くなります）

  // 各カードの幅＋Gapを含んだ「本来の1セット分の全体の長さ」を計算
  function getHalfWidth() {
    const card = track.querySelector(".work-card");
    if (!card) return 0;
    const style = window.getComputedStyle(track);
    const gap = parseInt(style.gap) || 30;
    return (card.offsetWidth + gap) * items.length;
  }

  // メインのループ処理（毎フレーム実行）
  function updateScroll() {
    const halfWidth = getHalfWidth();

    if (!isDragging && halfWidth > 0) {
      // 手動ドラッグ中でない時は、自動でじわじわ左へ進める
      currentX -= autoSpeed;

      // 半分（1セット分）進みきったら、位置を最初に戻して無限ループ
      if (currentX <= -halfWidth) {
        currentX += halfWidth;
      }
    }

    // 逆方向に手動ドラッグされて、先頭より右側にあふれそうになった場合のループ処理
    if (currentX > 0 && halfWidth > 0) {
      currentX -= halfWidth;
    }

    // トラック要素に位置を反映
    track.style.transform = `translateX(${currentX}px)`;
    requestAnimationFrame(updateScroll);
  }

  // --- マウス/タッチのイベント処理群 ---

  // ドラッグ開始処理
  const dragStart = (x) => {
    isDragging = true;
    startX = x;
    dragStartX = currentX;
  };

  // ドラッグ中処理（手動による加減速・巻き戻し）
  const dragMove = (x) => {
    if (!isDragging) return;
    const deltaX = x - startX;
    currentX = dragStartX + deltaX; // マウスの移動量に応じて位置をリアルタイムに加減速
  };

  // ドラッグ終了処理
  const dragEnd = () => {
    isDragging = false;
  };

  // マウスイベントの登録
  slider.addEventListener("mousedown", (e) => dragStart(e.clientX));
  window.addEventListener("mousemove", (e) => dragMove(e.clientX));
  window.addEventListener("mouseup", dragEnd);

  // スマートフォン向けタッチイベントの登録
  slider.addEventListener(
    "touchstart",
    (e) => dragStart(e.touches[0].clientX),
    { passive: true },
  );
  window.addEventListener("touchmove", (e) => dragMove(e.touches[0].clientX), {
    passive: true,
  });
  window.addEventListener("touchend", dragEnd);

  // アニメーションループ開始
  requestAnimationFrame(updateScroll);
})();

// --- 複数キャンバス対応の線アニメーション (高速・巨大化・高輝度版) ---
(() => {
  const configs = [
    {
      el: document.getElementById("hero-canvas"),
      count: 30,
      color: "rgba(135, 236, 169, 0.45)",
      speedMin: 1.5,
      speedMax: 4.5,
      lengthMin: 300,
      lengthMax: 700,
    },
    {
      el: document.getElementById("bg-canvas"),
      count: 35,
      color: "rgba(11, 148, 84, 0.35)",
      speedMin: 2.0,
      speedMax: 5.5,
      lengthMin: 500,
      lengthMax: 1200,
      diagonal: true,
    },
  ];

  const layers = [];

  configs.forEach((cfg) => {
    const c = cfg.el;
    if (!c) return;
    const ctx = c.getContext("2d");

    const resize = () => {
      c.width = c.clientWidth || window.innerWidth;
      c.height = c.clientHeight || window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const lines = [];
    for (let i = 0; i < cfg.count; i++) {
      const speed =
        cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
      const length =
        cfg.lengthMin + Math.random() * (cfg.lengthMax - cfg.lengthMin);
      if (cfg.diagonal) {
        const angle = (Math.random() * 2 - 1) * (Math.PI / 5);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        lines.push({
          x: Math.random() * c.width,
          y: Math.random() * c.height,
          speed,
          length,
          angle,
          vx,
          vy,
        });
      } else {
        lines.push({
          x: Math.random() * c.width,
          y: Math.random() * c.height,
          speed,
          length,
        });
      }
    }

    layers.push({ c, ctx, lines, cfg });
  });

  function animate() {
    layers.forEach((layer) => {
      const { ctx, c, lines, cfg } = layer;
      ctx.clearRect(0, 0, c.width, c.height);
      lines.forEach((line) => {
        ctx.beginPath();
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 2;

        if (line.vx !== undefined && line.vy !== undefined) {
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(
            line.x + Math.cos(line.angle) * line.length,
            line.y + Math.sin(line.angle) * line.length,
          );
          ctx.stroke();

          line.x += line.vx;
          line.y += line.vy;

          if (
            line.x > c.width + line.length ||
            line.y > c.height + line.length ||
            line.y < -line.length
          ) {
            line.x = -line.length;
            line.y = Math.random() * c.height;
          }
        } else {
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(line.x + line.length, line.y);
          ctx.stroke();

          line.x += line.speed;
          if (line.x > c.width) {
            line.x = -line.length;
            line.y = Math.random() * c.height;
          }
        }
      });
    });
    requestAnimationFrame(animate);
  }

  if (layers.length > 0) {
    animate();
  }
})();

// --- ヒーロービデオの自動再生＆フォールバックハンドリング ---
(() => {
  const heroVideo = document.querySelector(".hero-video");
  const heroSection = document.querySelector(".hero");
  if (!heroVideo || !heroSection) return;

  heroVideo.muted = true;

  const showPlayButton = () => {
    if (document.querySelector(".hero-play")) return;
    const btn = document.createElement("button");
    btn.className = "hero-play";
    btn.setAttribute("aria-label", "動画を再生");
    btn.innerText = "▶";
    btn.addEventListener("click", () => {
      heroVideo.muted = true;
      heroVideo.play().then(() => btn.remove());
    });
    heroSection.appendChild(btn);
  };

  const tryPlay = () => {
    const p = heroVideo.play();
    if (p !== undefined) {
      p.then(() => {
        heroSection.classList.add("video-playing");
      }).catch(() => {
        showPlayButton();
      });
    }
  };

  tryPlay();

  ["click", "touchstart"].forEach((ev) => {
    window.addEventListener(ev, tryPlay, { once: true });
  });
})();
