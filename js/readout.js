// Fills the live lines of the status readout: Brisbane time, viewer mode, and the last log date.
(function () {
  var clock = document.querySelector("[data-clock]");
  var mode = document.querySelector("[data-mode]");
  var last = document.querySelector("[data-last]");
  var fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Australia/Brisbane", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  });

  // "last log" mirrors the newest entry in the log list.
  var newest = document.querySelector("#log + ul li .dim");
  if (newest && last) last.textContent = newest.textContent;

  function tick() {
    // Brisbane has no daylight saving, so the zone label is fixed.
    if (clock) clock.textContent = fmt.format(new Date()) + " AEST (UTC+10)";
    var scheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    if (mode) mode.textContent = scheme + " · " + (navigator.language || "?");
  }
  tick();
  setInterval(function () { if (!document.hidden) tick(); }, 1000);
})();
