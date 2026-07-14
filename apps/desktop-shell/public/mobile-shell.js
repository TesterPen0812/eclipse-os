/* ============================================================
   ECLIPSE OS — MOBILE SHELL (shared behaviors)
   Sheet plumbing (open/close, drag-to-dismiss, Escape), the
   sliding seg-pill positioner, the §7 toast, and the shared
   svg() icon builder. Exported on window.MSHELL.
   Loads after theme-boot.js / styles.css, before module js.
   ============================================================ */
(function () {
  "use strict";

  function svg(d, sw) {
    var p = d.split(' M').map(function (s, i) { return '<path d="' + (i ? 'M' + s : s) + '"/>'; }).join('');
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) +
      '" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }
  function esc(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---- bottom sheet: open(html), close(), drag-to-dismiss on the grab ---- */
  function sheet(opts) {
    var el = opts.sheet, scrim = opts.scrim;
    var isOpen = false;

    function open(html) {
      el.innerHTML = '<div class="m-grab"><i></i></div>' + html;
      el.scrollTop = 0;
      var sc = el.querySelector('.m-sheet-scroll');
      if (sc) sc.scrollTop = 0;
      scrim.classList.add('open');
      void el.offsetWidth; /* commit the closed transform, then transition in (no rAF — reliable in throttled frames) */
      el.classList.add('open');
      isOpen = true;
      wireGrab();
    }
    function close() {
      if (!isOpen) return;
      el.classList.remove('open');
      scrim.classList.remove('open');
      isOpen = false;
      if (opts.onClose) opts.onClose();
    }
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });

    /* drag-to-dismiss — the grab handle owns the gesture */
    function wireGrab() {
      var grab = el.querySelector('.m-grab');
      if (!grab) return;
      var y0 = null, t0 = 0, dy = 0;
      grab.addEventListener('pointerdown', function (e) {
        y0 = e.clientY; t0 = Date.now(); dy = 0;
        el.classList.add('dragging');
        grab.setPointerCapture(e.pointerId);
      });
      grab.addEventListener('pointermove', function (e) {
        if (y0 == null) return;
        dy = Math.max(0, e.clientY - y0);
        el.style.transform = 'translateY(' + dy + 'px)';
      });
      function release() {
        if (y0 == null) return;
        var v = dy / Math.max(1, Date.now() - t0);
        el.classList.remove('dragging');
        el.style.transform = '';
        if (dy > 130 || v > 0.55) close();
        y0 = null;
      }
      grab.addEventListener('pointerup', release);
      grab.addEventListener('pointercancel', release);
    }

    return { open: open, close: close, isOpen: function () { return isOpen; }, el: el };
  }

  /* ---- sliding seg-pill: measure the .on tab, travel with squash ---- */
  function segThumb(seg, animate) {
    var thumb = seg.querySelector('.m-seg-thumb');
    var on = seg.querySelector('.m-seg-tab.on');
    if (!thumb || !on) return;
    if (!on.offsetWidth) { requestAnimationFrame(function () { segThumb(seg, false); }); return; }
    thumb.style.width = on.offsetWidth + 'px';
    var x = on.offsetLeft - 3;
    if (!animate) {
      thumb.style.transition = 'none';
      thumb.style.transform = 'translateX(' + x + 'px)';
      void thumb.offsetWidth;
      thumb.style.transition = '';
      return;
    }
    thumb.style.transform = 'translateX(' + x + 'px) scaleY(0.82)';
    setTimeout(function () { thumb.style.transform = 'translateX(' + x + 'px)'; }, 140);
  }

  /* ---- toast: ink pill, words fade in, green stamp pops last (§7) ---- */
  function toaster(el) {
    var timer = null;
    el.addEventListener('mouseenter', function () { clearTimeout(timer); });
    el.addEventListener('mouseleave', function () { timer = setTimeout(function () { el.classList.remove('show'); }, 1400); });
    return function toast(icon, html, stamp) {
      clearTimeout(timer);
      el.classList.remove('show');
      void el.offsetWidth; /* restart so the stamp re-pops */
      el.innerHTML = '<span class="tz-ic">' + icon + '</span><span class="tz-txt">' + html + '</span>' +
        (stamp ? '<span class="tz-stamp"></span>' : '');
      el.classList.add('show');
      timer = setTimeout(function () { el.classList.remove('show'); }, 3800);
    };
  }

  window.MSHELL = { svg: svg, esc: esc, sheet: sheet, segThumb: segThumb, toaster: toaster };
})();
