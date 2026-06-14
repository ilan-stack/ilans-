/* ============================================================
   ilans.net case studies - scroll reveal + background parallax
   ============================================================ */
(function () {
  'use strict';

  /* ---- scroll reveal ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (e) { io.observe(e); });
  } else {
    revealEls.forEach(function (e) { e.classList.add('visible'); });
  }

  /* ---- background parallax (backgrounds only, reduced-motion safe) ---- */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SCALE = 1.26;            // baseline oversize so drift never reveals an edge
  var layers = [];

  // hero background: drifts with absolute scroll (it lives at the top)
  var hero = document.querySelector('.cs-hero__bg img');
  if (hero) layers.push({ el: hero, type: 'hero', speed: 0.10 });

  // mid-page full-bleed section backgrounds (e.g. KaHuNuts): drift by viewport position
  document.querySelectorAll('.cs-kahu__bg img').forEach(function (img) {
    var sec = img.closest('.cs-kahu');
    if (sec) layers.push({ el: img, type: 'section', section: sec, speed: 0.07 });
  });

  if (!layers.length) return;
  layers.forEach(function (l) { l.el.style.willChange = 'transform'; });

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i], dy = 0;
      if (l.type === 'hero') {
        dy = window.scrollY * l.speed;
      } else {
        var r = l.section.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;     // off-screen: skip
        dy = -((r.top + r.height / 2) - vh / 2) * l.speed;
      }
      l.el.style.transform = 'translate3d(0,' + dy.toFixed(1) + 'px,0) scale(' + SCALE + ')';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
