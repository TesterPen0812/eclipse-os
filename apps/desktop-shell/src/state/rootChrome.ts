// Eclipse OS desktop shell - root chrome (theme + interface preferences).
//
// Typed extraction of the two head IIFEs from the frozen static authority
// (source lines 1493-1521). Applied to <html> before render to avoid a flash.
// localStorage keys (sb-theme, sb-density, sb-msgsize, sb-usage, sb-reduce) and
// the cross-tab `storage` / visibility / focus re-apply semantics are unchanged.

/**
 * Theme + interface preferences, applied to <html>. Call once before mount.
 */
export function initRootChrome(): void {
  // ===== theme (system-aware, live across tabs) =====
  (function () {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    function read(): string {
      try {
        return localStorage.getItem('sb-theme') || 'dark';
      } catch {
        return 'dark';
      }
    }
    function resolve(pref: string): string {
      return pref === 'system' ? (mq.matches ? 'light' : 'dark') : (pref || 'dark');
    }
    function apply(): void {
      document.documentElement.setAttribute('data-theme', resolve(read()));
    }
    apply();
    mq.addEventListener('change', function () {
      if (read() === 'system') apply();
    });
    window.addEventListener('storage', function (e) {
      if (e.key === 'sb-theme') apply();
    });
    document.addEventListener('visibilitychange', apply);
    window.addEventListener('focus', apply);
  })();

  // ===== interface prefs shared with Settings -> Appearance (live across tabs) =====
  (function () {
    function get(k: string): string | null {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    }
    function apply(): void {
      const r = document.documentElement;
      r.setAttribute('data-density', get('sb-density') === 'compact' ? 'compact' : 'comfortable');
      const fs = parseInt(get('sb-msgsize') || '', 10);
      r.style.setProperty('--msg-size', (fs >= 13 && fs <= 19 ? fs : 15) + 'px');
      r.setAttribute('data-usage', get('sb-usage') === 'off' ? 'off' : 'on');
      r.setAttribute('data-motion', get('sb-reduce') === 'on' ? 'reduce' : 'auto');
    }
    apply();
    window.addEventListener('storage', function (e) {
      if (e.key && ['sb-density', 'sb-msgsize', 'sb-usage', 'sb-reduce'].indexOf(e.key) > -1) apply();
    });
    document.addEventListener('visibilitychange', apply);
    window.addEventListener('focus', apply);
  })();
}
