/* ============================================================
   ECLIPSE OS — SHELL VIEW ROUTER   (app shell only)
   Loaded by EclipseOS.html after the embedded view modules.
   Owns the single-page view switch: home ⇄ workboard ⇄ automations,
   with NO page reload. Each embedded view registers a host API on
   load — window.__wbHost / window.__auHost, each { enter, exit } —
   and this router decides which is shown, persists the choice in
   localStorage('sb-view'), and restores it on next load.

   The sidebar's own .active highlight is handled separately by the
   page's selectables handler; this router only drives view state,
   so the two never fight. Plain <a> chrome (Settings, Open on
   mobile) is ignored here and navigates normally.
   ============================================================ */
(function () {
  "use strict";
  var main = document.querySelector('.main');
  var sidebar = document.querySelector('.sidebar');
  if (!main || !sidebar) return;

  var wb = window.__wbHost || null;
  var au = window.__auHost || null;
  var pg = window.__pgHost || null;

  function persist(v) { try { localStorage.setItem('sb-view', v); } catch (e) {} }
  function goHome()        {
    if (au) au.exit();  if (wb) wb.exit();  if (pg) pg.exit();  persist('home');
    // the hero moon sizes itself against the home pane — if the app loaded on
    // another view that pane was hidden (zero-width) at draw time, so nudge a
    // re-measure now that it's visible again.
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }
  function goWorkboard()   { if (au) au.exit();  if (pg) pg.exit();  if (wb) wb.enter(); persist('workboard'); }
  function goAutomations() { if (wb) wb.exit();  if (pg) pg.exit();  if (au) au.enter(); persist('automations'); }
  function goPlugins()     { if (wb) wb.exit();  if (au) au.exit();  if (pg) pg.enter(); persist('plugins'); }

  sidebar.addEventListener('click', function (e) {
    var nav = e.target.closest('.nav-item, .row, .conn-head');
    if (!nav) return;
    if (nav.classList.contains('nv-workboard')) goWorkboard();
    else if (nav.classList.contains('nv-auto')) goAutomations();
    else if (nav.classList.contains('nv-plugins')) goPlugins();
    else goHome();
  });

  // restore last view (and mark its nav item active for a clean first paint)
  function markActive(sel) {
    document.querySelectorAll('.sidebar .row, .sidebar .nav-item, .sidebar .conn-head')
      .forEach(function (s) { s.classList.remove('active'); });
    var el = sidebar.querySelector(sel);
    if (el) el.classList.add('active');
  }
  var restore = null;
  try { restore = localStorage.getItem('sb-view'); } catch (e) {}
  if (restore === 'workboard') { markActive('.nv-workboard'); goWorkboard(); }
  else if (restore === 'automations') { markActive('.nv-auto'); goAutomations(); }
  else if (restore === 'plugins') { markActive('.nv-plugins'); goPlugins(); }
})();
