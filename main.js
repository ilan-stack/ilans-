/* ── Progressive enhancement + motion preferences ── */
document.documentElement.classList.remove('no-js');
var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Theme toggle (dark is the default; light is opt-in + persisted) ── */
var themeLight = document.documentElement.getAttribute('data-theme') === 'light';
(function() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', themeLight ? 'true' : 'false');
    btn.addEventListener('click', function() {
        themeLight = !themeLight;
        if (themeLight) document.documentElement.setAttribute('data-theme', 'light');
        else document.documentElement.removeAttribute('data-theme');
        btn.setAttribute('aria-pressed', themeLight ? 'true' : 'false');
        var tc = document.getElementById('themeColorMeta');
        if (tc) tc.setAttribute('content', themeLight ? '#faf9f7' : '#0b0b0d');
        try { localStorage.setItem('theme', themeLight ? 'light' : 'dark'); } catch (e) {}
    });
})();

/* ── Nav scroll ── */
var nav = document.getElementById('nav');
window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ── Mobile burger menu ── */
var burger = document.getElementById('navBurger');
var navLinks = document.getElementById('navLinks');
function setBurger(open) {
    burger.classList.toggle('open', open);
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
}
burger.addEventListener('click', function() {
    setBurger(!burger.classList.contains('open'));
});
navLinks.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() { setBurger(false); });
});
document.addEventListener('click', function(e) {
    if (navLinks.classList.contains('open') && !nav.contains(e.target)) setBurger(false);
});

/* ── Reveal on scroll ── */
if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
} else {
    document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('visible'); });
}

/* ── Hover videos: lazy-load src on first hover, play/pause on enter/leave ── */
document.querySelectorAll('.case, .mini').forEach(function(card) {
    var video = card.querySelector('video');
    if (!video) return;
    card.addEventListener('mouseenter', function() {
        if (!video.src && video.dataset.src) video.src = video.dataset.src;
        video.currentTime = 0;
        video.play().catch(function() {});
    });
    card.addEventListener('mouseleave', function() {
        video.pause();
    });
});

/* ── Skills: terminal decode-scramble cascade ──
   Each term resolves from random glyphs left-to-right, staggered
   down the row; hovering a term re-scrambles it briefly. ── */
(function() {
    var rows = document.querySelectorAll('.skill-row');
    if (!rows.length) return;

    // ASCII-only pool: identical advance width in the mono font, no tofu
    var GLYPHS = '!<>-_\\/[]{}=+*^?#@$%&;:~01';

    function randGlyph() {
        return GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }

    function decode(el, duration) {
        if (el._decoding) return;
        el._decoding = true;
        var finalText = el.dataset.text;
        var L = finalText.length;
        el.classList.add('decoding');
        var start = performance.now();
        var shown = new Array(L);

        function tick(now) {
            var t = Math.min((now - start) / duration, 1);
            var out = '';
            for (var i = 0; i < L; i++) {
                // Each char locks in sequence across the first 85% of the run
                var lockAt = 0.12 + (i / L) * 0.73;
                if (t >= lockAt || finalText[i] === ' ') {
                    out += finalText[i];
                } else {
                    // Re-roll a glyph every ~3rd frame so it shimmers, not strobes
                    if (!shown[i] || Math.random() < 0.35) shown[i] = randGlyph();
                    out += shown[i];
                }
            }
            el.textContent = out;
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = finalText;
                el.classList.remove('decoding');
                el._decoding = false;
            }
        }
        requestAnimationFrame(tick);
    }

    rows.forEach(function(row) {
        var title = row.querySelector('.skill-row-title');
        var skills = row.querySelectorAll('.skill');
        if (title) title.dataset.text = title.textContent;
        skills.forEach(function(s) { s.dataset.text = s.textContent; });

        if (REDUCED) return;

        // Re-scramble a single term on hover
        skills.forEach(function(s) {
            s.addEventListener('mouseenter', function() { decode(s, 320); });
        });
    });

    if (REDUCED || !('IntersectionObserver' in window)) return;

    var rowObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            rowObserver.unobserve(entry.target);
            var row = entry.target;
            var title = row.querySelector('.skill-row-title');
            if (title) decode(title, 500);
            row.querySelectorAll('.skill').forEach(function(s, i) {
                setTimeout(function() { decode(s, 520); }, 180 + i * 55);
            });
        });
    }, { threshold: 0.3 });

    rows.forEach(function(row) { rowObserver.observe(row); });

    /* Ambient loop: while the section is on screen, a random term
       re-decodes every couple of seconds so the list stays alive */
    var allSkills = Array.prototype.slice.call(document.querySelectorAll('.skill'));
    var skillsSection = document.getElementById('skills');
    var sectionVisible = false;
    var lastIdx = -1;
    if (skillsSection && allSkills.length) {
        new IntersectionObserver(function(entries) {
            sectionVisible = entries[0].isIntersecting;
        }, { threshold: 0.15 }).observe(skillsSection);

        (function ambient() {
            setTimeout(function() {
                if (sectionVisible && !document.hidden) {
                    var idx;
                    do { idx = (Math.random() * allSkills.length) | 0; }
                    while (idx === lastIdx && allSkills.length > 1);
                    lastIdx = idx;
                    decode(allSkills[idx], 650);
                }
                ambient();
            }, 1800 + Math.random() * 1700);
        })();
    }
})();

