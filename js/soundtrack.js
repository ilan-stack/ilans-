/* ── Soundtrack: an opt-in score for the homepage ──
   Off by default; nothing is downloaded until the visitor presses the
   nav button. Once on, the live signal is analysed every frame and shared
   with the hero dotfield (main.js) through window.__soundFx:
   - levels[]: a smoothed log-frequency spectrum (bass first) + falling peaks,
     drawn as a dot-matrix LED equalizer hanging from the top of the hero (~200px)
   - kick: a sharp envelope from bass onsets, the whole field thumps on it
   The mix goes behind a wall (low-pass) while you read, opens again at the
   hero and at contact, and ducks while AI Ilan talks.
   The choice is remembered; a remembered "on" resumes on the first tap or key. ── */
(function() {
    var btn = document.getElementById('soundToggle');
    if (!btn) return;

    var SRC = 'audio/soundtrack.m4a?v=1';
    var KEY = 'soundtrack';
    var VOL = 0.8;              // master level when fully open
    var DUCK = 0.16;            // level while AI Ilan speaks
    var OPEN_HZ = 20000, WALL_HZ = 950;
    var N = 48;                 // spectrum bands handed to the dotfield
    var F_LO = 38, F_HI = 13000;

    var audio = null, ac = null, gain = null, filter = null;
    var specAn = null, kickAn = null, spec = null, kspec = null, bandBins = null, kickBins = null;
    var on = false, raf = 0, wantOn = false;
    var bars = btn.querySelectorAll('.eq i');

    var fx = window.__soundFx = {
        on: false, N: N,
        levels: new Float32Array(N), peaks: new Float32Array(N),
        kick: 0, high: 0,
        bar: -1, time: 0, duration: 0
    };
    // The track's bar grid (136 BPM, first downbeat 0.064 s), measured on the master
    var BAR = 240 / 136.0076, BAR0 = 0.064;
    var bMean = new Float32Array(N), bDev = new Float32Array(N).fill(6);
    var bassSlow = 0;

    function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
    function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    function track(p) { if (typeof trackEvent === 'function') trackEvent(p); }

    function build() {
        if (audio) return;
        audio = new Audio();
        audio.src = SRC;
        audio.loop = true;
        audio.preload = 'auto';
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        var src = ac.createMediaElementSource(audio);
        // Two taps on the dry signal: a smoothed one for the equalizer, a raw one for kick onsets
        specAn = ac.createAnalyser(); specAn.fftSize = 2048; specAn.smoothingTimeConstant = 0.3;
        kickAn = ac.createAnalyser(); kickAn.fftSize = 1024; kickAn.smoothingTimeConstant = 0;
        spec = new Float32Array(specAn.frequencyBinCount);
        kspec = new Float32Array(kickAn.frequencyBinCount);
        filter = ac.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = OPEN_HZ; filter.Q.value = 0.7;
        gain = ac.createGain(); gain.gain.value = 0;
        src.connect(specAn); src.connect(kickAn);
        src.connect(filter); filter.connect(gain); gain.connect(ac.destination);

        // Log-spaced band edges -> FFT bin ranges
        var hz = ac.sampleRate / specAn.fftSize;
        bandBins = [];
        for (var b = 0; b < N; b++) {
            var f0 = F_LO * Math.pow(F_HI / F_LO, b / N), f1 = F_LO * Math.pow(F_HI / F_LO, (b + 1) / N);
            var i0 = Math.max(1, Math.floor(f0 / hz)), i1 = Math.max(i0, Math.floor(f1 / hz));
            bandBins.push(i0, i1);
        }
        var khz = ac.sampleRate / kickAn.fftSize;
        kickBins = [Math.max(1, Math.round(40 / khz)), Math.round(120 / khz)];
    }

    function setLevel(v, tc) {
        if (gain) gain.gain.setTargetAtTime(v, ac.currentTime, tc);
        else if (audio) audio.volume = Math.max(0, Math.min(1, v));
    }

    function start() {
        build();
        if (ac && ac.state === 'suspended') ac.resume();
        var p = audio.play();
        if (p && p.catch) p.catch(function() { on = false; fx.on = false; setUi(false); });
        on = true; fx.on = true;
        setUi(true);
        setLevel(currentTarget(), 0.4);       // ~1.2 s fade in
        if (!raf) raf = requestAnimationFrame(loop);
    }

    function stop() {
        on = false;
        setUi(false);
        if (!audio) return;
        setLevel(0, 0.12);
        setTimeout(function() { if (!on && audio) audio.pause(); }, 450);
    }

    // Footer credit doubles as a play/pause control
    var np = document.getElementById('nowPlaying'), npLabel = np && np.querySelector('.np-label'), npTime = document.getElementById('npTime');
    if (np) np.addEventListener('click', function(e) { e.stopPropagation(); btn.click(); });
    function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    var npLast = -1;

    function setUi(v) {
        if (np) {
            np.classList.toggle('on', v);
            npLabel.textContent = v ? 'Now playing Voltage' : 'Soundtrack: Voltage';
            np.setAttribute('aria-label', v ? 'Pause the soundtrack, Voltage' : 'Play the soundtrack, Voltage');
            if (!v) { npTime.textContent = ''; np.style.removeProperty('--np-kick'); npLast = -1; }
        }
        btn.setAttribute('aria-pressed', v ? 'true' : 'false');
        btn.setAttribute('aria-label', v ? 'Pause soundtrack' : 'Play soundtrack');
        btn.classList.toggle('on', v);
        if (!v) for (var i = 0; i < bars.length; i++) bars[i].style.transform = '';
    }

    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        wantOn = false;
        if (on) { stop(); store('off'); track('sound-off'); }
        else { start(); store('on'); track('sound-on'); }
    });

    // Console readout for checking the mix: __soundFx.state()
    fx.state = function() {
        return audio ? { t: +audio.currentTime.toFixed(2), paused: audio.paused,
            lowpassHz: filter ? Math.round(filter.frequency.value) : null,
            level: gain ? +gain.gain.value.toFixed(2) : audio.volume,
            kick: +fx.kick.toFixed(2) } : null;
    };
    fx.seek = function(t) { if (audio) audio.currentTime = t; };
    fx.raw = new Float32Array(N);       // per-band dB before normalising (for tuning)

    // Remembered "on": browsers need a gesture, so resume on the first one.
    if (stored() === 'on') {
        wantOn = true;
        btn.classList.add('armed');
        var cleanup = function() {
            wantOn = false;
            btn.classList.remove('armed');
            document.removeEventListener('pointerdown', arm, true);
            document.removeEventListener('keydown', arm, true);
        };
        var arm = function(e) {
            if (!wantOn) return cleanup();
            if (e && e.target && e.target.closest && e.target.closest('#soundToggle, #nowPlaying, .cmdk, [data-soundtrack]')) return cleanup();
            cleanup();
            start();
        };
        document.addEventListener('pointerdown', arm, true);
        document.addEventListener('keydown', arm, true);
    }

    // Pause politely in a background tab, pick up where it was on return.
    document.addEventListener('visibilitychange', function() {
        if (!audio || !on) return;
        if (document.hidden) audio.pause();
        else { if (ac && ac.state === 'suspended') ac.resume(); audio.play().catch(function() {}); }
    });

    /* ── Where is the reader? Open at the hero and contact, a wall in between ── */
    var contact = document.getElementById('contact');
    function talking() {
        var a = document.getElementById('agentAvatar');
        return !!(a && a.classList.contains('talking'));
    }
    function reading() {
        var h = window.innerHeight;
        if (window.scrollY < h * 0.55) return false;
        if (contact && contact.getBoundingClientRect().top < h * 0.6) return false;
        return true;
    }
    function currentTarget() { return talking() ? DUCK : VOL; }

    var wasTalking = false, wasReading = null;
    function mix() {
        var t = talking();
        if (t !== wasTalking) { wasTalking = t; setLevel(t ? DUCK : VOL, t ? 0.08 : 0.5); }
        if (!filter) return;
        var r = reading();
        if (r !== wasReading) {
            wasReading = r;
            filter.frequency.setTargetAtTime(r ? WALL_HZ : OPEN_HZ, ac.currentTime, r ? 0.35 : 0.25);
        }
    }

    /* ── Live analysis, every frame ── */
    function analyse() {
        specAn.getFloatFrequencyData(spec);
        var L = fx.levels, P = fx.peaks, hi = 0;
        for (var b = 0; b < N; b++) {
            var i0 = bandBins[2 * b], i1 = bandBins[2 * b + 1], s = 0;
            for (var i = i0; i <= i1; i++) s += Math.pow(10, spec[i] / 20);
            var db = 20 * Math.log10(s / (i1 - i0 + 1) + 1e-9);
            fx.raw[b] = db;
            // Each band calibrates itself: its own running mean + spread (~1 s), so a hit
            // reads as a jump above what that band has just been doing. Blended with
            // absolute energy (tilted ~1 dB/band, measured on this track) so loud stays tall.
            if (bMean[b] === 0) bMean[b] = db;
            bMean[b] += (db - bMean[b]) * 0.02;
            bDev[b] += (Math.max(2, Math.abs(db - bMean[b])) - bDev[b]) * 0.02;
            var rel = (db - bMean[b] + bDev[b] * 0.6) / (bDev[b] * 3.2);
            var abs = (db + 45 + 0.75 * b) / 30;
            rel = rel < 0 ? 0 : rel > 1 ? 1 : rel;
            abs = abs < 0 ? 0 : abs > 1 ? 1 : abs;
            var v = Math.pow(0.65 * rel + 0.35 * abs, 1.2);
            L[b] = v > L[b] ? L[b] + (v - L[b]) * 0.75 : L[b] + (v - L[b]) * 0.13;
            P[b] = L[b] > P[b] ? L[b] : Math.max(0, P[b] - 0.009);
            if (b > N * 0.7) hi += L[b];
        }
        fx.high = hi / (N * 0.3);

        // Kick: raw bass energy against its own slow average -> sharp onsets
        kickAn.getFloatFrequencyData(kspec);
        var e = 0;
        for (var k = kickBins[0]; k <= kickBins[1]; k++) e += Math.pow(10, kspec[k] / 10);
        bassSlow = bassSlow ? bassSlow + (e - bassSlow) * 0.06 : e;
        var hit = (e / (bassSlow + 1e-12) - 1.25) / 1.2;
        hit = hit < 0 ? 0 : hit > 1 ? 1 : hit;
        fx.kick = Math.max(fx.kick * 0.80, hit);

        var lat = (ac.outputLatency || 0) + (ac.baseLatency || 0);
        fx.time = Math.max(0, audio.currentTime - lat);
        fx.duration = audio.duration || 0;
        fx.bar = (fx.time - BAR0) / BAR;
    }

    function loop() {
        raf = 0;
        var audible = on || (gain && gain.gain.value > 0.01);
        if (!audible) {
            fx.on = false; fx.kick = 0; fx.bar = -1;
            for (var z = 0; z < N; z++) { fx.levels[z] = 0; fx.peaks[z] = 0; }
            return;
        }
        mix();
        if (specAn) {
            analyse();
            // fade the visuals out together with the audio
            if (!on) { fx.kick *= 0.7; for (var q = 0; q < N; q++) fx.levels[q] *= 0.85; }
            if (on) {
                var groups = [[0, 8], [9, 20], [21, 34], [35, 47]];
                for (var g = 0; g < bars.length; g++) {
                    var s = 0, r = groups[g];
                    for (var j = r[0]; j <= r[1]; j++) s += fx.levels[j];
                    var v = Math.min(1, s / (r[1] - r[0] + 1) * 1.3);
                    bars[g].style.transform = 'scaleY(' + (0.18 + v * 0.82).toFixed(3) + ')';
                }
                if (np) {
                    np.style.setProperty('--np-kick', fx.kick.toFixed(2));
                    var sec = Math.floor(fx.time);
                    if (sec !== npLast && fx.duration) { npLast = sec; npTime.textContent = mmss(fx.time) + ' / ' + mmss(fx.duration); }
                }
            }
        }
        raf = requestAnimationFrame(loop);
    }
})();
