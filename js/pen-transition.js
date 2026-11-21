/* ilans.net page transition: the hero's pen line carries you to the CV.
   Home: a click on a CV link -> the line thinks in one quick infinity loop, then its light floods the screen.
   CV:   the light opens back up from the name, and the line slides in and settles under it as an underline.
   Hand-off: sessionStorage 'penArrive', read before first paint by a small inline script in the CV <head>
   (cv-build/build.py writes it), which covers the page until this file takes over.
   Skipped for reduced motion, modified clicks (new tab / window) and anything that is not a plain left click. */
(() => {
'use strict';
const root = document.documentElement;
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = t => Math.max(0, Math.min(1, t));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const isLight = () => root.getAttribute('data-theme') === 'light';
// the hero squiggle's own colours (darker violet on the light theme)
const PEN = () => isLight() ? ['#5b4de0', '#8a7bff', '#4d3ed1'] : ['#8a7bff', '#c4b9ff', '#8a7bff'];
const RIM = () => isLight() ? ['91,77,224', '138,123,255', '34,180,210'] : ['138,123,255', '246,243,255', '34,211,238'];
const bgColor = () => getComputedStyle(document.body).backgroundColor || (isLight() ? '#faf9f7' : '#0b0b0d');

function overlay() {
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;display:block';
  document.body.appendChild(c);
  const r = c.getBoundingClientRect(), W = r.width, H = r.height, DPR = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
  const ctx = c.getContext('2d'); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  return { c, ctx, W, H };
}

// A route through points (Catmull-Rom), walked by arc length, so a line can follow it like a snake.
function catmull(P, k) {
  const n = P.length - 1, x = Math.min(n - 1e-6, Math.max(0, k * n)), i = Math.floor(x), f = x - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  const c = j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * f + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * f * f + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * f * f * f);
  return [c(0), c(1)];
}
function route(P) {
  const K = 600, L = [0]; let prev = catmull(P, 0);
  for (let i = 1; i <= K; i++) { const q = catmull(P, i / K); L.push(L[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1])); prev = q; }
  const len = L[K], n = P.length - 1;
  return {
    len,
    fracAt: j => L[Math.round(j / n * K)] / len,
    at(f) {
      f = clamp01(f) * len; let lo = 0, hi = K;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < f) lo = m; else hi = m; }
      return catmull(P, (lo + (f - L[lo]) / ((L[hi] - L[lo]) || 1)) / K);
    },
  };
}
// the body: N+1 points from the tail (index 0) to the head, all on the route
function snake(R, fHead, fBody, N) {
  const out = [];
  for (let i = 0; i <= N; i++) out.push(R.at(fHead - fBody * (1 - i / N)));
  return out;
}

