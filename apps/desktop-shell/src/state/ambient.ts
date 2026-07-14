// Eclipse OS desktop shell - ambient chrome (G9 extraction).
//
// Typed extraction of the live clock + time-aware greeting and the home-state
// starfield from the frozen authority (source lines 1941-2007). The clock ticks
// every 15s; the starfield places up to 38 stars (deterministic placement loop),
// adds cursor parallax, and spawns a rare shooting star every 12-30s while the
// home state is visible. Reduced-motion suppresses the parallax + shooting star,
// exactly as the source did.

import { getById, getQuery } from './dom';

export function initAmbient(): void {
  // ===== fable refresh: live clock + time-aware greeting =====
  const greetingEl = getById('greeting');
  const clockEl = getById('ebClock');
  function pad2(n: number): string {
    return (n < 10 ? '0' : '') + n;
  }
  function tickClock(): void {
    const d = new Date();
    if (clockEl) clockEl.textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    const h = d.getHours();
    const part = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    if (greetingEl) greetingEl.innerHTML = part + ' — what should we build in <span class="repo-hl">Eclipse OS</span>?';
  }
  tickClock();
  setInterval(tickClock, 15000);

  // ===== fable refresh: ambient starfield (home state only) =====
  (function () {
    const centerEl = getQuery<HTMLElement>('.center');
    if (!centerEl) return;
    const reduceStars = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glyphs = ['·', '+', '.', '˖', '*'];
    let placed = 0,
      tries = 0;
    while (placed < 38 && tries < 320) {
      tries++;
      const x = 3 + Math.random() * 94;
      const y = 3 + Math.random() * 94;
      const dx = x - 50,
        dy = y - 44;
      // keep a clear ellipse around the moon + wordmark
      if (Math.sqrt(dx * dx * 0.6 + dy * dy) < 27) continue;
      const s = document.createElement('span');
      const bright = placed % 7 === 3; // a handful of standout stars
      s.className = bright ? 'star bright' : 'star';
      s.textContent = bright ? '+' : glyphs[(Math.random() * glyphs.length) | 0];
      s.style.left = x.toFixed(2) + '%';
      s.style.top = y.toFixed(2) + '%';
      s.style.setProperty('--tw', (bright ? 2.6 + Math.random() * 3 : 3.5 + Math.random() * 5).toFixed(2) + 's');
      s.style.setProperty('--td', (-Math.random() * 8).toFixed(2) + 's');
      s.style.setProperty('--depth', (0.25 + Math.random() * 0.75).toFixed(2));
      s.style.setProperty('--pk', (bright ? 0.9 : 0.45 + Math.random() * 0.3).toFixed(2));
      centerEl.appendChild(s);
      placed++;
    }
    if (!reduceStars) {
      // depth parallax: the field drifts gently opposite the cursor
      document.addEventListener(
        'mousemove',
        function (e) {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          centerEl.style.setProperty('--sfx', (-nx * 12).toFixed(2) + 'px');
          centerEl.style.setProperty('--sfy', (-ny * 9).toFixed(2) + 'px');
        },
        { passive: true },
      );
      // rare shooting star, home state only
      (function loop() {
        setTimeout(
          function () {
            const main = getQuery('.main');
            if (!document.hidden && !(main && main.classList.contains('chat'))) {
              const sh = document.createElement('span');
              sh.className = 'shootingstar';
              sh.style.left = 8 + Math.random() * 58 + '%';
              sh.style.top = 4 + Math.random() * 30 + '%';
              sh.style.setProperty('--ang', (196 + Math.random() * 36).toFixed(0) + 'deg');
              centerEl.appendChild(sh);
              setTimeout(function () {
                sh.remove();
              }, 1500);
            }
            loop();
          },
          12000 + Math.random() * 18000,
        );
      })();
    }
  })();
}
