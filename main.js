/* ── Nav scroll ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
});

/* ── Mobile burger menu ── */
const burger = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
    });
});
document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !nav.contains(e.target)) {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
    }
});

/* ── Reveal on scroll ── */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ── Parallax: content recedes, scatters & fades on scroll ── */
(function() {
    const readyEls = new Map();
    const heroContent = document.querySelector('.hero-content');
    const SCATTER_AT = 0.3; // scatter begins at 30% of parallax progress

    // Pre-compute random scatter directions for each child
    function initScatter(el) {
        if (el._scatter) return;
        el._scatter = [];
        var n = el.children.length;
        for (var i = 0; i < n; i++) {
            var angle = (Math.PI * 2 / n) * i + (Math.random() - 0.5) * 1.2;
            var dist = 400 + Math.random() * 600;
            el._scatter.push({
                tx: Math.cos(angle) * dist,
                ty: Math.sin(angle) * dist - 150,
                rot: (Math.random() - 0.5) * 80
            });
        }
    }

    // Apply parallax + scatter to an element based on progress (0 to 1)
    function applyEffect(el, progress) {
        initScatter(el);
        var children = el.children;

        // Parent: only transform (no opacity — children handle visibility)
        el.style.overflow = 'visible';
        el.style.opacity = '1';
        el.style.transform = 'translateY(' + (-progress * 250) + 'px)';

        if (progress < SCATTER_AT) {
            // Pre-scatter: children fade slightly together
            var fade = progress / SCATTER_AT; // 0 to 1
            for (var i = 0; i < children.length; i++) {
                children[i].style.transform = 'scale(' + (1 - fade * 0.15) + ')';
                children[i].style.opacity = String(1 - fade * 0.3);
                children[i].style.filter = '';
            }
        } else {
            // Scatter: each child flies in its own direction
            var raw = (progress - SCATTER_AT) / (1 - SCATTER_AT); // 0 to 1
            var ep = raw * raw;
            for (var i = 0; i < children.length; i++) {
                var d = el._scatter[i % el._scatter.length];
                children[i].style.transform = 'translate(' + (d.tx * ep) + 'px,' + (d.ty * ep) + 'px) rotate(' + (d.rot * ep) + 'deg) scale(' + (0.85 - ep * 0.4) + ')';
                children[i].style.opacity = String(Math.max(0, 0.7 - ep * 0.9));
                children[i].style.filter = 'blur(' + (ep * 8) + 'px)';
            }
        }
    }

    // Reset element and its children
    function resetEffect(el) {
        el.style.opacity = '';
        el.style.transform = el.dataset.tilt || '';
        el.style.overflow = '';
        var children = el.children;
        for (var i = 0; i < children.length; i++) {
            children[i].style.transform = '';
            children[i].style.opacity = '';
            children[i].style.filter = '';
        }
    }

    function tick() {
        var vh = window.innerHeight;
        var now = performance.now();

        // Hero parallax + scatter
        if (heroContent) {
            var scrollT = Math.min(1, Math.max(0, window.scrollY / (vh * 0.35)));
            if (scrollT > 0.01) {
                applyEffect(heroContent, scrollT);
            } else {
                resetEffect(heroContent);
            }
        }

        // Section content parallax + scatter
        document.querySelectorAll('.reveal.visible').forEach(function(el) {
            if (!readyEls.has(el)) {
                readyEls.set(el, now);
                return;
            }
            if (now - readyEls.get(el) < 700) return;
            el.style.transition = 'none';

            var rect = el.getBoundingClientRect();
            var center = rect.top + rect.height / 2;

            if (center < vh * 0.35) {
                var t = Math.min(1, (vh * 0.35 - center) / (vh * 0.4));
                applyEffect(el, t * t);
            } else {
                resetEffect(el);
            }
        });

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();

/* ── Video hover on project cards ── */
document.querySelectorAll('.project-card').forEach(function(card) {
    var video = card.querySelector('video');
    if (!video) return;
    card.addEventListener('mouseenter', function() {
        video.currentTime = 0;
        video.play().catch(function() {});
    });
    card.addEventListener('mouseleave', function() {
        video.pause();
        video.currentTime = 0;
    });
});

/* ── Hero typing effect ── */
(function() {
    var phrases = [
        'autonomous pipelines that ship playable ads end-to-end',
        'AI tools used daily by production teams',
        'GenAI workflows that replaced 3-day manual processes',
        'After Effects extensions with 10 AI modules',
        'production systems processing thousands of creative assets',
        'cross-functional tools built with artists, devs & PMs',
    ];
    var el = document.getElementById('heroTyped');
    if (!el) return;
    var cursor = el.querySelector('.cursor');
    var idx = 0, charIdx = 0, deleting = false;
    var typeSpeed = 45, deleteSpeed = 25, holdTime = 2200, pauseTime = 400;

    function tick() {
        var phrase = phrases[idx];
        if (!deleting) {
            charIdx++;
            el.textContent = phrase.substring(0, charIdx);
            el.appendChild(cursor);
            if (charIdx >= phrase.length) {
                setTimeout(function() { deleting = true; tick(); }, holdTime);
                return;
            }
            setTimeout(tick, typeSpeed);
        } else {
            charIdx--;
            el.textContent = phrase.substring(0, charIdx);
            el.appendChild(cursor);
            if (charIdx <= 0) {
                deleting = false;
                idx = (idx + 1) % phrases.length;
                setTimeout(tick, pauseTime);
                return;
            }
            setTimeout(tick, deleteSpeed);
        }
    }
    setTimeout(tick, 800);
})();

/* ── Force-field dot grid with dot-matrix banner ── */
(function() {
    const canvas = document.getElementById('dotfield');
    const ctx = canvas.getContext('2d');
    const SPACING = 8;
    const DOT_R = 0.5;
    const PLUS_SIZE = 1.0;
    const EFFECT_RADIUS = 150;
    const REPEL_FORCE = 5;
    const HEAL_FACTOR = 0.04;
    const DAMPING = 0.92;

    // Banner messages — text, images, and videos with real colors
    const MESSAGES = [
        { text: 'ILAN LENZNER', scale: 0.9 },
        { video: 'videos/dnc4.mp4', bgFilter: 147 },
        { text: 'AI + DESIGN', scale: 0.9 },
        { video: 'videos/ilans-talk.mp4', bgFilter: 'grey' },
        { image: 'images/rhino.png' },
        { video: 'videos/portrait-anim.mp4' },
        { text: '45+ TOOLS', scale: 0.9 },
        { text: 'CREATIVE TECH', scale: 0.9 },
    ];
    const MSG_DURATION = 200;   // frames to hold each message
    const FADE_FRAMES = 50;     // frames for fade in/out

    // Preload images
    var imageCache = {};
    // Preload videos
    var videoCache = {};
    var activeVideo = null;     // currently playing video element

    MESSAGES.forEach(function(msg) {
        if (msg.image && !imageCache[msg.image]) {
            var img = new Image();
            img.src = msg.image;
            imageCache[msg.image] = img;
        }
        if (msg.video && !videoCache[msg.video]) {
            var vid = document.createElement('video');
            vid.src = msg.video;
            vid.muted = true;
            vid.loop = true;
            vid.playsInline = true;
            vid.preload = 'auto';
            vid.load();
            videoCache[msg.video] = vid;
        }
    });

    let W, H, cols, rows, particles;
    let mouseX = -9999, mouseY = -9999;
    let frame = 0;
    let msgIndex = 0;
    let litMap = null;           // Set of "col,row" strings that are lit
    let offCanvas, offCtx;       // offscreen canvas for text sampling

    function init() {
        const dpr = window.devicePixelRatio || 1;
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
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const hx = c * SPACING;
                const hy = r * SPACING;
                particles.push({
                    hx: hx, hy: hy,
                    x: hx, y: hy,
                    vx: 0, vy: 0,
                    col: c, row: r,
                    baseShape: (r + c) % 2 === 0 ? 'dot' : 'plus',
                    lit: 0          // 0-1 glow intensity
                });
            }
        }

        // Create offscreen canvas for text sampling
        offCanvas = document.createElement('canvas');
        offCanvas.width = cols;
        offCanvas.height = rows;
        offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        // Sample first message
        sampleMessage(MESSAGES[0]);
    }

    // Store lit pixels as relative offsets from center, with optional color
    var litPixels = [];   // [{dc, dr, r, g, b}, ...]
    var currentIsImage = false;
    var currentIsVideo = false;
    var currentBgFilter = null;

    function sampleMessage(msg) {
        // Stop any previously playing video
        if (activeVideo) {
            activeVideo.pause();
            activeVideo = null;
        }

        if (msg.video) {
            currentIsImage = true;
            currentIsVideo = true;
            currentBgFilter = msg.bgFilter || null;
            var vid = videoCache[msg.video];
            if (vid) {
                vid.currentTime = 0;
                vid.play().catch(function() {});
                activeVideo = vid;
                // Sample first frame immediately
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
                    // Background removal per video type
                    if (msg.bgFilter === 'grey') {
                        var maxC = Math.max(R, G, B), minC = Math.min(R, G, B);
                        if (maxC - minC < 35) continue;
                    } else if (typeof msg.bgFilter === 'number') {
                        // Remove pixels near a specific luminance (uniform bg)
                        if (Math.abs(lum - msg.bgFilter) < 18) continue;
                    }
                }
                litPixels.push({ dc: c - cx, dr: r - cy, r: R, g: G, b: B });
            }
        }
        updateLitMap();
    }

    var litColorMap = {};  // "col,row" -> {r,g,b}

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
        ctx.clearRect(0, 0, W, H);

        frame++;

        // Cycle messages
        var cycleFrame = frame % (MSG_DURATION + FADE_FRAMES * 2);
        if (cycleFrame === 0) {
            msgIndex = (msgIndex + 1) % MESSAGES.length;
            sampleMessage(MESSAGES[msgIndex]);
        }

        // Re-sample video frame every 3rd frame for live animation
        if (currentIsVideo && activeVideo && activeVideo.readyState >= 2 && frame % 3 === 0) {
            sampleVideoFrame(activeVideo);
        }

        // Update floating position every frame
        updateLitMap();

        // Calculate banner fade (0 to 1)
        var bannerAlpha = 1;
        if (cycleFrame < FADE_FRAMES) {
            bannerAlpha = cycleFrame / FADE_FRAMES;           // fade in
        } else if (cycleFrame > MSG_DURATION + FADE_FRAMES) {
            bannerAlpha = 1 - (cycleFrame - MSG_DURATION - FADE_FRAMES) / FADE_FRAMES;  // fade out
        }

        var radius = EFFECT_RADIUS + Math.sin(frame / 15) * 30;
        var radiusSq = radius * radius;

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // Is this particle part of the text/image?
            var key = p.col + ',' + p.row;
            var isLit = litMap && litMap.has(key);
            var pixelColor = litColorMap[key] || null;

            // Smooth glow transition
            var targetLit = isLit ? bannerAlpha : 0;
            p.lit += (targetLit - p.lit) * 0.12;

            // Mouse repulsion
            var dx = p.x - mouseX;
            var dy = p.y - mouseY;
            var distSq = dx * dx + dy * dy;
            if (distSq < radiusSq && distSq > 0) {
                var dist = Math.sqrt(distSq);
                var strength = (1 - dist / radius) * REPEL_FORCE;
                p.vx += (dx / dist) * strength;
                p.vy += (dy / dist) * strength;
            }

            // Spring back
            p.vx += (p.hx - p.x) * HEAL_FACTOR;
            p.vy += (p.hy - p.y) * HEAL_FACTOR;
            p.vx *= DAMPING;
            p.vy *= DAMPING;
            p.x += p.vx;
            p.y += p.vy;

            // Determine appearance
            var glow = p.lit;
            var baseAlpha = (p.col + p.row) % 3 === 0 ? 0.18 : 0.12;
            var alpha = baseAlpha + glow * 0.65;
            var r_c, g_c, b_c;

            if (pixelColor && currentIsImage && glow > 0.05) {
                // Image mode: interpolate from grey toward actual pixel color
                r_c = Math.round(255 * (1 - glow) + pixelColor.r * glow);
                g_c = Math.round(255 * (1 - glow) + pixelColor.g * glow);
                b_c = Math.round(255 * (1 - glow) + pixelColor.b * glow);
                alpha = baseAlpha + glow * 0.82;
            } else {
                // Text mode: glow purple
                r_c = Math.round(255 - glow * 131);   // 255 -> 124
                g_c = Math.round(255 - glow * 163);   // 255 -> 92
                b_c = Math.round(255 - glow * 3);     // 255 -> 252
            }
            var color = 'rgba(' + r_c + ',' + g_c + ',' + b_c + ',' + alpha + ')';

            // Lit particles flip shape: dots become +, pluses become dots
            var shape = p.baseShape;
            if (glow > 0.3) {
                shape = shape === 'dot' ? 'plus' : 'dot';
            }

            if (shape === 'dot') {
                var dotR = DOT_R + glow * (pixelColor && currentIsImage ? 1.8 : 1.2);
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

        requestAnimationFrame(animate);
    }

    // Pointer events
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

    window.addEventListener('resize', init);
    init();
    animate();
})();

