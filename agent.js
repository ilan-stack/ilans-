/* ── AI Ilan: floating chat agent ──
   Streams Claude responses from the ilans-agent edge function.
   Injected entirely from JS so the page stays clean without it. */
(function() {
    'use strict';

    var API = 'https://ilans-agent.vercel.app/api/chat';
    var TTS_API = 'https://ilans-agent.vercel.app/api/tts';
    var LEAD_API = 'https://ilans-agent.vercel.app/api/lead';

    // Bilingual copy. The agent itself mirrors whatever language it's asked
    // in; these strings just localize the widget chrome + canned bits.
    var COPY = {
        en: {
            greeting: "Hey - I'm AI Ilan, the AI twin of the real one. Ask me anything about his work, his projects, or whether he's the person you're looking for. I only know true things about him - for everything else there's ilan@ilans.net.",
            starters: ['Would he fit my open role?', "What's the most impressive thing he's shipped?", 'Is he available for new roles?'],
            placeholder: 'Ask about Ilan or his work…',
            sub: 'AI twin · can be wrong · ',
            emailReal: 'email the real one',
            error: 'AI Ilan glitched - try again, or email the real one: ilan@ilans.net.',
            leadName: 'Your name',
            leadEmail: 'Your email',
            leadNote: 'Anything he should know? (optional)',
            leadSend: 'Send to Ilan',
            leadSent: 'Got it - passed straight to the real Ilan. He usually replies fast.',
            leadError: "That didn't go through - try again or just email ilan@ilans.net."
        },
        he: {
            greeting: "היי - אני AI אילן, התאום הדיגיטלי של אילן האמיתי. שאלו אותי כל דבר על העבודה שלו, הפרויקטים, או אם הוא האדם שאתם מחפשים. אני יודע רק דברים אמיתיים עליו - לכל השאר יש ilan@ilans.net.",
            starters: ['הוא יתאים למשרה שלי?', 'מה הדבר הכי מרשים שהוא בנה?', 'הוא פנוי למשרה חדשה?'],
            placeholder: '…שאלו על אילן או העבודה שלו',
            sub: 'תאום AI · יכול לטעות · ',
            emailReal: 'כתבו לאמיתי',
            error: 'משהו השתבש - נסו שוב, או כתבו לאמיתי: ilan@ilans.net.',
            leadName: 'השם שלכם',
            leadEmail: 'האימייל שלכם',
            leadNote: '(משהו שכדאי שידע? (לא חובה',
            leadSend: 'שלחו לאילן',
            leadSent: 'נשלח לאילן האמיתי - הוא בדרך כלל עונה מהר.',
            leadError: 'משהו השתבש - נסו שוב או כתבו ל-ilan@ilans.net.'
        }
    };
    // Default to Hebrew only if the visitor's browser is Hebrew; the toggle
    // lets anyone switch (and is what makes the mic listen in Hebrew).
    var uiLang = (navigator.language || '').toLowerCase().indexOf('he') === 0 ? 'he' : 'en';

    var history = [];   // {role, content} - excludes the canned greeting
    var busy = false;

    function track(path) {
        if (window.goatcounter && window.goatcounter.count) {
            window.goatcounter.count({ path: path, event: true });
        }
    }

    /* ── Page-pointing: the agent emits [[focus:KEY]] markers; the
       widget strips them from the text and scrolls + spotlights the
       matching element so AI Ilan can give a guided tour. ── */
    var FOCUS = {
        work: '#work .section-title',
        about: '#about .section-title',
        skills: '#skills .section-title',
        experience: '#experience .section-title',
        contact: '#contact .contact-title',
        lens: '[data-focus="lens"]',
        tapersafe: '[data-focus="tapersafe"]',
        'ae-hub': '[data-focus="ae-hub"]',
        inkforge: '[data-focus="inkforge"]',
        'sprite-studio': '[data-focus="sprite-studio"]',
        cubelets: '[data-focus="cubelets"]',
        'ai-studio': '[data-focus="ai-studio"]',
        carscan: '[data-focus="carscan"]',
        'roborock': '[data-focus="roborock"]',
        'auto-caption': '[data-focus="auto-caption"]',
        sett: '[data-focus="sett"]',
        rabin: '[data-focus="rabin"]',
        playbatch: '[data-focus="playbatch"]',
        bites: '[data-focus="bites"]',
        justad: '[data-focus="justad"]',
        eyeblaster: '[data-focus="eyeblaster"]',
        gorni: '[data-focus="gorni"]',
        'skills-design': '[data-focus="skills-design"]',
        'skills-ai': '[data-focus="skills-ai"]',
        'skills-eng': '[data-focus="skills-eng"]',
        'this-site': '[data-focus="this-site"]',
        'medical-3d': '[data-focus="medical-3d"]'
    };
    var focusReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function stripMarkers(s) {
        // remove complete markers, any trailing partial mid-stream, and
        // collapse the double space left where a marker was
        return s.replace(/\[\[focus:[a-z0-9-]+\]\]/g, '')
                .replace(/\[\[lead\]\]/g, '')
                .replace(/\[\[[^\]\]]*$/, '')
                .replace(/[ \t]{2,}/g, ' ');
    }

    // Scroll + highlight a target. Only ever called while reading aloud,
    // paced by the narration (see speakParts).
    function spotlight(key) {
        if (!FOCUS[key]) return;
        var el = document.querySelector(FOCUS[key]);
        if (!el) return;
        el.scrollIntoView({ behavior: focusReduced ? 'auto' : 'smooth', block: 'center' });
        el.classList.remove('agent-spotlight');
        void el.offsetWidth;
        el.classList.add('agent-spotlight');
        track('agent-point');
        setTimeout(function() { el.classList.remove('agent-spotlight'); }, 2900);
    }

    function cleanSeg(s) {
        return s.replace(/\[\[lead\]\]/g, '').replace(/\[\[[^\]\]]*$/, '').replace(/[ \t]{2,}/g, ' ').trim();
    }
    // Split a raw reply into {text, key} parts at each marker, so speech and
    // page-pointing can be interleaved in narration order.
    function parseFocusParts(raw) {
        var parts = [], re = /\[\[focus:([a-z0-9-]+)\]\]/g, last = 0, m, hasKey = false;
        while ((m = re.exec(raw))) {
            var key = FOCUS[m[1]] ? m[1] : null;
            parts.push({ text: cleanSeg(raw.slice(last, m.index)), key: key });
            if (key) hasKey = true;
            last = m.index + m[0].length;
        }
        parts.push({ text: cleanSeg(raw.slice(last)), key: null });
        return { parts: parts, hasKey: hasKey };
    }

    /* ── DOM ── */
    var launcher = document.createElement('button');
    launcher.className = 'agent-launcher';
    launcher.setAttribute('aria-label', 'Chat with AI Ilan');
    launcher.innerHTML =
        '<span class="agent-face" aria-hidden="true">' +
            '<img src="images/ai-avatar.svg?v=3" alt="" class="agent-face-img">' +
            '<span class="agent-online"></span>' +
        '</span>' +
        '<span class="agent-launcher-label">Ask my AI</span>';

    var panel = document.createElement('div');
    panel.className = 'agent-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with AI Ilan');
    panel.innerHTML =
        '<div class="agent-head">' +
            '<span class="agent-face agent-face-lg" aria-hidden="true">' +
                '<span class="agent-svg-slot"><img src="images/ai-avatar.svg?v=3" alt="" class="agent-face-img" id="agentAvatar"></span>' +
                '<span class="agent-online"></span>' +
            '</span>' +
            '<div class="agent-head-text">' +
                '<div class="agent-name">AI Ilan</div>' +
                '<div class="agent-sub">' + COPY[uiLang].sub + '<a href="mailto:ilan@ilans.net">' + COPY[uiLang].emailReal + '</a></div>' +
            '</div>' +
            '<button class="agent-lang" type="button">' + (uiLang === 'he' ? 'EN' : 'עב') + '</button>' +
            '<button class="agent-close" aria-label="Close chat">&times;</button>' +
        '</div>' +
        '<div class="agent-msgs" aria-live="polite"></div>' +
        '<div class="agent-starters"></div>' +
        '<form class="agent-form">' +
            '<button class="agent-mic" type="button" aria-label="Speak your question" aria-pressed="false" hidden>' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>' +
            '</button>' +
            '<input class="agent-input" type="text" maxlength="1200" placeholder="' + COPY[uiLang].placeholder + '" aria-label="Your question">' +
            '<button class="agent-send" type="submit" aria-label="Send message">' +
                '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="20" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>' +
            '</button>' +
        '</form>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    /* Inline the avatar SVG in the header so the .talking class can
       drive the mouth animation embedded inside the artwork */
    fetch('images/ai-avatar.svg?v=3').then(function(r) { return r.ok ? r.text() : null; }).then(function(text) {
        if (!text) return;
        var slot = panel.querySelector('.agent-svg-slot');
        var tmp = document.createElement('div');
        tmp.innerHTML = text;
        var svg = tmp.querySelector('svg');
        if (!svg || !slot) return;
        svg.setAttribute('id', 'agentAvatar');
        svg.setAttribute('class', 'agent-face-img');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        slot.replaceChildren(svg);
    }).catch(function() {});

    var msgsEl = panel.querySelector('.agent-msgs');
    var startersEl = panel.querySelector('.agent-starters');
    var formEl = panel.querySelector('.agent-form');
    var inputEl = panel.querySelector('.agent-input');
    var sendEl = panel.querySelector('.agent-send');
    var micEl = panel.querySelector('.agent-mic');
    var subEl = panel.querySelector('.agent-sub');
    var langBtn = panel.querySelector('.agent-lang');

    // Re-localize the widget chrome and re-language the mic when toggled
    function applyLang() {
        inputEl.placeholder = COPY[uiLang].placeholder;
        inputEl.dir = uiLang === 'he' ? 'rtl' : 'ltr';
        subEl.innerHTML = COPY[uiLang].sub + '<a href="mailto:ilan@ilans.net">' + COPY[uiLang].emailReal + '</a>';
        langBtn.textContent = uiLang === 'he' ? 'EN' : 'עב';
        langBtn.setAttribute('aria-label', uiLang === 'he' ? 'Switch to English' : 'עבור לעברית / Switch to Hebrew');
        renderStarters();
    }
    langBtn.addEventListener('click', function() {
        uiLang = uiLang === 'he' ? 'en' : 'he';
        applyLang();
        inputEl.focus();
    });

    // Smart default: the mic + chrome follow the conversation language.
    // Once any Hebrew appears (typed, spoken, or in a reply) the widget
    // switches to Hebrew on its own; clear English switches it back.
    function detectLang(text) {
        if (/[֐-׿]/.test(text)) return 'he';
        if (/[A-Za-z]/.test(text)) return 'en';
        return null; // numbers/emoji/punctuation only - leave as-is
    }
    function maybeSwitchLang(text) {
        var d = detectLang(text);
        if (d && d !== uiLang) { uiLang = d; applyLang(); }
    }

    function renderStarters() {
        startersEl.replaceChildren();
        COPY[uiLang].starters.forEach(function(q) {
            var chip = document.createElement('button');
            chip.className = 'agent-chip';
            chip.type = 'button';
            chip.dir = 'auto';
            chip.textContent = q;
            chip.addEventListener('click', function() { send(q); });
            startersEl.appendChild(chip);
        });
    }

    /* ── Text-to-speech: Azure Neural voice with browser fallback ── */
    var tts = {
        browserSupported: 'speechSynthesis' in window,
        supported: ('speechSynthesis' in window) || ('Audio' in window),
        activeBtn: null,
        audio: null,
        seq: 0,
        unlocked: false,
        unlock: function() {
            // iOS allows audio only after a user-gesture
            if (this.unlocked) return;
            this.unlocked = true;
            if (this.browserSupported) {
                try { speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch (e) {}
            }
        },
        markBtn: function(btn, on) {
            var face = document.getElementById('agentAvatar');
            if (face) face.classList.toggle('talking', on);
            if (!btn) return;
            btn.classList.toggle('speaking', on);
            btn.setAttribute('aria-label', on ? 'Stop reading' : 'Read aloud');
        },
        stop: function() {
            this.seq++; // invalidate any running sequence
            if (this.audio) {
                try { this.audio.pause(); } catch (e) {}
                this.audio = null;
            }
            if (this.browserSupported) speechSynthesis.cancel();
            this.markBtn(this.activeBtn, false);
            this.activeBtn = null;
        },
        // Play one chunk of text; resolve when it finishes (or at once if empty/stale)
        playText: function(text, token) {
            var self = this;
            return new Promise(function(resolve) {
                if (!text || token !== self.seq) { resolve(); return; }
                function browser() {
                    if (!self.browserSupported) { resolve(); return; }
                    var u = new SpeechSynthesisUtterance(text);
                    var v = self.pickVoice(text); if (v) u.voice = v;
                    u.rate = 1.04;
                    u.onend = u.onerror = function() { resolve(); };
                    speechSynthesis.speak(u);
                }
                fetch(TTS_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text })
                }).then(function(res) {
                    var ct = res.headers.get('Content-Type') || '';
                    if (res.ok && ct.indexOf('audio') === 0) return res.blob();
                    throw new Error('fallback');
                }).then(function(blob) {
                    if (token !== self.seq) { resolve(); return; }
                    var url = URL.createObjectURL(blob);
                    var a = new Audio(url);
                    self.audio = a;
                    a.onended = a.onerror = function() { URL.revokeObjectURL(url); if (self.audio === a) self.audio = null; resolve(); };
                    a.play().catch(function() { browser(); });
                }).catch(function() { browser(); });
            });
        },
        // Speak a sequence of {text, key} parts, firing onKey(key) AFTER each
        // part finishes - so page scroll/highlight syncs to the narration.
        speakParts: function(parts, btn, onKey) {
            if (this.activeBtn === btn) { this.stop(); return; }
            this.stop();
            this.activeBtn = btn || null;
            this.markBtn(btn, true);
            var token = ++this.seq;
            var self = this;
            var i = 0;
            (function next() {
                if (token !== self.seq) return;
                if (i >= parts.length) {
                    self.markBtn(btn, false);
                    if (self.activeBtn === btn) self.activeBtn = null;
                    return;
                }
                var part = parts[i++];
                self.playText(part.text, token).then(function() {
                    if (token !== self.seq) return;
                    if (part.key && onKey) onKey(part.key);
                    next();
                });
            })();
        },
        speak: function(text, btn) {
            if (!text) return;
            this.speakParts([{ text: text, key: null }], btn, null);
        },
        browserSpeak: function(text, btn) {
            if (!this.browserSupported) { this.markBtn(btn, false); if (this.activeBtn === btn) this.activeBtn = null; return; }
            if (this.activeBtn !== btn) return;
            var u = new SpeechSynthesisUtterance(text);
            var voice = this.pickVoice(text);
            if (voice) u.voice = voice;
            u.rate = 1.04;
            var self = this;
            u.onend = u.onerror = function() {
                if (self.activeBtn === btn) { self.markBtn(btn, false); self.activeBtn = null; }
            };
            speechSynthesis.speak(u);
        },
        pickVoice: function(text) {
            var voices = speechSynthesis.getVoices();
            var hebrew = /[֐-׿]/.test(text);
            var lang = hebrew ? 'he' : 'en';
            var preferred = hebrew ? ['Carmit'] : ['Samantha', 'Google US English', 'Daniel', 'Alex'];
            for (var i = 0; i < preferred.length; i++) {
                var v = voices.find(function(x) { return x.name.indexOf(preferred[i]) === 0; });
                if (v) return v;
            }
            return voices.find(function(x) { return x.lang.indexOf(lang) === 0; }) || null;
        }
    };
    if (tts.browserSupported) speechSynthesis.getVoices(); // warm voice list

    function attachSpeaker(msgEl, raw) {
        if (!tts.supported) return null;
        var btn = document.createElement('button');
        btn.className = 'agent-speak';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Read aloud');
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
        btn.addEventListener('click', function() {
            tts.unlock();
            var pp = parseFocusParts(raw != null ? raw : msgEl.textContent);
            if (pp.hasKey) tts.speakParts(pp.parts, btn, spotlight);
            else tts.speak(msgEl.textContent, btn);
        });
        var row = document.createElement('div');
        row.className = 'agent-msg-tools';
        row.appendChild(btn);
        msgEl.insertAdjacentElement('afterend', row);
        return btn;
    }

    /* ── Lead capture: the agent emits [[lead]] and this inline form
       appears; details go straight to the real Ilan. ── */
    function showLeadForm() {
        if (msgsEl.querySelector('.agent-lead')) return; // one at a time
        var c = COPY[uiLang];
        var form = document.createElement('form');
        form.className = 'agent-lead';
        form.dir = uiLang === 'he' ? 'rtl' : 'ltr';
        form.innerHTML =
            '<input type="text" name="name" maxlength="120" placeholder="' + c.leadName + '" required>' +
            '<input type="email" name="email" maxlength="200" placeholder="' + c.leadEmail + '" required>' +
            '<input type="text" name="note" maxlength="600" placeholder="' + c.leadNote + '">' +
            '<button type="submit" class="agent-lead-send">' + c.leadSend + '</button>';
        msgsEl.appendChild(form);
        msgsEl.scrollTop = msgsEl.scrollHeight;
        track('lead-shown');

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.agent-lead-send');
            btn.disabled = true;
            fetch(LEAD_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.value.trim(),
                    email: form.email.value.trim(),
                    note: form.note.value.trim()
                })
            }).then(function(res) {
                if (res.ok) {
                    form.remove();
                    addMsg('ai', c.leadSent);
                    track('lead-sent');
                    return;
                }
                return res.json().catch(function() { return {}; }).then(function(d) {
                    if (d.fallback) {
                        // channel not configured - no dead end: open the email sheet
                        form.remove();
                        var mailBtn = document.querySelector('a[href^="mailto:"]');
                        if (mailBtn) mailBtn.click();
                    } else {
                        btn.disabled = false;
                        addMsg('ai', d.error || c.leadError);
                    }
                });
            }).catch(function() {
                btn.disabled = false;
                addMsg('ai', c.leadError);
            });
        });
        form.querySelector('input').focus();
    }

    /* ── Speech-to-text: talk to the agent ── */
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = null;
    var listening = false;
    var voiceMode = false; // last question was spoken -> speak the answer

    if (SR && micEl) {
        micEl.hidden = false;
        micEl.addEventListener('click', function() {
            tts.unlock();
            if (listening) { stopListening(); return; }
            tts.stop();
            try {
                recognition = new SR();
            } catch (e) { micEl.hidden = true; return; }
            recognition.lang = uiLang === 'he' ? 'he-IL' : 'en-US';
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onresult = function(e) {
                var interim = '', final = '';
                for (var i = e.resultIndex; i < e.results.length; i++) {
                    if (e.results[i].isFinal) final += e.results[i][0].transcript;
                    else interim += e.results[i][0].transcript;
                }
                if (interim) inputEl.value = interim;
                if (final) {
                    inputEl.value = '';
                    stopListening();
                    send(final.trim(), true);
                }
            };
            recognition.onerror = function() { stopListening(); };
            recognition.onend = function() { stopListening(); };

            listening = true;
            micEl.classList.add('listening');
            micEl.setAttribute('aria-pressed', 'true');
            inputEl.placeholder = uiLang === 'he' ? '…מקשיב' : 'Listening…';
            try { recognition.start(); } catch (e) { stopListening(); }
            track('agent-voice');
        });
    }

    function stopListening() {
        listening = false;
        micEl.classList.remove('listening');
        micEl.setAttribute('aria-pressed', 'false');
        inputEl.placeholder = COPY[uiLang].placeholder;
        if (recognition) {
            try { recognition.stop(); } catch (e) {}
        }
    }

    applyLang();   // localize chrome + render starters in the current language

    function addMsg(role, text) {
        var el = document.createElement('div');
        el.className = 'agent-msg ' + (role === 'user' ? 'from-user' : 'from-ai');
        el.dir = 'auto';   // Hebrew renders RTL, English LTR - per message
        el.textContent = text;
        msgsEl.appendChild(el);
        msgsEl.scrollTop = msgsEl.scrollHeight;
        return el;
    }

    function setBusy(b) {
        busy = b;
        sendEl.disabled = b;
        inputEl.disabled = b;
        var face = document.getElementById('agentAvatar');
        if (face) face.classList.toggle('thinking', b);
    }

    var opened = false;
    function openPanel() {
        panel.hidden = false;
        launcher.classList.add('panel-open');
        // launcher is visually hidden behind the panel - keep it out of the
        // tab order and the a11y tree while it is
        launcher.setAttribute('tabindex', '-1');
        launcher.setAttribute('aria-hidden', 'true');
        if (!opened) {
            opened = true;
            var g = addMsg('ai', COPY[uiLang].greeting);
            attachSpeaker(g, COPY[uiLang].greeting);
            track('agent-open');
        }
        inputEl.focus();
    }
    function closePanel() {
        panel.hidden = true;
        launcher.classList.remove('panel-open');
        launcher.removeAttribute('tabindex');
        launcher.removeAttribute('aria-hidden');
        launcher.focus();
    }

    launcher.addEventListener('click', function() {
        if (panel.hidden) openPanel(); else closePanel();
    });
    panel.querySelector('.agent-close').addEventListener('click', closePanel);
    // "Ask my AI" button on the meta project card opens the chat
    document.querySelectorAll('.mini-ask-ai').forEach(function(b) {
        b.addEventListener('click', openPanel);
    });

    /* ── Attention nudges: while the chat has never been opened, the
       launcher plays a random playful animation every few seconds so
       it pulls the eye. Stops once engaged; respects reduced-motion,
       hover, and hidden tabs. ── */
    (function() {
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) return;
        var NUDGES = ['nudge-bounce', 'nudge-wiggle', 'nudge-pop', 'nudge-swing'];
        var clearTimer;
        function clearNudge() {
            launcher.classList.remove('nudging');
            NUDGES.forEach(function(n) { launcher.classList.remove(n); });
        }
        launcher.addEventListener('mouseenter', clearNudge);
        function fire() {
            if (opened || !panel.hidden || document.hidden || launcher.matches(':hover')) return;
            clearNudge();
            void launcher.offsetWidth; // restart any in-flight animation
            launcher.classList.add('nudging', NUDGES[(Math.random() * NUDGES.length) | 0]);
            clearTimeout(clearTimer);
            clearTimer = setTimeout(clearNudge, 1100);
        }
        function schedule(first) {
            var delay = first ? 3000 : (3500 + Math.random() * 3500);
            setTimeout(function() {
                fire();
                if (!opened) schedule(false);
            }, delay);
        }
        schedule(true);
    })();
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !panel.hidden) closePanel();
    });

    formEl.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = inputEl.value.trim();
        if (q) send(q);
    });

    function send(text, spoken) {
        if (busy) return;
        voiceMode = !!spoken;
        maybeSwitchLang(text);   // adapt the widget + mic to this message's language
        startersEl.style.display = 'none';
        inputEl.value = '';
        addMsg('user', text);
        history.push({ role: 'user', content: text });
        // Keep the conversation inside server limits
        while (history.length > 20) history.shift();
        if (history[0] && history[0].role !== 'user') history.shift();

        var aiEl = addMsg('ai', '');
        aiEl.classList.add('thinking');
        aiEl.textContent = '· · ·';
        setBusy(true);
        track('agent-message');

        fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history })
        }).then(function(res) {
            if (!res.ok) {
                return res.json().catch(function() { return {}; }).then(function(data) {
                    throw new Error(data.error || COPY[uiLang].error);
                });
            }
            aiEl.classList.remove('thinking');
            aiEl.textContent = '';
            var reader = res.body.getReader();
            var decoder = new TextDecoder();
            var buf = '';
            var answer = '';

            function pump() {
                return reader.read().then(function(step) {
                    if (step.done) return;
                    buf += decoder.decode(step.value, { stream: true });
                    var lines = buf.split('\n');
                    buf = lines.pop();
                    lines.forEach(function(line) {
                        if (line.indexOf('data: ') !== 0) return;
                        var payload = line.slice(6);
                        try {
                            var evt = JSON.parse(payload);
                            if (evt.type === 'content_block_delta' && evt.delta && evt.delta.text) {
                                answer += evt.delta.text;
                                // Pointing happens only while reading aloud (synced to
                                // the voice). Typed replies just show clean text.
                                aiEl.textContent = stripMarkers(answer);
                                msgsEl.scrollTop = msgsEl.scrollHeight;
                            }
                        } catch (err) {}
                    });
                    return pump();
                });
            }
            return pump().then(function() {
                if (answer) {
                    var clean = stripMarkers(answer);
                    aiEl.textContent = clean;
                    maybeSwitchLang(clean);   // confirm the conversation language from the reply
                    history.push({ role: 'assistant', content: clean });
                    if (/\[\[lead\]\]/.test(answer)) showLeadForm();
                    var speakBtn = attachSpeaker(aiEl, answer);
                    if (voiceMode && speakBtn) {
                        var pp = parseFocusParts(answer);
                        if (pp.hasKey) tts.speakParts(pp.parts, speakBtn, spotlight);
                        else tts.speak(clean, speakBtn);
                    }
                } else {
                    aiEl.textContent = COPY[uiLang].error;
                    history.pop();
                }
            });
        }).catch(function(err) {
            aiEl.classList.remove('thinking');
            aiEl.textContent = err.message;
            history.pop();
        }).finally(function() {
            setBusy(false);
            inputEl.focus();
        });
    }
})();
