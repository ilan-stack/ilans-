/* ── AI Ilan: floating chat agent ──
   Streams Claude responses from the ilans-agent edge function.
   Injected entirely from JS so the page stays clean without it. */
(function() {
    'use strict';

    var API = 'https://ilans-agent.vercel.app/api/chat';
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
    launcher.innerHTML = '<span class="pulse" aria-hidden="true"></span>Ask my AI';

    var panel = document.createElement('div');
    panel.className = 'agent-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with AI Ilan');
    panel.innerHTML =
        '<div class="agent-head">' +
            '<picture><source srcset="images/portrait-new.webp" type="image/webp"><img src="images/portrait-new.png" alt="" class="agent-avatar"></picture>' +
            '<div class="agent-head-text">' +
                '<div class="agent-name">AI Ilan</div>' +
                '<div class="agent-sub">AI twin · can be wrong · <a href="mailto:ilan@ilans.net">email the real one</a></div>' +
            '</div>' +
            '<button class="agent-close" aria-label="Close chat">&times;</button>' +
        '</div>' +
        '<div class="agent-msgs" aria-live="polite"></div>' +
        '<div class="agent-starters"></div>' +
        '<form class="agent-form">' +
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
    }

    var opened = false;
    function openPanel() {
        panel.hidden = false;
        launcher.classList.add('panel-open');
        if (!opened) {
            opened = true;
            addMsg('ai', GREETING);
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

    function send(text) {
        if (busy) return;
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
                if (answer) history.push({ role: 'assistant', content: answer });
                else { aiEl.textContent = 'AI Ilan glitched - try again, or email the real one: ilan@ilans.net.'; history.pop(); }
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