function drawLine(ctx, pts, alpha, w, dy) {
  if (alpha <= 0.01 || pts.length < 2) return;
  dy = dy || 0;
  const S = PEN(), A = pts[0], Z = pts[pts.length - 1];
  const path = new Path2D(); path.moveTo(A[0], A[1] + dy);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1] + dy);
  const grad = ctx.createLinearGradient(A[0], A[1] + dy, Z[0], Z[1] + dy);
  grad.addColorStop(0, S[0]); grad.addColorStop(0.5, S[1]); grad.addColorStop(1, S[2]);
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = grad;
  ctx.globalAlpha = alpha * 0.28; ctx.lineWidth = w * 2.2; ctx.shadowColor = S[0]; ctx.shadowBlur = 8; ctx.stroke(path);
  ctx.globalAlpha = alpha; ctx.lineWidth = w; ctx.shadowBlur = 0; ctx.stroke(path);
  // the full stop that leads it
  ctx.fillStyle = S[0]; ctx.shadowColor = S[0]; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(Z[0], Z[1] + dy, w * 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// The light front: a soft ring in the brand colours at radius r around (x, y).
function rim(ctx, x, y, r, width, k) {
  if (r <= 0 || k <= 0.01) return;
  const C = RIM(), a = isLight() ? 0.55 : 0.8, r0 = Math.max(0, r - width), r1 = r + width * 0.35;
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  g.addColorStop(0, `rgba(${C[0]},0)`);
  g.addColorStop(0.55, `rgba(${C[0]},${0.35 * a * k})`);
  g.addColorStop(0.78, `rgba(${C[1]},${a * k})`);
  g.addColorStop(0.9, `rgba(${C[2]},${0.45 * a * k})`);
  g.addColorStop(1, `rgba(${C[2]},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r1, 0, Math.PI * 2); ctx.fill();
}
const reach = (x, y, W, H) => Math.hypot(Math.max(x, W - x), Math.max(y, H - y));

/* ---------------- leaving: home -> CV ---------------- */
let leaving = null;
function squiggle(N) {
  const path = document.getElementById('heroWaveThin'), svg = path && path.ownerSVGElement;
  if (!svg) return null;
  const r = svg.getBoundingClientRect();
  if (!r.width || r.bottom < 0 || r.top > window.innerHeight) return null;
  const vb = svg.viewBox.baseVal, sc = Math.min(r.width / vb.width, r.height / vb.height);
  const ox = r.left + (r.width - vb.width * sc) / 2 - vb.x * sc, oy = r.top + (r.height - vb.height * sc) / 2 - vb.y * sc;
  const len = path.getTotalLength(), pts = [];
  for (let i = 0; i <= N; i++) { const p = path.getPointAtLength(len * i / N); pts.push([ox + p.x * sc, oy + p.y * sc]); }
  return pts;
}
function underButton(a, N) {
  const r = a.getBoundingClientRect(), x0 = r.left + r.width * 0.15, x1 = r.right - r.width * 0.15, y = r.bottom + 7, pts = [];
  for (let i = 0; i <= N; i++) { const k = i / N; pts.push([lerp(x0, x1, k), y + Math.sin(k * Math.PI * 2.5) * 2.5]); }
  return pts;
}
function leave(a, href) {
  const o = overlay(), { ctx, W, H } = o, N = 40;
  const sq = squiggle(N), start = sq || underButton(a, N);
  // the hero's squiggle lifts off the page: hide the original while the line is on its way
  const wrap = sq && document.querySelector('.hero-wavy-wrap');
  if (wrap) { wrap.style.visibility = 'hidden'; o.restore = () => { wrap.style.visibility = ''; }; }
  const head = start[N], prev = start[N - 3];
  let dx = head[0] - prev[0], dy = head[1] - prev[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const m = Math.min(W, H), inf = Math.max(22, Math.min(46, m * 0.05));
  // one quick infinity loop just past the line's end, long axis along the way it points, then a flick up and on
  const C = [head[0] + dx * inf * 1.4, head[1] + dy * inf * 1.4], nx = -dy, ny = dx, loop = [];
  for (let j = 0; j <= 12; j++) {
    const th = Math.PI / 2 + Math.PI * 2 * j / 12, q = 1 + Math.sin(th) ** 2;
    const lx = inf * Math.cos(th) / q, ly = inf * Math.sin(th) * Math.cos(th) / q * 1.25;
    loop.push([C[0] + dx * lx + nx * ly, C[1] + dy * lx + ny * ly]);
  }
  const away = [C[0] + dx * inf * 2.6, C[1] + dy * inf * 2.6 - inf * 0.9];
  const tail = [0, 8, 16, 24, 32, 40].map(i => start[i]);
  const R = route(tail.concat(loop, [away]));
  const f0 = R.fracAt(5), body = f0;               // the body is as long as the line it was
  const burstAt = 0.34, END = 0.7;
  let burst = null, t0 = 0;
  leaving = o;
  try { sessionStorage.setItem('penArrive', String(Date.now() + END * 1000)); } catch (e) {}
  function frame(now) {
    if (leaving !== o) return;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    const u = seg(t, 0, burstAt + 0.08), fHead = lerp(f0, 1, easeInOut(u));
    // once the light bursts, the line pours itself into it
    const pour = 1 - easeInOut(seg(t, burstAt, burstAt + 0.14));
    const pts = snake(R, fHead, body * (1 - 0.15 * Math.sin(Math.PI * u)) * Math.max(0.02, pour), N);
    if (t >= burstAt && !burst) burst = pts[N].slice();
    if (burst) {
      // the light the line carries floods out from its head and leaves the next page's ground behind it
      const k = easeOut(seg(t, burstAt, END) ** 1.6), max = reach(burst[0], burst[1], W, H) + 60, r = max * k;
      ctx.fillStyle = bgColor();
      ctx.beginPath(); ctx.arc(burst[0], burst[1], Math.max(0, r - 18), 0, Math.PI * 2); ctx.fill();
      rim(ctx, burst[0], burst[1], r, Math.max(60, m * 0.16), 1 - seg(t, END - 0.12, END));
    }
    drawLine(ctx, pts, 1 - seg(t, burstAt + 0.06, burstAt + 0.16), 1.6);
    if (t >= END) {
      ctx.fillStyle = bgColor(); ctx.fillRect(0, 0, W, H);
      location.href = href;
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function cvLink(el) {
  const a = el && el.closest && el.closest('a[href]');
  if (!a) return null;
  const h = a.getAttribute('href');
  return /^(\.\/|\/)?cv\/?(index\.html)?$/.test(h) ? a : null;
}
function onClick(e) {
  const a = cvLink(e.target);
  if (!a || RM || leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target && a.target !== '_self') return;
  if (document.getElementById('intro')) return;               // the intro still owns the screen
  e.preventDefault();
  leave(a, a.href);
}
let prefetched = false;
function prefetch(e) {
  if (prefetched || !cvLink(e.target)) return;
  prefetched = true;
  const l = document.createElement('link'); l.rel = 'prefetch'; l.href = cvLink(e.target).href; document.head.appendChild(l);
}
if (!root.classList.contains('pen-arrive')) {
  document.addEventListener('click', onClick);
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('touchstart', prefetch, { passive: true });
  // coming Back from the CV: the page may be restored as it was left, cover and all
  window.addEventListener('pageshow', e => {
    if (leaving) { leaving.c.remove(); if (leaving.restore) leaving.restore(); leaving = null; }
    try { sessionStorage.removeItem('penArrive'); } catch (err) {}
  });
}

/* ---------------- arriving: the CV ---------------- */
function arrive() {
  if (!root.classList.contains('pen-arrive')) return;          // the head script's safety timer already lifted the cover
  const h1 = document.querySelector('header.hero h1') || document.querySelector('h1');
  const o = overlay(), { ctx, W, H } = o, N = 48;
  ctx.fillStyle = bgColor(); ctx.fillRect(0, 0, W, H);
  root.classList.remove('pen-arrive');                         // the canvas holds the cover from here
  if (!h1) { o.c.remove(); return; }
  // the underline: under the name's own text, not the whole block
  const range = document.createRange(); range.selectNodeContents(h1);
  const tr = range.getBoundingClientRect(), r0 = tr.width ? tr : h1.getBoundingClientRect();
  // just under the letters: measured from the baseline (the text box also holds empty descender room)
  const fs = parseFloat(getComputedStyle(h1).fontSize) || r0.height;
  const probe = document.createElement('span');
  probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  h1.appendChild(probe); const base = probe.getBoundingClientRect().top; probe.remove();
  const x0 = r0.left, x1 = r0.right, y = (base || r0.bottom) + Math.max(5, fs * 0.11), top0 = h1.getBoundingClientRect().top;
  const ul = [];
  for (let i = 0; i <= 8; i++) { const k = i / 8; ul.push([lerp(x0, x1, k), y + Math.sin(k * Math.PI * 3) * Math.min(3.5, fs * 0.04)]); }
  const span = x1 - x0;
  // it slides in from the left, below the name, curls up into place and runs along under it
  const lead = [[x0 - span * 1.15, y + span * 0.32], [x0 - span * 0.6, y + span * 0.3], [x0 - span * 0.2, y + span * 0.12]];
  const R = route(lead.concat(ul));
  const fU = R.fracAt(3), body = 1 - fU;                       // body = exactly the underline
  const cx = x0 + span * 0.1, cy = y, max = reach(cx, cy, W, H) + 60, m = Math.min(W, H);
  const OPEN = 0.55, HOLD = 1.4, FADE = 1.9;
  let t0 = 0;
  function frame(now) {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000, dy = h1.getBoundingClientRect().top - top0;
    ctx.clearRect(0, 0, W, H);
    // the light opens from the name and lets the page through
    const k = easeOut(seg(t, 0, OPEN)), r = max * k;
    if (k < 1) {
      ctx.fillStyle = bgColor(); ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(cx, cy + dy, Math.max(0, r - 30), cx, cy + dy, r + 1);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy + dy, r + 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy + dy, Math.max(0, r - 30), 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
      ctx.restore();
    }
    rim(ctx, cx, cy + dy, r, Math.max(60, m * 0.16), 1 - seg(t, OPEN * 0.6, OPEN));
    // the line: in along the curve, then it rests as the underline and fades
    const u = easeInOut(seg(t, 0.05, OPEN + 0.05));
    const pts = snake(R, lerp(fU, 1, u), body, N);
    const w = Math.max(1.3, Math.min(1.9, fs * 0.021));     // a fine stroke, not a marker
    drawLine(ctx, pts, 1 - seg(t, HOLD, FADE), w, dy);
    if (t >= FADE) { o.c.remove(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
if (root.classList.contains('pen-arrive')) {
  const go = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(arrive, arrive);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
}
})();
