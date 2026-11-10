// Turns the status readout into a small terminal: it types `status` once on load, then accepts commands.
// The <dl> stays the data source and the no-JS fallback. readout.js keeps its live values current.
// This file wires the term-*.js modules together and runs the session: phases, submit, boot, the online counter.
(function (Term) {
  var box = document.querySelector(".readout");
  var C = window.TERM_CONTENT;
  if (!box || !C) return;
  var dl = box.querySelector("dl");
  var host = box.querySelector(".readout-host").textContent.trim();
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Delays in ms. Reduced motion sets every one to 0.
  var TIMING = scale(reduce ? 0 : 1, {
    idle: 4500,       // cursor blinks this long before the boot command types
    type: 70,         // boot command, per character
    typeJitter: 40,   // boot command, random extra per character
    typeSettle: 250,  // boot command, pause before it runs
    char: 45,         // typed output, per character
    field: 400,       // boot output, pause between field and value
    line: 1000,       // boot output, pause between lines
    fast: 150,        // command output, pause between lines
    logout: 700,      // exit, pause before the screen clears
    nmapStart: 1500,  // nmap, pause after the start line
    nmapLine: 400     // nmap, pause between lines
  });
  var BOOT_COMMAND = "status";
  // Commands whose arguments Tab completes as paths. cd completes folders only.
  var PATH_COMMANDS = ["cd", "ls", "cat", "rm"];

  // idle: cursor blinks before the auto-run. boot: the auto-run is printing. ready: the visitor's turn.
  var phase = "idle";
  // True while output prints, and during idle until the visitor takes over.
  var busy = true;

  function scale(k, ms) {
    var out = {};
    Object.keys(ms).forEach(function (key) { out[key] = ms[key] * k; });
    return out;
  }

  function two(n) { return n < 10 ? "0" + n : "" + n; }

  // A message from content.js as a list of lines, with {name} placeholders filled from vars.
  function msg(key, vars) {
    return [].concat(C.messages[key]).map(function (s) {
      return s.replace(/\{(\w+)\}/g, function (all, k) {
        return vars && Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : all;
      });
    });
  }

  // The readout <dl> as {label, value} rows.
  var readout = {
    rows: function () {
      return Array.prototype.map.call(dl.querySelectorAll("dt"), function (dt) {
        var dd = dt.nextElementSibling;
        return { label: dt.textContent.trim(), value: dd ? dd.textContent.trim() : "" };
      });
    },
    field: function (name) {
      var hit = readout.rows().filter(function (r) { return r.label === name; })[0];
      return hit ? hit.value : "";
    }
  };

  var fs = Term.createFs(C, readout, msg);

  // The prompt shows the cwd, so it follows cd.
  function promptText() { return host + ":" + fs.where() + "$ "; }

  var screen = Term.createScreen(box, {
    prompt: promptText(),
    labels: { output: C.messages.outputLabel, input: C.messages.inputLabel, online: C.messages.online },
    timing: TIMING,
    // Post pages leave focus on the article.
    autofocus: !document.querySelector(".post-page")
  });
  var startedAt = Date.now();
  var history = Term.createHistory();
  var commands = Term.createCommands({
    content: C, screen: screen, fs: fs, readout: readout, history: history, msg: msg, timing: TIMING
  });
  var editor = Term.createEditor({
    screen: screen,
    history: history,
    names: commands.names,
    paths: function (cmd, word) {
      return PATH_COMMANDS.indexOf(cmd) < 0 ? [] : fs.complete(word, cmd === "cd");
    },
    isBusy: function () { return busy; },
    submit: submit
  });

  // Hands the prompt to the visitor, and cancels the auto-run if it hasn't started.
  function takeOver() {
    phase = "ready";
    busy = false;
    screen.announce();
  }

  // Logs an error from a command or the boot run. An abort is expected and stays quiet.
  function report(e) {
    if (!screen.aborted(e)) console.error(e);
  }

  // Stops output in flight, or the auto-run before it starts, and leaves a blank screen with an empty prompt.
  function interrupt() {
    screen.abort();
    screen.clear();
    editor.reset();
    screen.showPrompt(true);
    takeOver();
  }

  // Never rejects: errors are reported, and the prompt always comes back.
  async function submit(raw) {
    busy = true;
    screen.echo(raw);
    screen.showPrompt(false);
    var text = raw.trim();
    history.add(text);
    try {
      if (text) {
        var res = await commands.run(text);
        if (res.slow) await screen.printSlow(res.lines);
        else await screen.printFast(res.lines, res.live);
      }
    } catch (e) {
      report(e);
    } finally {
      screen.setPrompt(promptText());
      screen.showPrompt(true);
      busy = false;
      screen.scroll();
    }
  }

  screen.input.addEventListener("input", function () {
    if (phase === "boot") { screen.input.value = ""; return; }
    if (phase === "idle") takeOver();
    editor.render();
  });

  screen.input.addEventListener("keydown", function (e) {
    // Ctrl+L works in every phase, including while output is printing.
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      screen.clear();
      return;
    }
    // Ctrl+C stops output in flight, or the auto-run. With nothing printing, the editor echoes ^C.
    if (e.ctrlKey && e.key.toLowerCase() === "c" && busy) {
      e.preventDefault();
      interrupt();
      return;
    }
    if (phase === "boot") return;
    if (phase === "idle" && e.key === "Enter") takeOver();
    editor.onKey(e);
  });

  // A press interrupts only while busy. When nothing prints, a press only focuses, so output stays selectable.
  function press() {
    if (!busy) return false;
    interrupt();
    return true;
  }
  screen.onPress(press);

  // The > shell nav link acts like a press on the terminal, then scrolls it into view and focuses the prompt.
  // screen.focus() doesn't scroll, so the handler scrolls the terminal into view itself.
  var shellLink = document.querySelector(".nav-shell");
  if (shellLink) {
    shellLink.addEventListener("click", function (e) {
      e.preventDefault();
      press();
      box.scrollIntoView({ block: "nearest" });
      screen.focus();
    });
  }

  // Time on page: "MM:SS", with hours in front after the first hour.
  function elapsed() {
    var s = Math.floor((Date.now() - startedAt) / 1000);
    var h = Math.floor(s / 3600);
    return (h ? h + ":" : "") + two(Math.floor(s / 60) % 60) + ":" + two(s % 60);
  }

  // The online counter always ticks. The newest status block ticks too, but not while output prints.
  setInterval(function () {
    if (document.hidden) return;
    screen.setOnline(elapsed());
    if (!busy) screen.refreshLive(readout.rows);
  }, 1000);

  // Boot: blink, type `status`, print it at line-printer pace, then hand over to the visitor.
  // Once the auto-run starts, the prompt always comes back, even after an abort or an error.
  (async function boot() {
    try {
      await screen.pause(TIMING.idle);
    } catch (e) {
      return report(e);
    }
    if (phase !== "idle") return;
    phase = "boot";
    try {
      for (var i = 1; i <= BOOT_COMMAND.length; i++) {
        screen.drawPrompt(BOOT_COMMAND.slice(0, i));
        await screen.pause(TIMING.type + Math.random() * TIMING.typeJitter);
      }
      await screen.pause(TIMING.typeSettle);
      screen.drawPrompt("");
      screen.echo(BOOT_COMMAND);
      history.add(BOOT_COMMAND);
      screen.showPrompt(false);
      await screen.printSlow(readout.rows());
    } catch (e) {
      report(e);
    } finally {
      editor.render();
      screen.showPrompt(true);
      takeOver();
      screen.scroll();
    }
  })();
})(window.Term = window.Term || {});
