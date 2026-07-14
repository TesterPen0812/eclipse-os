/* ============================================================
   Eclipse OS — theme-boot.js · the ONE shared theme bootstrap
   ------------------------------------------------------------
   Load SYNCHRONOUSLY in <head>, before any stylesheet link:

     <script src="theme-boot.js"></script>

   Stamps data-theme + data-appearance + data-motion on <html>
   before first paint, resolves 'system' and legacy 'light' prefs
   to a concrete theme id, and re-applies live on storage /
   visibility / OS-scheme changes.

   Contract (shared by every Eclipse OS surface):
     · localStorage 'sb-theme'  — system | dark | midnight | amber |
                                  atlas | daybreak | minimal
                                  (legacy 'light' → atlas)
     · localStorage 'sb-reduce' — 'on' ⇒ data-motion="reduce"
                                  (written by Settings → Appearance)
     · THEMES registry: id → appearance. Adding a theme = one row
       here + a token block in tokens/colors.css (rebuild styles.css)
       + a picker entry in Settings/Tweaks. Nothing else.

   Single-file surfaces (EclipseOS.html, Settings.html,
   EclipseOSMobile.html) inline an equivalent bootstrap to stay
   self-contained; keep those copies in sync with this file.
   ============================================================ */
(function () {
  var r = document.documentElement;
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  var THEMES = { dark: 'dark', midnight: 'dark', amber: 'dark',
                 atlas: 'light', daybreak: 'light', minimal: 'light' };
  var DEFAULT_LIGHT = 'atlas';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function resolve(pref) {
    if (pref === 'system') return mq.matches ? DEFAULT_LIGHT : 'dark';
    if (pref === 'light') return DEFAULT_LIGHT;      /* legacy value */
    return THEMES[pref] ? pref : 'dark';             /* unknown → safe default */
  }
  function apply() {
    var resolved = resolve(get('sb-theme') || 'dark');
    var appearance = THEMES[resolved] || 'dark';
    r.setAttribute('data-theme', resolved);
    r.setAttribute('data-appearance', appearance);
    r.style.colorScheme = appearance;
    r.setAttribute('data-motion', get('sb-reduce') === 'on' ? 'reduce' : 'auto');
  }
  apply();
  mq.addEventListener('change', function () { if ((get('sb-theme') || 'dark') === 'system') apply(); });
  window.addEventListener('storage', function (e) { if (!e.key || e.key === 'sb-theme' || e.key === 'sb-reduce') apply(); });
  document.addEventListener('visibilitychange', apply);
  window.addEventListener('focus', apply);
})();