/* ── Animated stat counters (serif numerals) ── */
(function() {
    var statEls = document.querySelectorAll('.stat-number');
    statEls.forEach(function(el) {
        var text = el.textContent.trim();
        var match = text.match(/^(\d+)(.*)$/);
        if (!match) return;
        el._countTarget = parseInt(match[1]);
        el._countSuffix = match[2];
    });

    function animateCounter(el) {
        var target = el._countTarget;
        var suffix = el._countSuffix;
        if (REDUCED) { el.textContent = target + suffix; return; }
        var duration = 1400;
        var start = performance.now();
        requestAnimationFrame(function step(now) {
            var t = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (t < 1) requestAnimationFrame(step);
        });
    }

    if (!('IntersectionObserver' in window)) return;
    var statObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    statEls.forEach(function(el) {
        if (el._countTarget !== undefined) statObserver.observe(el);
    });
})();

/* ── Engagement tracking: count contact-intent clicks in GoatCounter ── */
function trackEvent(path) {
    if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: path, event: true });
    }
}
(function() {
    document.querySelectorAll('a[href*="t.me/"]').forEach(function(a) {
        a.addEventListener('click', function() { trackEvent('telegram-click'); });
    });
    document.querySelectorAll('a[href$=".pdf"]').forEach(function(a) {
        a.addEventListener('click', function() { trackEvent('resume-click'); });
    });
    document.querySelectorAll('a[href*="linkedin.com"]').forEach(function(a) {
        a.addEventListener('click', function() { trackEvent('linkedin-click'); });
    });
})();

/* ── Email contact sheet: mailto links open a no-dead-end dialog ──
   Raw mailto silently fails on machines with no mail client; the
   sheet offers copy / web Gmail / mail app instead. ── */
(function() {
    var modal = document.getElementById('emailModal');
    if (!modal) return;
    var copyBtn = document.getElementById('copyEmailBtn');
    var EMAIL = 'ilan@ilans.net';
    var lastFocus = null;

    function openModal() {
        lastFocus = document.activeElement;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        copyBtn.focus();
        trackEvent('email-click');
    }
    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
        copyBtn.textContent = 'Copy address';
        if (lastFocus) lastFocus.focus();
    }

    // Intercept every mailto link except the sheet's own "Mail app" option
    document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) {
        if (modal.contains(a)) return;
        a.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    });

    modal.querySelectorAll('[data-close]').forEach(function(el) {
        el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    copyBtn.addEventListener('click', function() {
        function done() {
            copyBtn.textContent = 'Copied ✓';
            trackEvent('email-copy');
            setTimeout(function() { copyBtn.textContent = 'Copy address'; }, 2000);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(EMAIL).then(done).catch(fallback);
        } else {
            fallback();
        }
        function fallback() {
            var ta = document.createElement('textarea');
            ta.value = EMAIL;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); } catch (err) {}
            document.body.removeChild(ta);
        }
    });

    document.getElementById('gmailBtn').addEventListener('click', function() {
        trackEvent('gmail-compose');
    });
})();

/* ── Scroll progress bar ── */
(function() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', function() {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (scrollTop / docHeight * 100) + '%';
    }, { passive: true });
})();

/* ── Force-field dot grid with dot-matrix banner ──
   The signature. Optimized: capped DPR, lazy video init, paused when
   hidden or scrolled past the hero, lit-map updates every 2nd frame. ── */
