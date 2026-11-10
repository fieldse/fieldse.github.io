// Turns the status readout into a small terminal: it types `status` once on load, then accepts commands.
// The <dl> stays the data source and the no-JS fallback. readout.js keeps its live values current.
(function () {
  var box = document.querySelector(".readout");
  if (!box) return;
  var dl = box.querySelector("dl");
  var host = box.querySelector(".readout-host").textContent.trim();
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var IDLE_MS = reduce ? 0 : 4500;  // cursor blinks this long before the boot command types
  var TYPE_MS = reduce ? 0 : 70;    // boot command, per character
  var CHAR_MS = reduce ? 0 : 45;    // boot output, per character
  var FIELD_MS = reduce ? 0 : 400;  // boot output, pause between field and value
  var LINE_MS = reduce ? 0 : 1000;  // boot output, pause between lines
  var FAST_MS = reduce ? 0 : 150;   // typed command output, pause between lines
  var LABEL_WIDTH = 12;
  var MAX_LINES = 300;
  var PROMPT = host + ":~$ ";

  // idle: cursor blinks before the auto-run. boot: the auto-run is printing. ready: the visitor's turn.
  var phase = "idle";
  var busy = true;
  var liveRows = [];
  var history = [];
  var histPos = 0;

  var term = el("div", "term");
  var out = el("div", "term-out");
  out.setAttribute("role", "log");
  out.setAttribute("aria-label", "Terminal output");
  var line = el("div", "term-row plain");
  line.setAttribute("aria-hidden", "true");
  // The prompt line is drawn as text before the caret, the character under it, and text after it.
  var before = el("span");
  var cursorEl = el("span", "term-cursor", " ");
  var after = el("span");
  line.append(el("span", "term-prompt", PROMPT), before, cursorEl, after);
  var input = el("input", "term-input");
  input.type = "text";
  input.maxLength = 200;
  input.spellcheck = false;
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("aria-label", "Terminal command. Type help for a list.");
  term.append(out, line);

  // Online counter: time on page, shown in the top-right corner next to the color dot.
  var bar = el("div", "term-bar");
  bar.setAttribute("aria-hidden", "true");
  var onlineEl = el("span", "", "00:00");
  bar.append(el("span", "term-dim", "online "), onlineEl);
  var t0 = Date.now();
  // The input sits outside the scrolling area, so focusing or typing can't drag the view off the newest line.
  box.append(term, input);
  document.body.appendChild(bar);
  new MutationObserver(scroll).observe(term, { childList: true, subtree: true, characterData: true });
  box.classList.add("is-term");
  input.focus({ preventScroll: true });

  // Helpers

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function wait(ms) {
    return ms ? new Promise(function (r) { setTimeout(r, ms); }) : Promise.resolve();
  }

  function pad(label) {
    return label + " ".repeat(Math.max(1, LABEL_WIDTH - label.length));
  }

  function scroll() { term.scrollTop = term.scrollHeight; }

  function print(node) {
    out.appendChild(node);
    while (out.childNodes.length > MAX_LINES) out.removeChild(out.firstChild);
    scroll();
    return node;
  }

  // A string prints as plain text. A {label, value} pair prints in two columns and wraps under the value.
  // Everything goes in as textContent, so typed input can never become markup.
  function row(item) {
    if (typeof item === "string") return el("div", "term-row plain", item);
    var r = el("div", "term-row", pad(item.label));
    if (item.value) r.appendChild(el("span", item.dim ? "term-dim" : "", item.value));
    return r;
  }

  function echo(cmd) {
    var r = el("div", "term-row plain");
    r.append(el("span", "term-prompt", PROMPT), document.createTextNode(cmd));
    print(r);
  }

  function clearScreen() {
    out.textContent = "";
    liveRows = [];
  }

  function statusRows() {
    return Array.prototype.map.call(dl.querySelectorAll("dt"), function (dt) {
      var dd = dt.nextElementSibling;
      return { label: dt.textContent.trim(), value: dd ? dd.textContent.trim() : "" };
    });
  }

  function field(name) {
    var hit = statusRows().filter(function (r) { return r.label === name; })[0];
    return hit ? hit.value : "";
  }

  // Rows of a page list: projects print name + dim description, log prints date + title.
  function listRows(selector) {
    return Array.prototype.map.call(document.querySelectorAll(selector), function (li) {
      var parts = Array.prototype.map.call(li.children, function (c) { return c.textContent.trim(); });
      return { label: parts[0] || "", value: parts[1] || "", dim: li.firstElementChild && li.firstElementChild.tagName === "A" };
    });
  }

  // Printing

  async function typeInto(node, text) {
    var chars = Array.from(text);
    for (var k = 0; k < chars.length; k++) {
      node.textContent += chars[k];
      await wait(CHAR_MS);
    }
  }

  // Line-printer pace for the boot `status`: field, pause, value, pause, next line.
  async function printSlow(rows) {
    liveRows = [];
    for (var j = 0; j < rows.length; j++) {
      var r = print(el("div", "term-row"));
      liveRows.push(r);
      await typeInto(r, rows[j].label);
      r.textContent = pad(rows[j].label);
      await wait(FIELD_MS);
      await typeInto(r, rows[j].value);
      await wait(LINE_MS);
    }
  }

  async function printFast(items, live) {
    if (live) liveRows = [];
    for (var i = 0; i < items.length; i++) {
      var r = print(row(items[i]));
      if (live) liveRows.push(r);
      await wait(FAST_MS);
    }
  }

  // Commands

  var THEMES = Array.prototype.map.call(document.querySelectorAll(".sw-opt"), function (b) {
    return { name: b.getAttribute("aria-label").toLowerCase().replace(/ and /g, "-").replace(/\s+/g, "-"), btn: b };
  });

  var dateFmt = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Brisbane", dateStyle: "full", timeStyle: "long" });

  var COMMANDS = {
    help: function () {
      return [
        { label: "status", value: "machine readout", dim: true },
        { label: "whoami", value: "who's logged in", dim: true },
        { label: "id", value: "user id", dim: true },
        { label: "ls", value: "[projects|log]", dim: true },
        { label: "cat", value: "about", dim: true },
        { label: "theme", value: "[name]  change the accent color", dim: true },
        { label: "history", value: "commands so far", dim: true },
        { label: "date", value: "local time in Brisbane", dim: true },
        { label: "echo", value: "<text>", dim: true },
        { label: "clear", value: "clear the screen (ctrl+l)", dim: true },
        { label: "exit", value: "log out", dim: true }
      ];
    },
    status: function () { return { lines: statusRows(), live: true }; },
    whoami: function () { return ["dev"]; },
    // Linux `id` format, short form, built from the readout's id line.
    id: function () {
      var user = field("id") || "dev";
      return ["uid=1000(" + user + ") gid=1000(" + user + ")"];
    },
    ls: function (args) {
      var what = (args[0] || "").replace(/\/$/, "");
      if (!what) return ["about  projects/  log/"];
      if (what === "projects") return listRows("#projects + ul li");
      if (what === "log") return listRows("#log + ul li");
      if (what === "about") return ["about"];
      return ["ls: " + args[0] + ": No such file or directory"];
    },
    cat: function (args) {
      var what = (args[0] || "").replace(/\/$/, "");
      if (!what) return ["usage: cat about"];
      if (what === "about") {
        var p = document.querySelector("#about p");
        return [p ? p.textContent.replace(/\s+/g, " ").trim() : ""];
      }
      // Easter egg, not listed in help.
      if (what === "/etc/shadow" || what === "etc/shadow") {
        return ["cat: /etc/shadow: Permission denied", "nice try. This incident will be reported."];
      }
      if (what === "projects" || what === "log") return ["cat: " + args[0] + ": Is a directory"];
      return ["cat: " + args[0] + ": No such file or directory"];
    },
    theme: function (args) {
      if (!args[0]) return ["usage: theme <name>", THEMES.map(function (t) { return t.name; }).join(" · ")];
      var name = args[0].toLowerCase();
      var t = THEMES.filter(function (x) { return x.name === name; })[0];
      if (!t) return ["theme: unknown theme: " + args[0]];
      t.btn.click();
      return ["accent: " + t.name];
    },
    history: function () {
      return history.map(function (h, i) { return ("    " + (i + 1)).slice(-5) + "  " + h; });
    },
    date: function () { return [dateFmt.format(new Date())]; },
    echo: function (args, rest) { return [rest]; },
    clear: function () { clearScreen(); return []; },
    sudo: function () { return ["dev is not in the sudoers file. This incident will be reported."]; },
    exit: async function () {
      print(row("logout"));
      await wait(reduce ? 0 : 700);
      clearScreen();
      return [];
    },
    // Easter egg: "scans" the machine and reports the site's sections as open ports.
    nmap: async function (args) {
      if (!args.length) return ["Nmap 7.95 ( https://nmap.org )", "Usage: nmap [Scan Type(s)] [Options] {target}"];
      var lines = [
        "Nmap scan report for straya.local (127.0.0.1)",
        "PORT      STATE     SERVICE",
        "22/tcp    filtered  ssh       nice try",
        "80/tcp    open      http      you're here",
        "1337/tcp  open      projects  try: ls projects",
        "8080/tcp  open      log       try: ls log",
        "Nmap done: 1 IP address (1 host up)"
      ];
      await typeInto(print(el("div", "term-row plain")), "Starting Nmap 7.95 ( https://nmap.org )");
      await wait(reduce ? 0 : 1500);
      for (var i = 0; i < lines.length; i++) {
        await typeInto(print(el("div", "term-row plain")), lines[i]);
        await wait(reduce ? 0 : 400);
      }
      return [];
    }
  };

  // Commands left out of help and Tab completion.
  var HIDDEN = { nmap: true };

  async function submit(raw) {
    busy = true;
    echo(raw);
    line.hidden = true;
    var text = raw.trim();
    if (text) history.push(text);
    histPos = history.length;

    if (text) {
      var words = text.split(/\s+/);
      var name = words[0];
      var rest = text.slice(name.length).trim();
      // Own-property lookup only, so names like "constructor" don't reach Object built-ins.
      var fn = Object.prototype.hasOwnProperty.call(COMMANDS, name) ? COMMANDS[name] : null;
      var res = fn ? await fn(words.slice(1), rest) : ["bash: " + name + ": command not found"].concat(COMMANDS.help());
      if (res && res.lines) await printFast(res.lines, res.live);
      else if (res) await printFast(res, false);
    }

    line.hidden = false;
    busy = false;
    scroll();
  }

  // Input

  // Typing before the auto-run starts cancels it and hands the prompt to the visitor.
  function takeOver() {
    phase = "ready";
    busy = false;
    out.setAttribute("aria-live", "polite");
  }

  function render() {
    var v = input.value;
    var p = input.selectionStart == null ? v.length : input.selectionStart;
    before.textContent = v.slice(0, p);
    cursorEl.textContent = v.charAt(p) || " ";
    after.textContent = v.slice(p + 1);
  }

  function setInput(v, caret) {
    var p = caret == null ? v.length : caret;
    input.value = v;
    input.setSelectionRange(p, p);
    render();
  }

  // Tab completes a command name. On an empty line Tab is left alone, so keyboard users can still tab away.
  function complete() {
    var v = input.value;
    if (!v) return false;
    if (/\s/.test(v)) return true;
    var names = Object.keys(COMMANDS).filter(function (n) { return !HIDDEN[n] && n.indexOf(v) === 0; });
    if (names.length === 1) {
      setInput(names[0] + " ");
    } else if (names.length > 1) {
      var common = names.reduce(function (a, b) {
        var i = 0;
        while (i < a.length && a[i] === b[i]) i++;
        return a.slice(0, i);
      });
      if (common.length > v.length) setInput(common);
      else if (!busy) { echo(v); print(row(names.join("  "))); }
    }
    return true;
  }

  input.addEventListener("input", function () {
    if (phase === "boot") { input.value = ""; return; }
    if (phase === "idle") takeOver();
    render();
  });

  input.addEventListener("keydown", function (e) {
    // Ctrl+L works in every phase, including while output is printing.
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      clearScreen();
      return;
    }
    if (phase === "boot") return;
    if (phase === "idle" && e.key === "Enter") takeOver();
    if (e.key === "Enter") {
      e.preventDefault();
      if (busy) return;
      var v = input.value;
      setInput("");
      submit(v);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      if (!history.length) return;
      histPos = e.key === "ArrowUp" ? Math.max(0, histPos - 1) : Math.min(history.length, histPos + 1);
      setInput(history[histPos] || "");
    } else if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      setInput(input.value, 0);
    } else if (e.ctrlKey && e.key === "e") {
      e.preventDefault();
      setInput(input.value);
    } else if (e.ctrlKey && e.key === "k") {
      // Delete from the caret to the end of the line.
      e.preventDefault();
      var k = input.selectionStart || 0;
      setInput(input.value.slice(0, k), k);
    } else if (e.ctrlKey && e.key === "u") {
      // Delete from the start of the line to the caret.
      e.preventDefault();
      setInput(input.value.slice(input.selectionStart || 0), 0);
    } else if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      if (busy) return;
      echo(input.value + "^C");
      setInput("");
    } else if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (complete()) e.preventDefault();
    } else if (e.key === "Escape") {
      input.blur();
    } else {
      // Native caret moves (arrows, Home, End, Backspace) land after this event, so redraw on the next tick.
      setTimeout(render, 0);
    }
  });

  term.addEventListener("click", function () { input.focus({ preventScroll: true }); });

  function two(n) { return n < 10 ? "0" + n : "" + n; }
  function tickOnline() {
    var s = Math.floor((Date.now() - t0) / 1000);
    var h = Math.floor(s / 3600);
    onlineEl.textContent = (h ? h + ":" : "") + two(Math.floor(s / 60) % 60) + ":" + two(s % 60);
  }

  // The online counter always ticks. The newest status block ticks too, and older blocks stay frozen.
  setInterval(function () {
    if (document.hidden) return;
    tickOnline();
    if (busy || !liveRows.length) return;
    var fresh = statusRows();
    liveRows.forEach(function (r, i) {
      if (!fresh[i]) return;
      var text = pad(fresh[i].label) + fresh[i].value;
      if (r.textContent !== text) r.textContent = text;
    });
  }, 1000);

  // Boot: blink, type `status`, print it at line-printer pace, then hand over to the visitor.

  (async function boot() {
    await wait(IDLE_MS);
    if (phase !== "idle") return;
    phase = "boot";
    var cmd = "status";
    for (var i = 0; i < cmd.length; i++) {
      before.textContent += cmd[i];
      await wait(TYPE_MS ? TYPE_MS + Math.random() * 40 : 0);
    }
    await wait(TYPE_MS ? 250 : 0);
    before.textContent = "";
    echo(cmd);
    history.push(cmd);
    histPos = history.length;
    line.hidden = true;
    await printSlow(statusRows());
    line.hidden = false;
    takeOver();
    scroll();
  })();
})();
