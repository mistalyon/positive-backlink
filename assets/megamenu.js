// PositiveBacklink Mega Menu v1
(function() {
  "use strict";
  var triggers = document.querySelectorAll(".pbmega-trigger");
  var openPanel = null;
  var closeTimer = null;

  function panelFor(trigger) {
    return trigger.parentElement.querySelector(".pbmega-panel");
  }

  function open(trigger) {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    if (openPanel && openPanel.trigger !== trigger) close();
    var panel = panelFor(trigger);
    if (!panel) return;
    trigger.setAttribute("aria-expanded", "true");
    panel.classList.add("is-open");
    openPanel = { trigger: trigger, panel: panel };
  }

  function close() {
    if (!openPanel) return;
    openPanel.trigger.setAttribute("aria-expanded", "false");
    openPanel.panel.classList.remove("is-open");
    openPanel = null;
  }

  function scheduleClose() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(close, 180);
  }

  triggers.forEach(function(trig) {
    var item = trig.parentElement;
    item.addEventListener("mouseenter", function() { open(trig); });
    item.addEventListener("mouseleave", scheduleClose);
    trig.addEventListener("click", function(e) {
      e.preventDefault();
      if (openPanel && openPanel.trigger === trig) close(); else open(trig);
    });
    trig.addEventListener("keydown", function(e) {
      if (e.key === "Escape") close();
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(trig); }
    });
  });

  document.addEventListener("click", function(e) {
    if (!e.target.closest(".pbmega-item")) close();
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") close();
  });

  // Mobile drawer
  var hamburger = document.getElementById("pbnav-hamburger");
  var drawer = document.getElementById("pbnav-drawer");
  if (hamburger && drawer) {
    hamburger.addEventListener("click", function() {
      var isOpen = drawer.classList.toggle("is-open");
      drawer.classList.toggle("hidden", !isOpen);
      hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.classList.toggle("pbnav-locked", isOpen);
    });
  }
})();