(function() {
    var canvas = document.getElementById('dotfield');
    if (REDUCED) { canvas.style.display = 'none'; return; }
    var ctx = canvas.getContext('2d');
    var IS_MOBILE = window.innerWidth < 700;
    var SPACING = IS_MOBILE ? 11 : 9;
    var DOT_R = 0.5;
    var PLUS_SIZE = 1.0;
    var EFFECT_RADIUS = 150;
    var REPEL_FORCE = 5;
    var HEAL_FACTOR = 0.04;
    var DAMPING = 0.92;

    // Banner messages — text, images, and videos with real colors.
    // Mobile skips the video messages (CPU + bandwidth).
    var MESSAGES = [
        { text: 'ILAN LENZNER', scale: 0.9 },
        { video: 'videos/dnc4.mp4', bgFilter: 147 },
        { text: 'AI + DESIGN', scale: 0.9 },
        { video: 'videos/ilans-talk.mp4', bgFilter: 'grey' },
        { image: 'images/rhino-dots.webp' },
        { video: 'videos/bg_video.mp4', bgFilter: 'grey' },
        { video: 'videos/portrait-anim.mp4' },
        { text: '45+ TOOLS', scale: 0.9 },
        { text: 'CREATIVE TECH', scale: 0.9 },
    ];
    if (IS_MOBILE) {
        MESSAGES = MESSAGES.filter(function(m) { return !m.video; });
    }
    var MSG_DURATION = 200;
    var FADE_FRAMES = 50;

    var imageCache = {};
    var videoCache = {};
    var activeVideo = null;

    // Images are tiny — load now. Videos load one at a time, just before
    // their banner message comes up, so visitors who scroll past the hero
    // never pay for them.
    MESSAGES.forEach(function(msg) {
        if (msg.image && !imageCache[msg.image]) {
            var img = new Image();
            img.src = msg.image;
            imageCache[msg.image] = img;
        }
    });

    function ensureVideo(src) {
        if (!src || videoCache[src]) return videoCache[src];
        var vid = document.createElement('video');
        vid.src = src;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.preload = 'auto';
        vid.load();
        videoCache[src] = vid;
        return vid;
    }

    var W, H, cols, rows, particles;
    var mouseX = -9999, mouseY = -9999;
    var frame = 0;
    var msgIndex = 0;
    var litMap = null;
    var offCanvas, offCtx;
    var running = false;
    var rafId = null;

    function init() {
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        cols = Math.ceil(W / SPACING) + 2;
        rows = Math.ceil(H / SPACING) + 2;
        particles = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var hx = c * SPACING;
                var hy = r * SPACING;
                particles.push({
                    hx: hx, hy: hy,
                    x: hx, y: hy,
                    vx: 0, vy: 0,
                    col: c, row: r,
                    baseShape: (r + c) % 2 === 0 ? 'dot' : 'plus',
                    lit: 0
                });
            }
        }

        offCanvas = document.createElement('canvas');
        offCanvas.width = cols;
        offCanvas.height = rows;
        offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        sampleMessage(MESSAGES[0]);
    }

    var litPixels = [];
    var currentIsImage = false;
    var currentIsVideo = false;
    var currentBgFilter = null;

    function sampleMessage(msg) {
        if (activeVideo) {
            activeVideo.pause();
            activeVideo = null;
        }

        if (msg.video) {
            currentIsImage = true;
            currentIsVideo = true;
            currentBgFilter = msg.bgFilter || null;
            var vid = ensureVideo(msg.video);
            if (vid) {
                vid.currentTime = 0;
                vid.play().catch(function() {});
                activeVideo = vid;
                sampleVideoFrame(vid);
            }
            return;
        }

        currentIsVideo = false;
        offCtx.clearRect(0, 0, cols, rows);
        var cx = Math.floor(cols / 2);
        var cy = Math.floor(rows / 2);

        if (msg.image) {
            currentIsImage = true;
            var img = imageCache[msg.image];
            if (img && img.complete && img.naturalWidth > 0) {
                var aspect = img.naturalWidth / img.naturalHeight;
                var maxH = Math.floor(rows * 0.85);
                var maxW = Math.floor(cols * 0.5);
                var drawH = maxH;
                var drawW = Math.floor(drawH * aspect);
                if (drawW > maxW) { drawW = maxW; drawH = Math.floor(drawW / aspect); }
                offCtx.drawImage(img, cx - Math.floor(drawW/2), cy - Math.floor(drawH/2), drawW, drawH);
            }
        } else {
            currentIsImage = false;
            offCtx.fillStyle = '#fff';
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            var text = msg.text;
            var scale = msg.scale || 0.9;
            var fontSize = Math.floor(cols * scale / Math.max(text.length, 1) * 1.6);
            fontSize = Math.max(6, Math.min(fontSize, Math.floor(rows * 0.8)));
            offCtx.font = '900 ' + fontSize + 'px sans-serif';
            offCtx.fillText(text, cx, cy);
        }

        extractLitPixels(msg);
    }

    function sampleVideoFrame(vid) {
        if (!vid || vid.readyState < 2) return;
        offCtx.clearRect(0, 0, cols, rows);
        var cx = Math.floor(cols / 2);
        var cy = Math.floor(rows / 2);
        var aspect = vid.videoWidth / vid.videoHeight;
        var maxH = Math.floor(rows * 0.85);
        var maxW = Math.floor(cols * 0.5);
        var drawH = maxH;
        var drawW = Math.floor(drawH * aspect);
        if (drawW > maxW) { drawW = maxW; drawH = Math.floor(drawW / aspect); }
        offCtx.drawImage(vid, cx - Math.floor(drawW/2), cy - Math.floor(drawH/2), drawW, drawH);
        extractLitPixels({ video: true, bgFilter: currentBgFilter });
    }

    function extractLitPixels(msg) {
        var cx = Math.floor(cols / 2);
        var cy = Math.floor(rows / 2);
        var isVisual = msg.image || msg.video;
        var imgData;
        try {
            imgData = offCtx.getImageData(0, 0, cols, rows).data;
        } catch (e) {
            // Canvas tainted (file:// protocol) — recreate and skip this frame
            offCanvas = document.createElement('canvas');
            offCanvas.width = cols;
            offCanvas.height = rows;
            offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
            return;
        }
        litPixels = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var idx = (r * cols + c) * 4;
                var R = imgData[idx], G = imgData[idx+1], B = imgData[idx+2], A = imgData[idx+3];
                if (A < 60) continue;
                if (isVisual) {
                    var lum = R * 0.299 + G * 0.587 + B * 0.114;
                    if (lum > 235) continue;
                    // Chromakey: skip green-dominant pixels
                    if (G > 80 && G > R * 1.3 && G > B * 1.3) continue;
                    if (msg.bgFilter === 'grey') {
                        var maxC = Math.max(R, G, B), minC = Math.min(R, G, B);
                        if (maxC - minC < 35) continue;
                    } else if (typeof msg.bgFilter === 'number') {
                        if (Math.abs(lum - msg.bgFilter) < 18) continue;
                    }
                }
                litPixels.push({ dc: c - cx, dr: r - cy, r: R, g: G, b: B });
            }
        }
        updateLitMap();
    }

    var litColorMap = {};

    function updateLitMap() {
        var fx = Math.floor(cols / 2 + Math.sin(frame / 180) * cols * 0.3);
        var fy = Math.floor(rows / 2 + Math.cos(frame / 130) * rows * 0.25);
        litMap = new Set();
        litColorMap = {};
        for (var i = 0; i < litPixels.length; i++) {
            var lp = litPixels[i];
            var c = fx + lp.dc;
            var r = fy + lp.dr;
            if (c >= 0 && c < cols && r >= 0 && r < rows) {
                var key = c + ',' + r;
                litMap.add(key);
                if (lp.r !== undefined) {
                    litColorMap[key] = { r: lp.r, g: lp.g, b: lp.b };
                }
            }
        }
    }

    function animate() {
        if (!running) { rafId = null; return; }
        ctx.clearRect(0, 0, W, H);

        frame++;

        var cycleFrame = frame % (MSG_DURATION + FADE_FRAMES * 2);
        if (cycleFrame === 0) {
            msgIndex = (msgIndex + 1) % MESSAGES.length;
            sampleMessage(MESSAGES[msgIndex]);
        } else if (cycleFrame === MSG_DURATION) {
            // Prefetch the next message's video ~2s before it shows
            var next = MESSAGES[(msgIndex + 1) % MESSAGES.length];
            if (next.video) ensureVideo(next.video);
        }

        // Re-sample video frame every 3rd frame for live animation
        if (currentIsVideo && activeVideo && activeVideo.readyState >= 2 && frame % 3 === 0) {
            sampleVideoFrame(activeVideo);
        }

        // Float the banner — every 2nd frame is plenty
        if (frame % 2 === 0) updateLitMap();

        var bannerAlpha = 1;
        if (cycleFrame < FADE_FRAMES) {
            bannerAlpha = cycleFrame / FADE_FRAMES;
        } else if (cycleFrame > MSG_DURATION + FADE_FRAMES) {
            bannerAlpha = 1 - (cycleFrame - MSG_DURATION - FADE_FRAMES) / FADE_FRAMES;
        }

        var radius = EFFECT_RADIUS + Math.sin(frame / 15) * 30;
        var radiusSq = radius * radius;

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            var key = p.col + ',' + p.row;
            var isLit = litMap && litMap.has(key);
            var pixelColor = litColorMap[key] || null;

            var targetLit = isLit ? bannerAlpha : 0;
            p.lit += (targetLit - p.lit) * 0.12;

            var dx = p.x - mouseX;
            var dy = p.y - mouseY;
            var distSq = dx * dx + dy * dy;
            if (distSq < radiusSq && distSq > 0) {
                var dist = Math.sqrt(distSq);
                var strength = (1 - dist / radius) * REPEL_FORCE;
                p.vx += (dx / dist) * strength;
                p.vy += (dy / dist) * strength;
            }

            p.vx += (p.hx - p.x) * HEAL_FACTOR;
            p.vy += (p.hy - p.y) * HEAL_FACTOR;
            p.vx *= DAMPING;
            p.vy *= DAMPING;
            p.x += p.vx;
            p.y += p.vy;

            var glow = p.lit;
            var baseAlpha = themeLight
                ? ((p.col + p.row) % 3 === 0 ? 0.32 : 0.22)
                : ((p.col + p.row) % 3 === 0 ? 0.18 : 0.12);
            var alpha = baseAlpha + glow * 0.65;
            var r_c, g_c, b_c;

            if (pixelColor && currentIsImage && glow > 0.05) {
                if (themeLight) {
                    var lum2 = 0.299 * pixelColor.r + 0.587 * pixelColor.g + 0.114 * pixelColor.b;
                    r_c = Math.round(60 * (1 - glow) + lum2 * glow);
                    g_c = Math.round(60 * (1 - glow) + lum2 * glow);
                    b_c = Math.round(70 * (1 - glow) + Math.min(255, lum2 * 1.04) * glow);
                } else {
                    r_c = Math.round(255 * (1 - glow) + pixelColor.r * glow);
                    g_c = Math.round(255 * (1 - glow) + pixelColor.g * glow);
                    b_c = Math.round(255 * (1 - glow) + pixelColor.b * glow);
                }
                alpha = baseAlpha + glow * 0.82;
            } else if (themeLight) {
                // Light theme: warm-grey base glowing toward indigo
                r_c = Math.round(70 + glow * 21);     // 70 -> 91
                g_c = Math.round(70 + glow * 7);      // 70 -> 77
                b_c = Math.round(80 + glow * 144);    // 80 -> 224
            } else {
                // Dark theme: ivory base glowing toward violet
                r_c = Math.round(237 - glow * 99);    // 237 -> 138
                g_c = Math.round(237 - glow * 114);   // 237 -> 123
                b_c = Math.round(234 + glow * 21);    // 234 -> 255
            }
            var color = 'rgba(' + r_c + ',' + g_c + ',' + b_c + ',' + alpha + ')';

            var shape = p.baseShape;
            if (glow > 0.3) {
                shape = shape === 'dot' ? 'plus' : 'dot';
            }

            if (shape === 'dot') {
                var dotR = (themeLight ? 0.7 : DOT_R) + glow * (pixelColor && currentIsImage ? 1.8 : 1.2);
                ctx.beginPath();
                ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            } else {
                var s = PLUS_SIZE + glow * (pixelColor && currentIsImage ? 2.2 : 1.5);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1 + glow * 0.5;
                ctx.beginPath();
                ctx.moveTo(p.x - s, p.y);
                ctx.lineTo(p.x + s, p.y);
                ctx.moveTo(p.x, p.y - s);
                ctx.lineTo(p.x, p.y + s);
                ctx.stroke();
            }
        }

        rafId = requestAnimationFrame(animate);
    }

    function start() {
        if (running) return;
        running = true;
        if (activeVideo) activeVideo.play().catch(function() {});
        if (!rafId) rafId = requestAnimationFrame(animate);
    }
    function stop() {
        running = false;
        if (activeVideo) activeVideo.pause();
    }

    /* Fade with scroll and stop the loop entirely once past the hero */
    function onScroll() {
        var h = window.innerHeight;
        var p = Math.min(window.scrollY / h, 1);
        canvas.style.opacity = (1 - p).toFixed(3);
        if (p >= 0.99) stop();
        else start();
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Pause when the tab is hidden */
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) stop();
        else if (window.scrollY < window.innerHeight) start();
    });

    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    document.addEventListener('mouseleave', function() {
        mouseX = -9999;
        mouseY = -9999;
    });
    document.addEventListener('touchmove', function(e) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function() {
        mouseX = -9999;
        mouseY = -9999;
    });

    var resizeT;
    window.addEventListener('resize', function() {
        clearTimeout(resizeT);
        resizeT = setTimeout(init, 150);
    });
    init();
    onScroll();
    start();
})();

