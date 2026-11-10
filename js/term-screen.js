// The terminal's screen: builds its elements and owns every write to them, plus output pacing.
// All text goes in through textContent, so typed input can never become markup.
// The one element besides text is a link row, built with createElement and limited to http and https URLs.
(function (Term) {
  var LABEL_WIDTH = 12;
  var MAX_LINES = 300;
  // Non-breaking space: the cursor cell keeps its width at the end of the line.
  var BLANK = "\u00a0";
  // Rejection value of pause() once abort() has run.
  var ABORTED = { aborted: true };

  // opts: prompt, labels {output, input, online}, timing {char, field, line, fast}, autofocus.
  Term.createScreen = function (box, opts) {
    var timing = opts.timing;
    var run = 0;
    var waiting = [];
    var liveRows = [];

    var term = el("div", "term");
    var out = el("div", "term-out");
    out.setAttribute("role", "log");
    out.setAttribute("aria-label", opts.labels.output);
    var line = el("div", "term-row plain");
    line.setAttribute("aria-hidden", "true");
    // The prompt line is drawn as text before the caret, the character under it, and text after it.
    var before = el("span");
    var cursor = el("span", "term-cursor", BLANK);
    var after = el("span");
    var prompt = opts.prompt;
    var promptEl = el("span", "term-prompt", prompt);
    line.append(promptEl, before, cursor, after);
    var input = el("input", "term-input");
    input.type = "text";
    input.maxLength = 200;
    input.spellcheck = false;
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("aria-label", opts.labels.input);
    term.append(out, line);

    // Online counter, fixed in the top-right corner next to the color dot.
    var bar = el("div", "term-bar");
    bar.setAttribute("aria-hidden", "true");
    var online = el("span", "", "00:00");
    bar.append(el("span", "term-dim", opts.labels.online), online);

    // The input sits outside the scrolling area, so focusing or typing can't drag the view off the newest line.
    box.append(term, input);
    document.body.appendChild(bar);
    new MutationObserver(scroll).observe(term, { childList: true, subtree: true, characterData: true });
    box.classList.add("is-term");
    if (opts.autofocus) focus();
    term.addEventListener("click", focus);

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    }

    function pad(label) {
      return label + " ".repeat(Math.max(1, LABEL_WIDTH - label.length));
    }

    function focus() { input.focus({ preventScroll: true }); }

    function scroll() { term.scrollTop = term.scrollHeight; }

    function print(node) {
      out.appendChild(node);
      while (out.childNodes.length > MAX_LINES) out.removeChild(out.firstChild);
      scroll();
      return node;
    }

    // A {text, link} item is one line: the text, then the link, or plain text when the URL isn't absolute http or https.
    function linkRow(text, url) {
      var r = el("div", "term-row plain", text);
      var protocol = "";
      try { protocol = new URL(url).protocol; } catch (e) { /* relative or malformed: stays plain text */ }
      if (protocol !== "http:" && protocol !== "https:") {
        r.append(url);
        return r;
      }
      var a = el("a", "term-link", url);
      a.href = url;
      a.rel = "noopener noreferrer";
      r.appendChild(a);
      return r;
    }

    // A {words} item is one line of names that wraps only between names, never at a hyphen inside one.
    function wordsRow(words) {
      var r = el("div", "term-row plain");
      words.forEach(function (w, i) {
        if (i) r.append("  ");
        r.appendChild(el("span", "term-word", w));
      });
      return r;
    }

    // A string is one plain line. A {label, value, dim} item is two columns, wrapping under the value.
    function row(item) {
      if (typeof item === "string") return el("div", "term-row plain", item);
      if (item.link != null) return linkRow(item.text || "", item.link);
      if (item.words) return wordsRow(item.words);
      var r = el("div", "term-row", pad(item.label));
      if (item.value) r.appendChild(el("span", item.dim ? "term-dim" : "", item.value));
      return r;
    }

    // Waits ms, then rejects with ABORTED if abort() ran in the meantime. abort() also ends the wait early.
    function pause(ms) {
      var started = run;
      var done = ms ? new Promise(function (resolve) {
        var timer = setTimeout(function () { waiting.splice(waiting.indexOf(wake), 1); resolve(); }, ms);
        function wake() { clearTimeout(timer); resolve(); }
        waiting.push(wake);
      }) : Promise.resolve();
      return done.then(function () { if (started !== run) throw ABORTED; });
    }

    async function typeInto(node, text) {
      var chars = Array.from(text);
      for (var i = 0; i < chars.length; i++) {
        node.textContent += chars[i];
        await pause(timing.char);
      }
    }

    return {
      input: input,

      // Stops all output in flight at once: every pending pause rejects with a value that aborted() recognises.
      abort: function () {
        run++;
        waiting.splice(0).forEach(function (wake) { wake(); });
      },
      aborted: function (e) { return e === ABORTED; },
      pause: pause,

      printLine: function (item) { return print(row(item)); },

      // A command as the visitor typed it, after the prompt.
      echo: function (cmd) {
        var r = el("div", "term-row plain");
        r.append(el("span", "term-prompt", prompt), document.createTextNode(cmd));
        print(r);
      },

      clear: function () {
        out.textContent = "";
        liveRows = [];
      },

      // A new plain line, typed out one character at a time.
      typeLine: function (text) { return typeInto(print(el("div", "term-row plain")), text); },

      // Line-printer pace: field, pause, value, pause, next line. The rows stay live.
      // Live rows are stored by field index, so a clear mid-print can't shift later rows onto the wrong field.
      printSlow: async function (rows) {
        liveRows = [];
        for (var i = 0; i < rows.length; i++) {
          var r = print(el("div", "term-row"));
          liveRows[i] = r;
          await typeInto(r, rows[i].label);
          r.textContent = pad(rows[i].label);
          await pause(timing.field);
          await typeInto(r, rows[i].value);
          await pause(timing.line);
        }
      },

      // One line per pause. With live set, these rows replace the previous live block.
      printFast: async function (items, live) {
        if (live) liveRows = [];
        for (var i = 0; i < items.length; i++) {
          var r = print(row(items[i]));
          if (live) liveRows[i] = r;
          await pause(timing.fast);
        }
      },

      // Rewrites the newest live block from getRows(). Older blocks stay as printed.
      refreshLive: function (getRows) {
        if (!liveRows.length) return;
        var fresh = getRows();
        liveRows.forEach(function (r, i) {
          if (!fresh[i]) return;
          var text = pad(fresh[i].label) + fresh[i].value;
          if (r.textContent !== text) r.textContent = text;
        });
      },

      drawPrompt: function (value, caret) {
        var p = caret == null ? value.length : caret;
        before.textContent = value.slice(0, p);
        cursor.textContent = value.charAt(p) || BLANK;
        after.textContent = value.slice(p + 1);
      },

      showPrompt: function (show) { line.hidden = !show; },

      // New text for the prompt line and later echoes. Lines already printed keep theirs.
      setPrompt: function (text) {
        prompt = text;
        promptEl.textContent = text;
      },

      // Focuses the hidden input without scrolling the page.
      focus: focus,

      // Screen readers start reading new output from here on.
      announce: function () { out.setAttribute("aria-live", "polite"); },

      setOnline: function (text) { online.textContent = text; },

      // Calls press() when the terminal area is pressed: at pointerdown for a mouse, at click for touch and pen,
      // because click doesn't fire after a pan. When press() returns true for a mouse, the input keeps focus.
      onPress: function (press) {
        var mouse = true;
        term.addEventListener("pointerdown", function (e) {
          mouse = e.pointerType === "mouse";
          if (mouse && e.button === 0 && press()) {
            e.preventDefault();
            focus();
          }
        });
        term.addEventListener("click", function () { if (!mouse) press(); });
      },

      scroll: scroll
    };
  };
})(window.Term = window.Term || {});
