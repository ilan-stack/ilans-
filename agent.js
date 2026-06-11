/* ── AI Ilan: floating chat agent ──
   Streams Claude responses from the ilans-agent edge function.
   Injected entirely from JS so the page stays clean without it. */
(function() {
    'use strict';

    var API = 'https://ilans-agent.vercel.app/api/chat';
    var TTS_API = 'https://ilans-agent.vercel.app/api/tts';
    var GREETING = "Hey - I'm AI Ilan, the AI twin of the real one. Ask me anything about his work, his projects, or whether he's the person you're looking for. I only know true things about him - for everything else there's ilan@ilans.net.";
    var STARTERS = [
        "What's the most impressive thing he's shipped?",
        'Is he available for new roles?',
        'What does he actually do day to day?'
    ];

    var history = [];   // {role, content} - excludes the canned greeting
    var busy = false;

    function track(path) {
        if (window.goatcounter && window.goatcounter.count) {
            window.goatcounter.count({ path: path, event: true });
        }
    }

    /* ── DOM ── */
    var launcher = document.createElement('button');
    launcher.className = 'agent-launcher';
    launcher.setAttribute('aria-label', 'Chat with AI Ilan');
    launcher.innerHTML =
        '<span class="agent-face" aria-hidden="true">' +
            '<img src="images/ai-avatar.svg" alt="" class="agent-face-img">' +
            '<span class="agent-online"></span>' +
        '</span>' +
        'Ask my AI';

    var panel = document.createElement('div');
    panel.className = 'agent-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with AI Ilan');
    panel.innerHTML =
        '<div class="agent-head">' +
            '<span class="agent-face agent-face-lg" aria-hidden="true">' +
                '<img src="images/ai-avatar.svg" alt="" class="agent-face-img" id="agentAvatar">' +
                '<span class="agent-online"></span>' +
            '</span>' +
            '<div class="agent-head-text">' +
                '<div class="agent-name">AI Ilan</div>' +
                '<div class="agent-sub">AI twin · can be wrong · <a href="mailto:ilan@ilans.net">email the real one</a></div>' +
            '</div>' +
            '<button class="agent-close" aria-label="Close chat">&times;</button>' +
        '</div>' +
        '<div class="agent-msgs" aria-live="polite"></div>' +
        '<div class="agent-starters"></div>' +
        '<form class="agent-form">' +
            '<button class="agent-mic" type="button" aria-label="Speak your question" aria-pressed="false" hidden>' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>' +
            '</button>' +
            '<input class="agent-input" type="text" maxlength="1200" placeholder="Ask about Ilan or his work…" aria-label="Your question">' +
            '<button class="agent-send" type="submit" aria-label="Send">&#8593;</button>' +
        '</form>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    var msgsEl = panel.querySelector('.agent-msgs');
    var startersEl = panel.querySelector('.agent-starters');
    var formEl = panel.querySelector('.agent-form');
    var inputEl = panel.querySelector('.agent-input');
    var sendEl = panel.querySelector('.agent-send');
    var micEl = panel.querySelector('.agent-mic');

    /* ── Text-to-speech: Azure Neural voice with browser fallback ── */
    var tts = {
        browserSupported: 'speechSynthesis' in window,
        supported: ('speechSynthesis' in window) || ('Audio' in window),
        activeBtn: null,
        audio: null,
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
            if (this.audio) {
                try { this.audio.pause(); } catch (e) {}
                this.audio = null;
            }
            if (this.browserSupported) speechSynthesis.cancel();
            this.markBtn(this.activeBtn, false);
            this.activeBtn = null;
        },
        speak: function(text, btn) {
            if (!text) return;
            if (this.activeBtn === btn) { this.stop(); return; }
            this.stop();
            this.activeBtn = btn || null;
            this.markBtn(btn, true);
            var self = this;

            // Try the Azure neural proxy first - much more natural
            fetch(TTS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            }).then(function(res) {
                var ct = res.headers.get('Content-Type') || '';
                if (res.ok && ct.indexOf('audio') === 0) return res.blob();
                throw new Error('fallback');
            }).then(function(blob) {
                if (self.activeBtn !== btn) return; // user stopped/switched
                var url = URL.createObjectURL(blob);
                var a = new Audio(url);
                self.audio = a;
                a.onended = a.onerror = function() {
                    URL.revokeObjectURL(url);
                    if (self.activeBtn === btn) { self.markBtn(btn, false); self.activeBtn = null; self.audio = null; }
                };
                a.play().catch(function() { self.browserSpeak(text, btn); });
            }).catch(function() {
                self.browserSpeak(text, btn);
            });
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

    function attachSpeaker(msgEl) {
        if (!tts.supported) return null;
        var btn = document.createElement('button');
        btn.className = 'agent-speak';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Read aloud');
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
        btn.addEventListener('click', function() {
            tts.unlock();
            tts.speak(msgEl.textContent, btn);
        });
        var row = document.createElement('div');
        row.className = 'agent-msg-tools';
        row.appendChild(btn);
        msgEl.insertAdjacentElement('afterend', row);
        return btn;
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
            recognition.lang = (navigator.language && navigator.language.indexOf('he') === 0) ? 'he-IL' : 'en-US';
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
            inputEl.placeholder = 'Listening…';
            try { recognition.start(); } catch (e) { stopListening(); }
            track('agent-voice');
        });
    }

    function stopListening() {
        listening = false;
        micEl.classList.remove('listening');
        micEl.setAttribute('aria-pressed', 'false');
        inputEl.placeholder = 'Ask about Ilan or his work…';
        if (recognition) {
            try { recognition.stop(); } catch (e) {}
        }
    }

    STARTERS.forEach(function(q) {
        var chip = document.createElement('button');
        chip.className = 'agent-chip';
        chip.type = 'button';
        chip.textContent = q;
        chip.addEventListener('click', function() { send(q); });
        startersEl.appendChild(chip);
    });

    function addMsg(role, text) {
        var el = document.createElement('div');
        el.className = 'agent-msg ' + (role === 'user' ? 'from-user' : 'from-ai');
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
        if (!opened) {
            opened = true;
            var g = addMsg('ai', GREETING);
            attachSpeaker(g);
            track('agent-open');
        }
        inputEl.focus();
    }
    function closePanel() {
        panel.hidden = true;
        launcher.classList.remove('panel-open');
        launcher.focus();
    }

    launcher.addEventListener('click', function() {
        if (panel.hidden) openPanel(); else closePanel();
    });
    panel.querySelector('.agent-close').addEventListener('click', closePanel);
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
                    throw new Error(data.error || 'AI Ilan glitched - try again, or email the real one: ilan@ilans.net.');
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
                                aiEl.textContent = answer;
                                msgsEl.scrollTop = msgsEl.scrollHeight;
                            }
                        } catch (err) {}
                    });
                    return pump();
                });
            }
            return pump().then(function() {
                if (answer) {
                    history.push({ role: 'assistant', content: answer });
                    var speakBtn = attachSpeaker(aiEl);
                    if (voiceMode && speakBtn) tts.speak(answer, speakBtn);
                } else {
                    aiEl.textContent = 'AI Ilan glitched - try again, or email the real one: ilan@ilans.net.';
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