/* ── Hero pen-squiggle: a pen draws a wavy line, holds, fades, loops.
   JS-driven so the pen stays glued to the stroke's drawn tip. ── */
(function() {
    var thin = document.getElementById('heroWaveThin');
    var thick = document.getElementById('heroWaveThick');
    var pen = document.getElementById('heroWavePen');
    if (!thin || !thick || !pen) return;

    var L = thin.getTotalLength();
    thin.style.strokeDasharray = L;
    thick.style.strokeDasharray = L;

    // Reduced motion: show the line fully drawn, no pen, no loop
    if (REDUCED) {
        thin.style.strokeDashoffset = 0;
        thick.style.strokeDashoffset = 0;
        return;
    }

    thin.style.strokeDashoffset = L;
    thick.style.strokeDashoffset = L;

    var DUR = 6300;       // full cycle ms
    var DRAW_END = 0.24;  // drawing phase
    var HOLD_END = 0.71;  // hold drawn
    var FADE_END = 0.84;  // fade out, then pause before restart
    var start = null;

    function ease(t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); }

    function tick(ts) {
        if (!start) start = ts;
        var t = ((ts - start) % DUR) / DUR;
        var draw, lineOp, penOp;

        if (t < DRAW_END) {
            draw = ease(t / DRAW_END);
            lineOp = 1;
            penOp = t < 0.01 ? 0 : 0.9;
        } else if (t < HOLD_END) {
            draw = 1; lineOp = 1;
            penOp = Math.max(0, 0.9 * (1 - (t - DRAW_END) / 0.05));
        } else if (t < FADE_END) {
            draw = 1;
            lineOp = 1 - (t - HOLD_END) / (FADE_END - HOLD_END);
            penOp = 0;
        } else {
            draw = 0; lineOp = 0; penOp = 0;
        }

        var off = L * (1 - draw);
        thin.style.strokeDashoffset = off;
        thick.style.strokeDashoffset = off;
        thin.style.opacity = lineOp;
        thick.style.opacity = lineOp;

        var pt = thin.getPointAtLength(draw * L);
        pen.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
        pen.style.opacity = penOp;

        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
})();

