// --- マウスストーカー (Cursor Glow) の制御 ---
document.addEventListener('mousemove', (e) => {
    const g = document.querySelector('.cursor-glow');
    if (g) {
        g.style.left = e.clientX - 150 + 'px';
        g.style.top = e.clientY - 150 + 'px';
    }
});

// --- 数値カウンターのアニメーション ---
document.querySelectorAll('.counter').forEach((c) => {
    let t = +c.dataset.target,
        v = 0;
    const run = () => {
        v += Math.max(1, t / 80);
        if (v < t) {
            c.textContent = Math.floor(v);
            requestAnimationFrame(run);
        } else {
            c.textContent = t + '+';
        }
    };
    run();
});

// --- 複数キャンバス対応の線アニメーション (高速・巨大化・高輝度版) ---
(() => {
    const configs = [
        {
            el: document.getElementById('hero-canvas'),
            count: 30,
            color: 'rgba(135, 236, 169, 0.45)', // ヒーロー内は明るく鮮烈なライムグリーン
            speedMin: 1.5, // 最低速度
            speedMax: 4.5, // 最高速度
            lengthMin: 300, // 線の長さ（最小）
            lengthMax: 700, // 線の長さ（最大）
        },
        {
            el: document.getElementById('bg-canvas'),
            count: 35,
            color: 'rgba(11, 148, 84, 0.35)', // メイン背景ははっきりとしたフォレストグリーン
            speedMin: 2.0, // 最低速度
            speedMax: 5.5, // 最高速度
            lengthMin: 500, // 画面を跨ぐダイナミックな長さ
            lengthMax: 1200, // 最大1200pxの長い線
            diagonal: true,
        },
    ];

    const layers = [];

    configs.forEach((cfg) => {
        const c = cfg.el;
        if (!c) return;
        const ctx = c.getContext('2d');

        // デバイスの画面サイズに合わせて描画エリアをリサイズする関数
        const resize = () => {
            c.width = c.clientWidth || window.innerWidth;
            c.height = c.clientHeight || window.innerHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        const lines = [];
        for (let i = 0; i < cfg.count; i++) {
            const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
            const length = cfg.lengthMin + Math.random() * (cfg.lengthMax - cfg.lengthMin);
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
                ctx.lineWidth = 2; // 太めのくっきりとした線を描画

                if (line.vx !== undefined && line.vy !== undefined) {
                    // 斜めラインの描画
                    ctx.moveTo(line.x, line.y);
                    ctx.lineTo(
                        line.x + Math.cos(line.angle) * line.length,
                        line.y + Math.sin(line.angle) * line.length,
                    );
                    ctx.stroke();

                    line.x += line.vx;
                    line.y += line.vy;

                    // 画面外（リセット）判定を縦長・横長両方に対応
                    if (
                        line.x > c.width + line.length ||
                        line.y > c.height + line.length ||
                        line.y < -line.length
                    ) {
                        line.x = -line.length;
                        line.y = Math.random() * c.height;
                    }
                } else {
                    // 水平ラインの描画
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
    const heroVideo = document.querySelector('.hero-video');
    const heroSection = document.querySelector('.hero');
    if (!heroVideo || !heroSection) return;

    heroVideo.muted = true;

    const showPlayButton = () => {
        if (document.querySelector('.hero-play')) return;
        const btn = document.createElement('button');
        btn.className = 'hero-play';
        btn.setAttribute('aria-label', '動画を再生');
        btn.innerText = '▶';
        btn.addEventListener('click', () => {
            heroVideo.muted = true;
            heroVideo.play().then(() => btn.remove());
        });
        heroSection.appendChild(btn);
    };

    const tryPlay = () => {
        const p = heroVideo.play();
        if (p !== undefined) {
            p.then(() => {
                heroSection.classList.add('video-playing');
            }).catch(() => {
                showPlayButton();
            });
        }
    };

    tryPlay();

    // タッチデバイス・スマートフォン制限を解除するためのリスナー
    ['click', 'touchstart'].forEach((ev) => {
        window.addEventListener(ev, tryPlay, { once: true });
    });
})();
