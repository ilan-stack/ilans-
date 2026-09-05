/* ilans.net/writing - theme toggle, reading progress, topic filter.
   The pre-paint theme boot lives inline in each page's <head>; this only wires the control.
   Same localStorage key ('theme') as the main site, so the preference carries across. */
(function () {
  'use strict';

  /* ── theme toggle (dark is the default; light is opt-in + persisted) ── */
  var themeLight = document.documentElement.getAttribute('data-theme') === 'light';
  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.setAttribute('aria-pressed', themeLight ? 'true' : 'false');
    btn.addEventListener('click', function () {
      themeLight = !themeLight;
      if (themeLight) document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
      btn.setAttribute('aria-pressed', themeLight ? 'true' : 'false');
      var tc = document.getElementById('themeColorMeta');
      if (tc) tc.setAttribute('content', themeLight ? '#faf9f7' : '#0b0b0d');
      try { localStorage.setItem('theme', themeLight ? 'light' : 'dark'); } catch (e) {}
    });
  }

  /* ── reading progress (article pages) ── */
  var bar = document.getElementById('progress');
  if (bar) {
    var upd = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  }

  /* ── topic filter (index) ── */
  var chips = document.querySelectorAll('.chip');
  var posts = Array.prototype.slice.call(document.querySelectorAll('#posts .post'));
  var empty = document.getElementById('empty');
  if (chips.length && posts.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        var shown = 0;
        posts.forEach(function (p) {
          var ok = (f === 'all') || (' ' + p.dataset.tags + ' ').indexOf(' ' + f + ' ') > -1;
          p.classList.toggle('hidden', !ok);
          if (ok) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  }
})();