/* ── Experience timeline: a glowing dot travels down the line with
   scroll, leaving a violet trail and lighting roles as it passes ── */
(function() {
    var tl = document.querySelector('.timeline');
    if (!tl || REDUCED) return;

    var trail = document.createElement('div');
    trail.className = 'timeline-trail';
    var marker = document.createElement('div');
    marker.className = 'timeline-marker';
    tl.appendChild(trail);
    tl.appendChild(marker);

    var items = tl.querySelectorAll('.timeline-item');
    var ticking = false;

    function update() {
        ticking = false;
        var rect = tl.getBoundingClientRect();
        var inset = 8;                          // matches the line's top/bottom inset
        var total = rect.height - inset * 2;
        if (total <= 0) return;
        // focal point: 40% down the viewport feels like "where you're reading"
        var focal = window.innerHeight * 0.4;
        var p = (focal - rect.top - inset) / total;
        p = Math.max(0, Math.min(1, p));
        var pos = inset + p * total;
        marker.style.transform = 'translate(-50%, ' + pos.toFixed(1) + 'px)';
        trail.style.height = Math.max(0, pos - inset).toFixed(1) + 'px';
        items.forEach(function(it) {
            var dotY = it.getBoundingClientRect().top - rect.top + 11;
            it.classList.toggle('passed', pos >= dotY);
        });
    }
    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
})();

