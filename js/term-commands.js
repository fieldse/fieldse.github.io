// The terminal's command table, and the lookup that runs a typed line against it.
// A command returns its output lines, or {lines, live} when the lines should keep updating.
(function (Term) {
  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }

  // ctx: content (content.js), screen, fs, readout, history, msg, timing {logout, nmapStart, nmapLine}.
  Term.createCommands = function (ctx) {
    var C = ctx.content;
    var screen = ctx.screen;
    var timing = ctx.timing;
    var msg = ctx.msg;

    // Accent swatches from the color switcher, named from their labels: "Yellow and cyan" is "yellow-cyan".
    var themes = Array.prototype.map.call(document.querySelectorAll(".sw-opt"), function (b) {
      return { name: b.getAttribute("aria-label").toLowerCase().replace(/ and /g, "-").replace(/\s+/g, "-"), btn: b };
    });

    var env = Object.assign({}, C.env, { HOME: C.home, USER: C.user });

    var dateFmt = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Brisbane", dateStyle: "full", timeStyle: "long" });

    var COMMANDS = {
      help: function () {
        return C.help.map(function (h) { return { label: h[0], value: h[1], dim: true }; });
      },
      // Printed at boot pace, one character at a time.
      status: function () { return { lines: ctx.readout.rows(), live: true, slow: true }; },
      whoami: function () { return [C.user]; },
      // Linux `id` format, short form, built from the readout's id line.
      id: function () {
        var user = ctx.readout.field("id") || C.user;
        return ["uid=1000(" + user + ") gid=1000(" + user + ")"];
      },
      ls: ctx.fs.ls,
      cd: ctx.fs.cd,
      pwd: ctx.fs.pwd,
      cat: ctx.fs.cat,
      theme: function (args) {
        if (!args[0]) return msg("themeUsage").concat(themes.map(function (t) { return t.name; }).join(" · "));
        var name = args[0].toLowerCase();
        var t = themes.filter(function (x) { return x.name === name; })[0];
        if (!t) return msg("themeUnknown", { name: args[0] });
        t.btn.click();
        return msg("themeSet", { name: t.name });
      },
      history: function () {
        return ctx.history.list().map(function (h, i) { return ("    " + (i + 1)).slice(-5) + "  " + h; });
      },
      date: function () { return [dateFmt.format(new Date())]; },
      // Expands $NAME and ${NAME}. Unknown names expand to "", as in bash.
      echo: function (args, rest) {
        return [rest.replace(/\$(?:\{([A-Za-z_]\w*)\}|([A-Za-z_]\w*))/g, function (all, braced, bare) {
          var name = braced || bare;
          return own(env, name) ? env[name] : "";
        })];
      },
      clear: function () { screen.clear(); return []; },
      sudo: function () { return msg("sudo", { user: C.user }); },
      // Joke: every operand is refused. Flags are ignored. Left out of help, but Tab completes it.
      rm: function (args) {
        var paths = args.filter(function (a) { return a.charAt(0) !== "-"; });
        if (!paths.length) return msg("rmMissing");
        return paths.map(function (p) { return msg("rmDenied", { path: p })[0]; });
      },
      exit: async function () {
        screen.printLine(msg("logout")[0]);
        await screen.pause(timing.logout);
        screen.clear();
        return [];
      },
      // Easter egg: types out a fake scan, line by line.
      nmap: async function (args) {
        if (!args.length) return C.nmap.usage.slice();
        await screen.typeLine(C.nmap.start);
        await screen.pause(timing.nmapStart);
        for (var i = 0; i < C.nmap.lines.length; i++) {
          await screen.typeLine(C.nmap.lines[i]);
          await screen.pause(timing.nmapLine);
        }
        return [];
      }
    };

    return {
      // Runs a trimmed, non-empty line. Resolves to {lines, live}.
      run: async function (text) {
        var words = text.split(/\s+/);
        var name = words[0];
        var rest = text.slice(name.length).trim();
        // Own-property lookup only, so names like "constructor" don't reach Object built-ins.
        var res = own(COMMANDS, name)
          ? await COMMANDS[name](words.slice(1), rest)
          : msg("notFound", { cmd: name });
        return Array.isArray(res) ? { lines: res, live: false } : res;
      },

      // Command names offered by Tab completion. Hidden commands are left out.
      names: function () {
        return Object.keys(COMMANDS).filter(function (n) { return C.hidden.indexOf(n) < 0; });
      }
    };
  };
})(window.Term = window.Term || {});
