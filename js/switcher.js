// Accent color switcher: the dot in the top-right corner. The choice is kept per browser in localStorage.
(function () {
  var root = document.documentElement;
  var sw = document.querySelector(".sw");
  var btn = sw.querySelector(".sw-btn");
  var menu = sw.querySelector(".sw-menu");
  var opts = Array.prototype.slice.call(sw.querySelectorAll(".sw-opt"));

  opts.forEach(function (o) {
    o.style.setProperty("--c", o.dataset.accent);
    if (o.dataset.under) o.style.setProperty("--c2", o.dataset.under);
  });

  function apply(i) {
    var o = opts[i] || opts[0];
    root.style.setProperty("--accent", o.dataset.accent);
    if (o.dataset.under) root.style.setProperty("--under", o.dataset.under);
    else root.style.removeProperty("--under");
    btn.style.setProperty("--c", o.dataset.accent);
    opts.forEach(function (x) { x.setAttribute("aria-pressed", x === o); });
  }

  function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", open);
  }

  var saved = 0;
  try { saved = parseInt(localStorage.getItem("accent"), 10) || 0; } catch (e) {}
  apply(saved);

  btn.addEventListener("click", function () { setOpen(menu.hidden); });
  opts.forEach(function (o, i) {
    o.addEventListener("click", function () {
      apply(i);
      try { localStorage.setItem("accent", i); } catch (e) {}
      setOpen(false);
    });
  });
  document.addEventListener("click", function (e) { if (!sw.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setOpen(false); btn.focus(); } });

  // Hidden until this script runs, so the page shows no dead control without JS.
  sw.hidden = false;
})();
