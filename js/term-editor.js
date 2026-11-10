// Line editing for the terminal prompt: command history, Tab completion and the Ctrl key bindings.
(function (Term) {
  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }

  // Commands entered so far, with a cursor for Up and Down.
  Term.createHistory = function () {
    var items = [];
    var pos = 0;
    return {
      // Stores a non-empty line. Any submit moves the cursor past the newest entry.
      add: function (text) {
        if (text) items.push(text);
        pos = items.length;
      },
      list: function () { return items.slice(); },
      size: function () { return items.length; },
      // Moves the cursor one entry older (-1) or newer (1). Past the newest entry is an empty line.
      step: function (dir) {
        pos = dir < 0 ? Math.max(0, pos - 1) : Math.min(items.length, pos + 1);
        return items[pos] || "";
      }
    };
  };

  function longestPrefix(names) {
    return names.reduce(function (a, b) {
      var i = 0;
      while (i < a.length && a[i] === b[i]) i++;
      return a.slice(0, i);
    });
  }

  // opts: screen, history, names (completable commands), isBusy, submit(line).
  Term.createEditor = function (opts) {
    var screen = opts.screen;
    var history = opts.history;
    var input = screen.input;

    function render() { screen.drawPrompt(input.value, input.selectionStart); }

    function setInput(v, caret) {
      var p = caret == null ? v.length : caret;
      input.value = v;
      input.setSelectionRange(p, p);
      render();
    }

    // Native caret moves (arrows, Home, End, Backspace) land after the keydown, so redraw on the next tick.
    function renderLater() { setTimeout(render, 0); }

    // Completes a command name. Returns false on an empty line, so Tab still moves focus for keyboard users.
    function complete() {
      var v = input.value;
      if (!v) return false;
      if (/\s/.test(v)) return true;
      var names = opts.names().filter(function (n) { return n.indexOf(v) === 0; });
      if (names.length === 1) {
        setInput(names[0] + " ");
      } else if (names.length > 1) {
        var common = longestPrefix(names);
        if (common.length > v.length) setInput(common);
        else if (!opts.isBusy()) { screen.echo(v); screen.printLine(names.join("  ")); }
      }
      return true;
    }

    // With no history, the key keeps its native caret move.
    function browse(e, dir) {
      if (!history.size()) return renderLater();
      e.preventDefault();
      setInput(history.step(dir));
    }

    var KEYS = {
      Enter: function (e) {
        e.preventDefault();
        if (opts.isBusy()) return;
        var v = input.value;
        setInput("");
        opts.submit(v);
      },
      ArrowUp: function (e) { browse(e, -1); },
      ArrowDown: function (e) { browse(e, 1); },
      Tab: function (e) {
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return renderLater();
        if (complete()) e.preventDefault();
      },
      Escape: function () { input.blur(); }
    };

    var CTRL_KEYS = {
      a: function () { setInput(input.value, 0); },
      e: function () { setInput(input.value); },
      // Delete from the caret to the end of the line.
      k: function () {
        var k = input.selectionStart || 0;
        setInput(input.value.slice(0, k), k);
      },
      // Delete from the start of the line to the caret.
      u: function () { setInput(input.value.slice(input.selectionStart || 0), 0); },
      c: function () {
        if (opts.isBusy()) return;
        screen.echo(input.value + "^C");
        setInput("");
      }
    };

    return {
      render: render,

      // Empties the line and redraws the prompt.
      reset: function () { setInput(""); },

      onKey: function (e) {
        if (e.ctrlKey && own(CTRL_KEYS, e.key)) {
          e.preventDefault();
          CTRL_KEYS[e.key](e);
        } else if (own(KEYS, e.key)) {
          KEYS[e.key](e);
        } else {
          renderLater();
        }
      }
    };
  };
})(window.Term = window.Term || {});