/* ── Featured cases: inner-image parallax. The media is slightly
   oversized inside its masked frame and drifts as you scroll past -
   depth without moving any text or layout. ── */
(function() {
    if (REDUCED) return;
    /* Lens card is excluded: its preview is a full-page screenshot whose top
       nav must stay fully visible, so it keeps an exact 16:10 fit (no oversize). */
    var medias = document.querySelectorAll('.case:not([data-focus="lens"]) .case-media');
    if (!medias.length) return;
    medias.forEach(function(m) { m.classList.add('parallax'); });

    var ticking = false;
    function update() {
        ticking = false;
        var vh = window.innerHeight;
        medias.forEach(function(m) {
            var r = m.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            // -0.5 (entering at bottom) .. +0.5 (leaving at top)
            var p = ((r.top + r.height / 2) - vh / 2) / vh;
            m.style.setProperty('--py', (p * -22).toFixed(1) + 'px');
        });
    }
    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
})();

/* ── Stats: count-up on first reveal ── */
(function() {
    if (REDUCED || !('IntersectionObserver' in window)) return;
    var nums = document.querySelectorAll('.stat-number');
    if (!nums.length) return;
    var parsed = [];
    nums.forEach(function(el) {
        var m = el.textContent.trim().match(/^(\d+)(.*)$/);
        if (!m) return;
        el._target = +m[1];
        el._suffix = m[2];
        el.textContent = '0' + el._suffix;
        parsed.push(el);
    });
    var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(en) {
            if (!en.isIntersecting) return;
            io.unobserve(en.target);
            var el = en.target;
            var start = performance.now(), dur = 1400;
            function tick(now) {
                var t = Math.min((now - start) / dur, 1);
                var e = 1 - Math.pow(1 - t, 3); // ease-out cubic
                el.textContent = Math.round(el._target * e) + el._suffix;
                if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.5 });
    parsed.forEach(function(el) { io.observe(el); });
})();

/* ── Touch devices: hover previews autoplay while ~60% in view.
   Desktop keeps hover-to-play; this only runs where hover doesn't exist. ── */
(function() {
    if (REDUCED || !('IntersectionObserver' in window)) return;
    if (!(window.matchMedia && window.matchMedia('(hover: none)').matches)) return;
    var vids = document.querySelectorAll('.case-media video, .mini-media video');
    if (!vids.length) return;
    var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(en) {
            var v = en.target;
            var frame = v.closest('.case-media, .mini-media');
            if (en.isIntersecting) {
                if (!v.src && v.dataset.src) v.src = v.dataset.src;
                v.play().catch(function() {});
                if (frame) frame.classList.add('playing');
            } else {
                v.pause();
                if (frame) frame.classList.remove('playing');
            }
        });
    }, { threshold: 0.6 });
    vids.forEach(function(v) { io.observe(v); });
})();