/* ── Wavy-line + pen: JS-driven so pen & stroke share exact arc-length sync ── */
(function(){
    var thin  = document.getElementById('heroWaveThin');
    var thick = document.getElementById('heroWaveThick');
    var pen   = document.getElementById('heroWavePen');
    if (!thin) return;

    var L = thin.getTotalLength();
    thin.style.strokeDasharray  = L;
    thin.style.strokeDashoffset = L;
    thick.style.strokeDasharray  = L;
    thick.style.strokeDashoffset = L;

    var DUR = 6300;            // total cycle ms
    var DRAW_END  = 0.24;      // draw: 1.5s
    var HOLD_END  = 0.71;      // hold: 3s
    var FADE_END  = 0.84;      // fade: 0.8s, then pause until restart
    var start = null;

    /* ease-in-out (matches cubic-bezier 0.42,0,0.58,1) */
    function ease(t){ return 0.5 - 0.5 * Math.cos(Math.PI * t); }

    function tick(ts){
        if (!start) start = ts;
        var t = ((ts - start) % DUR) / DUR;

        var draw, lineOp, penOp;

        if (t < DRAW_END) {
            draw   = ease(t / DRAW_END);
            lineOp = 1;
            penOp  = t < 0.01 ? 0 : 0.9;
        } else if (t < HOLD_END) {
            draw   = 1;
            lineOp = 1;
            penOp  = Math.max(0, 0.9 * (1 - (t - DRAW_END) / 0.05));
        } else if (t < FADE_END) {
            draw   = 1;
            lineOp = 1 - (t - HOLD_END) / (FADE_END - HOLD_END);
            penOp  = 0;
        } else {
            draw   = 0;
            lineOp = 0;
            penOp  = 0;
        }

        var off = L * (1 - draw);
        thin.style.strokeDashoffset  = off;
        thick.style.strokeDashoffset = off;
        thin.style.opacity  = lineOp;
        thick.style.opacity = lineOp;

        /* pen sits exactly where the stroke has been drawn to */
        var pt = thin.getPointAtLength(draw * L);
        pen.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
        pen.style.opacity = penOp;

        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
})();

/* ── 3D tilt on project cards ── */
document.querySelectorAll('.project-card').forEach(function(card) {
    var tiltX = 0, tiltY = 0, targetX = 0, targetY = 0, rafId = null;

    function lerp() {
        tiltX += (targetX - tiltX) * 0.08;
        tiltY += (targetY - tiltY) * 0.08;
        var tilt = 'perspective(800px) rotateY(' + tiltX + 'deg) rotateX(' + tiltY + 'deg) translateY(-4px)';
        card.dataset.tilt = tilt;
        card.style.transform = tilt;
        if (Math.abs(targetX - tiltX) > 0.01 || Math.abs(targetY - tiltY) > 0.01) {
            rafId = requestAnimationFrame(lerp);
        } else {
            // Snap to target
            if (targetX === 0 && targetY === 0) {
                delete card.dataset.tilt;
                card.style.transform = '';
                rafId = null;
            }
        }
    }

    card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        targetX = x * 6;
        targetY = -y * 6;
        if (!rafId) rafId = requestAnimationFrame(lerp);
    });
    card.addEventListener('mouseleave', function() {
        targetX = 0;
        targetY = 0;
        if (!rafId) rafId = requestAnimationFrame(lerp);
    });
});

/* ── Animated stat counters ── */
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
        var duration = 1500;
        var start = performance.now();
        requestAnimationFrame(function step(now) {
            var t = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (t < 1) requestAnimationFrame(step);
        });
    }

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

/* ── Magnetic buttons ── */
document.querySelectorAll('.btn').forEach(function(btn) {
    btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.15) + 'px,' + (y * 0.15) + 'px)';
    });
    btn.addEventListener('mouseleave', function() {
        btn.style.transform = '';
    });
});
