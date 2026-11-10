// The terminal's virtual filesystem and the ls and cat commands that read it.
// The tree comes from content.js files, filled from the page's log and project lists.
(function (Term) {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DIR_SIZE = 4096;
  var FAKE_MIN = 1200;   // made-up post sizes, in bytes
  var FAKE_SPAN = 6800;
  var LS_FLAGS = "alth";

  function two(n) { return n < 10 ? "0" + n : "" + n; }

  function hash(s) {
    var h = 7;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // "YYYY-MM-DD HH:MM", with a daytime clock time picked from the name.
  function stamp(date, name) {
    var h = hash(name);
    return date + " " + two(9 + h % 12) + ":" + two(h % 60);
  }

  // date is "YYYY-MM-DD", or a full stamp to copy as-is.
  function entry(name, dir, date, size) {
    return { name: name, dir: dir, date: date.length > 10 ? date : stamp(date, name), size: dir ? DIR_SIZE : size };
  }

  function bytes(s) { return new TextEncoder().encode(s + "\n").length; }

  function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  function label(e) { return e.name + (e.dir ? "/" : ""); }

  // ls -h sizes: 4.0K, 13K, 1.2M. Rounds up, like GNU ls.
  function human(n) {
    if (n < 1024) return String(n);
    var units = ["K", "M", "G"];
    var v = n / 1024;
    var u = 0;
    while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
    return (v < 10 ? (Math.ceil(v * 10) / 10).toFixed(1) : String(Math.ceil(v))) + units[u];
  }

  // ls -l dates: "Nov 10 12:00", or "Nov 10  2025" when older than six months.
  function lsDate(s) {
    var y = +s.slice(0, 4), m = +s.slice(5, 7), d = +s.slice(8, 10);
    var old = Date.now() - new Date(y, m - 1, d).getTime() > 182 * 864e5;
    return MONTHS[m - 1] + " " + (d < 10 ? " " : "") + d + " " + (old ? " " + y : s.slice(11, 16));
  }

  // Splits ls arguments into flags and paths. bad is the first unknown flag letter.
  function parseLsArgs(args) {
    var flags = {};
    var paths = [];
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (a.length < 2 || a.charAt(0) !== "-") { paths.push(a); continue; }
      for (var j = 1; j < a.length; j++) {
        var f = a.charAt(j);
        if (LS_FLAGS.indexOf(f) < 0) return { bad: f };
        flags[f] = true;
      }
    }
    return { flags: flags, paths: paths };
  }

  function byName(x, y) { return x.name < y.name ? -1 : x.name > y.name ? 1 : 0; }

  function newestFirst(x, y) { return x.date !== y.date ? (x.date < y.date ? 1 : -1) : byName(x, y); }

  // C: content.js. readout: the page's readout lines. msg: a content.js message as lines.
  Term.createFs = function (C, readout, msg) {
    var HOME = C.home;

    function buildDate() { return readout.field("build") || "1970-01-01"; }

    function homeFile(name) {
      return C.files.filter(function (f) { return f.name === name; })[0] || null;
    }

    // Text of a content.js file: written there, or read from the page.
    function fileText(f) {
      if (f.text != null) return f.text;
      var n = document.querySelector(f.page);
      return n ? n.textContent.replace(/\s+/g, " ").trim() : "";
    }

    // One post file from a log list item: name from its link, date from its .dim label.
    function postEntry(n, ext) {
      var a = n.querySelector("a");
      var d = n.querySelector(".dim");
      var title = a ? a.textContent.trim() : "";
      var href = (a && a.getAttribute("href")) || "";
      var slug = href.split("/").pop().replace(/\.html$/, "").replace(/^#?$/, "") || slugify(title);
      var e = entry(slug + (ext || ""), false, d ? d.textContent.trim() : buildDate(), FAKE_MIN + hash(slug) % FAKE_SPAN);
      e.title = title;
      e.url = href.replace(/^\.\.\//, "");
      return e;
    }

    // Entries of a folder filled from a page list.
    function fromPage(src) {
      return Array.prototype.map.call(document.querySelectorAll(src.list), function (n) {
        return src.as === "folders" ? entry(slugify(n.textContent), true, buildDate()) : postEntry(n, src.ext);
      });
    }

    // Home's entries. A page-filled folder is dated by its newest entry.
    function homeList() {
      return C.files.map(function (f) {
        if (!f.from) return entry(f.name, false, buildDate(), bytes(fileText(f)));
        var newest = fromPage(f.from).map(function (k) { return k.date; }).sort().pop();
        return entry(f.name, true, newest || buildDate());
      });
    }

    // Resolves p one segment at a time, from home unless it starts with "/". ".." stops at "/".
    // Returns the path relative to home ("" is home itself), or an absolute path outside home.
    function norm(p) {
      var segs = p.charAt(0) === "/" ? [] : HOME.split("/").slice(1);
      var parts = p.split("/");
      if (parts[0] === "~") parts.shift();
      parts.forEach(function (s) {
        if (s === "" || s === ".") return;
        if (s === "..") segs.pop();
        else segs.push(s);
      });
      var full = "/" + segs.join("/");
      if (full === HOME) return "";
      return full.indexOf(HOME + "/") === 0 ? full.slice(HOME.length + 1) : full;
    }

    // Entries in a directory, or null when the path is not a directory.
    function dirList(path) {
      // Folders above home hold the next path segment, so "/" lists "home/" and "/home" lists "dev/".
      if (path.charAt(0) === "/" && (HOME + "/").indexOf(path === "/" ? "/" : path + "/") === 0) {
        var next = HOME.slice(path === "/" ? 1 : path.length + 1).split("/")[0];
        return [entry(next, true, buildDate())];
      }
      if (path === "") return homeList();
      var f = homeFile(path);
      if (f && f.from) return fromPage(f.from);
      var hit = find(path);
      return hit && hit.dir ? [] : null;
    }

    // One entry by path, or null.
    function find(path) {
      var i = path.lastIndexOf("/");
      var parent = i < 0 ? "" : (i === 0 ? "/" : path.slice(0, i));
      if (parent === path) return null;
      var list = dirList(parent);
      return (list || []).filter(function (e) { return e.name === path.slice(i + 1); })[0] || null;
    }

    function longRows(entries, h, withTotal) {
      var sizes = entries.map(function (e) { return h ? human(e.size) : String(e.size); });
      var w = Math.max.apply(null, sizes.map(function (s) { return s.length; }).concat(1));
      var rows = entries.map(function (e, i) {
        return (e.dir ? "drwxr-xr-x 2" : "-rw-r--r-- 1") + " " + C.user + " " + C.user + " " +
          (" ".repeat(w) + sizes[i]).slice(-w) + " " + lsDate(e.date) + " " + label(e);
      });
      if (!withTotal) return rows;
      var blocks = entries.reduce(function (n, e) { return n + Math.ceil(e.size / DIR_SIZE) * 4; }, 0);
      return ["total " + (h ? human(blocks * 1024) : blocks)].concat(rows);
    }

    // ls: -a keeps a folder's dot entries and adds . and .., -t sorts newest first, -l formats long rows, -h shortens sizes.
    function ls(args) {
      var parsed = parseLsArgs(args);
      if (parsed.bad) return msg("lsBadFlag", { flag: parsed.bad });
      var flags = parsed.flags;
      var target = parsed.paths[0] || ".";
      var path = norm(target);
      // Post pages carry no lists, so point at the home page instead of printing nothing.
      var hf = homeFile(path);
      if (hf && hf.from && !document.querySelector(hf.from.list)) return msg("lsOnHome", { path: path });
      var list = dirList(path);
      var single = list ? null : find(path);
      if (!list && !single) return msg("lsMissing", { path: target });

      var entries = list ? list.slice() : [single];
      if (list && flags.a) entries = [entry(".", true, buildDate()), entry("..", true, buildDate())].concat(entries);
      if (list && !flags.a) entries = entries.filter(function (e) { return e.name.charAt(0) !== "."; });
      entries.sort(flags.t ? newestFirst : byName);
      if (flags.l) return longRows(entries, flags.h, !!list);
      return entries.length ? [entries.map(label).join("  ")] : [];
    }

    function cat(args) {
      var what = args[0] || "";
      if (!what) return msg("catUsage");
      if (C.secret.paths.indexOf(what) >= 0) return C.secret.lines.slice();
      var path = norm(what);
      var e = dirList(path) ? { dir: true } : find(path);
      if (!e) return msg("catMissing", { path: what });
      if (e.dir) return msg("catDir", { path: what });
      if (what.charAt(what.length - 1) === "/") return msg("catNotDir", { path: what });
      var f = homeFile(path);
      if (f) return [fileText(f)];
      return msg("catPost", { title: e.title, url: e.url });
    }

    return { ls: ls, cat: cat };
  };
})(window.Term = window.Term || {});