/* ── Command palette (⌘K): jump anywhere, do anything ── */
(function() {
    var ITEMS = [
        { l: 'Work',                 k: 'Section', go: function() { jump('#work'); } },
        { l: 'About',                k: 'Section', go: function() { jump('#about'); } },
        { l: 'Skills',               k: 'Section', go: function() { jump('#skills'); } },
        { l: 'Experience',           k: 'Section', go: function() { jump('#experience'); } },
        { l: 'Contact',              k: 'Section', go: function() { jump('#contact'); } },
        { l: 'Lens',                 k: 'Project', go: function() { focusCard('lens'); } },
        { l: 'TaperSafe',            k: 'Project', go: function() { focusCard('tapersafe'); } },
        { l: 'After Effects Hub',    k: 'Project', go: function() { focusCard('ae-hub'); } },
        { l: '3D Medical Devices',   k: 'Project', go: function() { focusCard('medical-3d'); } },
        { l: 'InkForge',             k: 'Project', go: function() { focusCard('inkforge'); } },
        { l: 'Sprite Studio',        k: 'Project', go: function() { focusCard('sprite-studio'); } },
        { l: 'Cubelets',             k: 'Project', go: function() { focusCard('cubelets'); } },
        { l: 'AI Studio',            k: 'Project', go: function() { focusCard('ai-studio'); } },
        { l: 'YouTube Downloader',   k: 'Project', go: function() { focusCard('yt-downloader'); } },
        { l: 'Auto-Caption',         k: 'Project', go: function() { focusCard('auto-caption'); } },
        { l: 'Toggle light / dark',  k: 'Action',  go: function() { var b = document.getElementById('themeToggle'); if (b) b.click(); } },
        { l: 'Email me',             k: 'Action',  go: function() { var a = document.querySelector('.nav-cta'); if (a) a.click(); } },
        { l: 'Download resume',      k: 'Action',  go: function() { window.open('ilan-lenzner-cv.pdf', '_blank', 'noopener'); } },
        { l: 'Ask my AI',            k: 'Action',  go: function() { var b = document.querySelector('.agent-launcher'); if (b) b.click(); } },
        { l: 'GitHub',               k: 'Action',  go: function() { window.open('https://github.com/ilan-stack', '_blank', 'noopener'); } },
        { l: 'LinkedIn',             k: 'Action',  go: function() { window.open('https://www.linkedin.com/in/ilan-lenzner-395ba64/', '_blank', 'noopener'); } }
    ];

    function go(el, center) {
        if (!el) return;
        var r = el.getBoundingClientRect();
        var y = r.top + window.scrollY - (center ? Math.max(60, (window.innerHeight - r.height) / 2) : 60);
        if (window.__driveScrollTo) window.__driveScrollTo(y);
        else el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
    }
    function jump(sel) { go(document.querySelector(sel), false); }
    function focusCard(key) { go(document.querySelector('[data-focus="' + key + '"]'), true); }

    var root = document.createElement('div');
    root.className = 'cmdk';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Command menu');
    root.innerHTML =
        '<div class="cmdk-backdrop" data-close></div>' +
        '<div class="cmdk-card">' +
        '<input class="cmdk-input" type="text" placeholder="Where to? Type a project, section, or action…" aria-label="Search commands">' +
        '<div class="cmdk-list" role="listbox"></div>' +
        '<div class="cmdk-foot"><span><kbd>↑↓</kbd>navigate</span><span><kbd>↵</kbd>select</span><span><kbd>esc</kbd>close</span></div>' +
        '</div>';
    document.body.appendChild(root);

    var input = root.querySelector('.cmdk-input');
    var list = root.querySelector('.cmdk-list');
    var lastFocus = null, filtered = ITEMS, sel = 0;

    function render() {
        if (!filtered.length) {
            list.innerHTML = '<div class="cmdk-empty">Nothing matches - try "lens" or "email"</div>';
            return;
        }
        list.innerHTML = filtered.map(function(it, i) {
            return '<div class="cmdk-item' + (i === sel ? ' sel' : '') + '" role="option" data-i="' + i + '"' + (i === sel ? ' aria-selected="true"' : '') + '>' +
                '<span>' + it.l + '</span><span class="k">' + it.k + '</span></div>';
        }).join('');
        var s = list.querySelector('.sel');
        if (s) s.scrollIntoView({ block: 'nearest' });
    }
    function filter() {
        var q = input.value.trim().toLowerCase();
        filtered = q ? ITEMS.filter(function(it) {
            return (it.l + ' ' + it.k).toLowerCase().indexOf(q) !== -1;
        }) : ITEMS;
        sel = 0;
        render();
    }
    function open() {
        lastFocus = document.activeElement;
        root.hidden = false;
        document.body.style.overflow = 'hidden';
        input.value = '';
        filter();
        input.focus();
        trackEvent('cmdk-open');
    }
    function close() {
        root.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }
    function run(i) {
        var it = filtered[i];
        if (!it) return;
        close();
        it.go();
    }

    document.addEventListener('keydown', function(e) {
        if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            root.hidden ? open() : close();
            return;
        }
        if (root.hidden) return;
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); render(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
        else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    });
    input.addEventListener('input', filter);
    root.addEventListener('click', function(e) {
        if (e.target.closest('[data-close]')) { close(); return; }
        var item = e.target.closest('.cmdk-item');
        if (item) run(+item.dataset.i);
    });
    list.addEventListener('mousemove', function(e) {
        var item = e.target.closest('.cmdk-item');
        if (item && +item.dataset.i !== sel) { sel = +item.dataset.i; render(); }
    });
    var hint = document.getElementById('cmdkHint');
    if (hint) hint.addEventListener('click', open);
})();

/* ── Section rail: scrollspy index on wide screens ── */
(function() {
    var SECTIONS = [
        ['work', '01', 'Work'],
        ['about', '03', 'About'],
        ['skills', '04', 'Skills'],
        ['experience', '05', 'Experience'],
        ['contact', '06', 'Contact']
    ];
    var els = SECTIONS.map(function(s) { return document.getElementById(s[0]); });
    if (els.some(function(e) { return !e; })) return;

    // div, not <nav>: the site styles bare <nav> as the fixed blurred top bar
    var rail = document.createElement('div');
    rail.className = 'rail';
    rail.setAttribute('role', 'navigation');
    rail.setAttribute('aria-label', 'Section index');
    rail.innerHTML = SECTIONS.map(function(s) {
        return '<a href="#' + s[0] + '" data-sec="' + s[0] + '"><span class="rail-label">' + s[2] + '</span><span class="rail-idx">' + s[1] + '</span></a>';
    }).join('');
    document.body.appendChild(rail);
    var links = rail.querySelectorAll('a');

    var ticking = false;
    function update() {
        ticking = false;
        var mid = window.innerHeight * 0.45;
        var current = -1;
        els.forEach(function(el, i) {
            if (el.getBoundingClientRect().top <= mid) current = i;
        });
        links.forEach(function(a, i) { a.classList.toggle('active', i === current); });
    }
    window.addEventListener('scroll', function() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
})();

/* ── Footer: live Tel Aviv clock ── */
(function() {
    var el = document.getElementById('tlvClock');
    if (!el) return;
    var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
    function tick() { el.textContent = fmt.format(new Date()); }
    tick();
    setInterval(tick, 30000);
})();

/* ── For the ones who open the console ── */
try {
    console.log(
        '%cILAN LENZNER.%c\nCreative Technologist · Design Engineer\nHand-built, no frameworks. Press ⌘K.\n→ ilan@ilans.net',
        'font: 700 18px Inter, sans-serif; letter-spacing: 2px;',
        'font: 12px "JetBrains Mono", monospace; color: #8a7bff;'
    );
} catch (e) {}

/* ── In-page navigation: fully JS-driven, zero hash navigation.
   Native #hash links create history entries with stored scroll
   positions, and Chrome re-anchors to the current hash after layout
   changes - both were bouncing users around (the back-to-top bug).
   Every in-page jump now drives its own per-frame animation and
   keeps the URL clean, so there is nothing to restore or re-anchor.
   Only a deliberate user wheel/touch aborts a jump. ── */
(function() {
    var animating = false;

    function stripHash() {
        if (location.hash) {
            try { history.replaceState(null, '', location.pathname + location.search); } catch (err) {}
        }
    }

    function driveTo(targetY) {
        stripHash();
        targetY = Math.max(0, Math.round(targetY));
        if (REDUCED || document.hidden) {
            window.scrollTo({ top: targetY, behavior: 'instant' });
            return;
        }
        if (animating) return;
        animating = true;
        var html = document.documentElement;
        var prevBehavior = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto'; // frames must apply instantly
        var start = window.scrollY;
        var dist = Math.abs(targetY - start);
        var dur = Math.max(350, Math.min(900, dist * 0.12));
        var t0 = performance.now();
        var aborted = false;
        function onUser() { aborted = true; }
        window.addEventListener('wheel', onUser, { passive: true });
        window.addEventListener('touchstart', onUser, { passive: true });
        function done() {
            window.removeEventListener('wheel', onUser);
            window.removeEventListener('touchstart', onUser);
            html.style.scrollBehavior = prevBehavior;
            animating = false;
        }
        (function step(now) {
            if (aborted) return done();
            var t = Math.min((now - t0) / dur, 1);
            var e = 1 - Math.pow(1 - t, 3);
            window.scrollTo(0, Math.round(start + (targetY - start) * e));
            if (t < 1) requestAnimationFrame(step); else done();
        })(t0);
    }

    window.__driveScrollTo = driveTo; // shared with the command palette

    // Back to top
    document.querySelectorAll('.footer-top, .nav-logo').forEach(function(a) {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            driveTo(0);
        });
    });

    // Nav links, section rail, hero scroll hint: same driver, offset for the fixed nav
    document.querySelectorAll('.nav-links a[href^="#"], .rail a[href^="#"], .scroll-hint[href^="#"]').forEach(function(a) {
        a.addEventListener('click', function(e) {
            var target = document.querySelector(a.getAttribute('href'));
            if (!target) return; // fall back to native
            e.preventDefault();
            driveTo(target.getBoundingClientRect().top + window.scrollY - 60);
        });
    });
})();

/* ── PWA install: offer "Install app" in the mobile menu when Chrome
   says the site is installable. Hidden if already installed, and on
   iOS (no install API there). ── */
(function() {
    var navLinksEl = document.getElementById('navLinks');
    if (!navLinksEl) return;
    var deferred = null;
    var link = document.createElement('a');
    link.href = '#';
    link.className = 'nav-install';
    link.textContent = 'Install app';
    navLinksEl.appendChild(link);

    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault(); // suppress Chrome's own mini-infobar
        deferred = e;
        link.classList.add('available');
    });
    link.addEventListener('click', function(e) {
        e.preventDefault();
        if (!deferred) return;
        deferred.prompt();
        deferred.userChoice.then(function(res) {
            trackEvent('pwa-install-' + res.outcome);
            deferred = null;
            link.classList.remove('available');
        });
        setBurger(false);
    });
    window.addEventListener('appinstalled', function() {
        link.classList.remove('available');
        trackEvent('pwa-installed');
    });
})();
