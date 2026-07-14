/* ============================================================
   ECLIPSE OS — AUTOMATIONS 2  (vanilla, data-driven)
   Desktop, design-system aligned. A calm centered column of flat
   Mat cards on a Board Mat; opening one HERO-EXPANDS a centered
   detail panel (white panel in a gray mat, actions on the mat);
   creating/editing opens a DIALOG MAT (stacked form). Jobs fire
   on real schedules while the page is open — running rows stream
   their terminal line in place. au-cron.js owns the schedule math.
   ============================================================ */
(function () {
  "use strict";
  var root = document.getElementById('a2Root');
  if (!root || !window.AU_CRON) return;
  // EMBEDDED mode: inside the EclipseOS shell the view mounts as a hidden .main
  // section (class .automations-view) and the shell view-router shows/hides it
  // through window.__auHost — same contract the old automations module used.
  // Standalone (Automations 2.html) keeps its own page-local theme + Tweaks.
  var EMBEDDED = root.classList.contains('automations-view');

  var C = window.AU_CRON;
  var JOBS = C.JOBS;
  var now = function () { return Date.now(); };
  var DAY = 86400000;
  var TZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'; } catch (e) { return 'local'; } })();

  // ---- icons (24-box, currentColor) ----
  var I = {
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7v5l4 2',
    close: 'M6 6l12 12 M18 6 6 18',
    check: 'M5 12.5 10 17.5 19 6.5',
    chev:  'M7 9.3 12 14.2l5-4.9',
    cycle: 'M4.6 12a7.4 7.4 0 0 1 12.6-5.2L20 9 M20 4.6V9h-4.5 M19.4 12a7.4 7.4 0 0 1-12.6 5.2L4 15 M4 19.4V15h4.5',
    search:'M10.6 4.4a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Z M15.4 15.4 20 20',
    play:  'M8.5 5.6 18 12l-9.5 6.4Z',
    pause: 'M9 5.5v13 M15 5.5v13',
    term:  'M3.6 5h16.8a1.6 1.6 0 0 1 1.6 1.6v10.8a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 17.4V6.6A1.6 1.6 0 0 1 3.6 5Z M6.5 9.3l3 2.7-3 2.7 M12.5 14.7h4.5',
    box:   'M12 3.6 20 8v8l-8 4.4L4 16V8l8-4.4Z M4 8l8 4.4L20 8 M12 12.4v8',
    send:  'M12 19.3V5.4 M6 11.2 12 5.2l6 6',
    cal:   'M5.4 5.7h13.2a1.6 1.6 0 0 1 1.6 1.6v11a1.6 1.6 0 0 1-1.6 1.6H5.4a1.6 1.6 0 0 1-1.6-1.6v-11a1.6 1.6 0 0 1 1.6-1.6Z M3.8 9.5h16.4 M8 3.7v3.4 M16 3.7v3.4',
    xfail: 'M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Z M9 9l6 6 M15 9l-6 6',
    okc:   'M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Z M8.4 12.4l2.5 2.5 4.7-5.3',
    trash: 'M4.5 6.5h15 M9.6 6.5V5.1a1.5 1.5 0 0 1 1.5-1.5h1.8a1.5 1.5 0 0 1 1.5 1.5v1.4 M6.4 6.5l.8 12a2 2 0 0 0 2 1.9h5.6a2 2 0 0 0 2-1.9l.8-12 M10 10.6v5.6 M14 10.6v5.6',
    pencil:'M4.4 18.8 5.4 15.1 15.7 4.8a2 2 0 0 1 2.8 2.8L8.2 17.9 4.4 18.8Z',
    zap:   'M13 3.4 5.4 13.2h5.2L11 20.6l7.6-9.8h-5.2L13 3.4Z',
    bell:  'M12 4.1a5.7 5.7 0 0 1 5.7 5.7c0 3.1.9 4.6 1.7 5.5H4.6c.8-.9 1.7-2.4 1.7-5.5A5.7 5.7 0 0 1 12 4.1Z M10 18.6a2.1 2.1 0 0 0 4 0',
    slider:'M4 7.5h9 M17 7.5h3 M15 5.4v4.2 M4 16.5h3 M11 16.5h9 M9 14.4v4.2',
    sunrise:'M4 17.5h16 M8.2 14.2a3.9 3.9 0 0 1 7.6 0 M12 4.6v2.8 M5.3 8.1l2 2 M18.7 8.1l-2 2',
    chart: 'M4.2 4.6v14.8 M4.2 19.4H20 M7.6 14.6l3.3-3.7 2.7 2.3 4.7-5.5',
    rocket:'M12 3.5c2.3 1.7 3.5 4.3 3.5 7.2 0 1.5-.3 2.9-.8 4.1H9.3a10.7 10.7 0 0 1-.8-4.1c0-2.9 1.2-5.5 3.5-7.2Z M12 8.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z M9.3 14.8 7.5 17.5h9l-1.8-2.7 M12 17.5v3',
    bug:   'M12 7.6a4.4 4.4 0 0 1 4.4 4.4v2.4a4.4 4.4 0 0 1-8.8 0V12A4.4 4.4 0 0 1 12 7.6Z M9.7 8.1 8.2 6 M14.3 8.1 15.8 6 M7.6 12H4.6 M19.4 12h-3 M8 15.8l-2.5 1.9 M16 15.8l2.5 1.9 M12 7.6V19',
    dots:  'M5.7 12h.01 M12 12h.01 M18.3 12h.01',
    arrow: 'M4.8 12h14.4 M13.6 6.4l5.6 5.6-5.6 5.6'
  };
  var SPARK = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6c.7 5 3.4 8.7 9.4 9.4-6 .7-8.7 4.4-9.4 9.4-.7-5-3.4-8.7-9.4-9.4 6-.7 8.7-4.4 9.4-9.4Z"></path></svg>';

  function svg(d, sw) {
    var p = d.split(' M').map(function (s, i) { return '<path d="' + (i ? 'M' + s : s) + '"/>'; }).join('');
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }
  function esc(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ============ TEMPLATES — shared data lives in au-suggestions.js ============
  var TEMPLATES = (window.AU_SUG && window.AU_SUG.TEMPLATES) || [];
  function tplById(id) { return window.AU_SUG ? window.AU_SUG.byId(id) : null; }

  // ============ JOB STATE ============
  function computeNext(job) { job._next = job.enabled && !job.running ? C.nextFire(job.schedule, now()) : null; }
  JOBS.forEach(computeNext);
  function stateOf(job) {
    if (job.running) return 'running';
    if (!job.enabled) return 'paused';
    var last = job.runs[0];
    if (last && !last.ok) return 'failing';
    return 'active';
  }
  function jobById(id) { for (var i = 0; i < JOBS.length; i++) if (JOBS[i].id === id) return JOBS[i]; return null; }

  // ============ DECOR — starfield + corner moon ============
  var STARS = [
    [22, 8, '\u00b7'], [36, 4, '.'], [58, 13, '\u00b7'], [83, 7, '+'], [93, 21, '.'],
    [10, 22, '.'], [17, 38, '\u00b7'], [7, 55, '+'], [90, 42, '\u02d6'], [95, 60, '.'],
    [88, 76, '\u00b7'], [79, 91, '+'], [64, 96, '.'], [42, 93, '\u00b7'], [70, 30, '.'],
    [50, 45, '\u02d6'], [61, 71, '\u00b7'], [45, 25, '.'], [4, 90, '.'], [31, 60, '.']
  ];
  function decorHtml() {
    var s = '<div class="a2-decor" id="a2Decor">';
    STARS.forEach(function (st, i) {
      s += '<span class="a2-star" style="left:' + st[0] + '%;top:' + st[1] + '%;--tw:' + (3.6 + (i % 6) * 1.05).toFixed(2) + 's;--td:' + (i * 0.53).toFixed(2) + 's;--pk:' + (0.22 + (i % 4) * 0.09).toFixed(2) + '">' + st[2] + '</span>';
    });
    s += '<canvas class="a2-bigmoon" id="a2Bigmoon" width="620" height="620" aria-hidden="true"></canvas></div>';
    return s;
  }

  // ============ STIPPLED CANVAS MOON ============
  var CRATERS = [[-0.35, -0.25, 0.28], [0.32, 0.18, 0.22], [0.05, 0.48, 0.18], [-0.12, 0.18, 0.12], [0.42, -0.3, 0.14]];
  function hash2(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function drawMoon(canvas, size, gap, dot, amp) {
    if (!canvas) return;
    amp = amp == null ? 1 : amp;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = canvas.height = Math.round(size * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    var light = document.documentElement.getAttribute('data-appearance') === 'light';
    ctx.fillStyle = getComputedStyle(root).color;
    var cx = size / 2, cy = size / 2, R = size / 2 - 2;
    var lx = -0.58, ly = -0.2, lz = 0.78;
    var ll = Math.sqrt(lx * lx + ly * ly + lz * lz); lx /= ll; ly /= ll; lz /= ll;
    for (var py = -R; py <= R; py += gap) {
      for (var px = -R; px <= R; px += gap) {
        var jx = px + (hash2(px + 7, py + 3) - 0.5) * gap;
        var jy = py + (hash2(px + 1, py + 9) - 0.5) * gap;
        var x = jx / R, y = jy / R, d = x * x + y * y;
        if (d > 1) continue;
        var z = Math.sqrt(1 - d);
        var v = Math.max(0, x * lx + y * ly + z * lz);
        v = Math.pow(v, 1.25);
        for (var k = 0; k < CRATERS.length; k++) {
          var cr = CRATERS[k], dx = x - cr[0], dy = y - cr[1];
          var t = Math.sqrt(dx * dx + dy * dy) / cr[2];
          if (t < 1) v *= 0.5 + 0.5 * t * t;
        }
        v *= 0.72 + 0.28 * z;
        var dens = light ? 1 - v : v;
        dens = dens * dens * (3 - 2 * dens);
        if (hash2(px, py) < (dens * 0.92 + 0.04) * amp) {
          ctx.globalAlpha = (0.2 + 0.8 * Math.min(1, dens * 1.15)) * amp;
          ctx.fillRect(cx + jx, cy + jy, dot, dot);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  function redrawMoons() {
    drawMoon(document.getElementById('a2Bigmoon'), 620, 4.4, 1.5, 0.55);
    drawMoon(document.getElementById('a2MoonCanvas'), 118, 2, 1.1);
  }
  new MutationObserver(redrawMoons).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-appearance'] });

  // ============ SHELL ============
  root.innerHTML =
    decorHtml() +
    '<div class="a2-topbar"><div class="a2-topbar-inner">' +
      '<span class="spring"></span>' +
      '<div class="a2-createwrap" id="a2CreateWrap">' +
        '<button class="a2-create" id="a2Create">Create' + svg(I.chev, 2) + '</button>' +
        '<div class="a2-menu" id="a2CreateMenu">' +
          '<button class="a2-menu-it" data-new="chat" style="--d:30ms">' + SPARK + 'Create with Eclipse</button>' +
          '<button class="a2-menu-it" data-new="manual" style="--d:70ms">' + svg(I.slider) + 'Set up manually</button>' +
        '</div>' +
      '</div>' +
    '</div></div>' +
    '<div class="a2-scroll">' +
      '<div class="a2-col" id="a2Tasks">' +
        '<header class="a2-hero"><h1>Automations</h1><p class="a2-sub">Ask Eclipse to schedule tasks, set reminders, or monitor for updates.</p></header>' +
        '<label class="a2-search" id="a2SearchWrap">' + svg(I.search) + '<input id="a2Search" type="text" placeholder="Search automations"></label>' +
        '<div class="a2-ftabs" id="a2Ftabs">' +
          '<button class="a2-ftab on" data-f="all">All</button>' +
          '<button class="a2-ftab" data-f="active">Active</button>' +
          '<button class="a2-ftab" data-f="paused">Paused</button>' +
        '</div>' +
        '<div class="a2-sections" id="a2Sections"></div>' +
        '<div class="a2-empty" id="a2Empty"></div>' +
        '<div id="a2SugWrap"></div>' +
      '</div>' +
    '</div>' +
    '<div class="a2-scrim" id="a2Scrim"></div>' +
    '<div class="a2-detail-wrap" id="a2DetailWrap"><div class="a2-detail" id="a2Detail"></div></div>' +
    '<div class="a2-dialog-wrap" id="a2DialogWrap"><div class="a2-dialog" id="a2Dialog"></div></div>' +
    '<div class="a2-toast" id="a2Toast"></div>';

  var $ = function (id) { return document.getElementById(id); };
  var sectionsEl = $('a2Sections');
  var state = { q: '', filter: 'all' };
  drawMoon($('a2Bigmoon'), 620, 4.4, 1.5, 0.55);

  // ============ FILTER TABS ============
  $('a2Ftabs').addEventListener('click', function (e) {
    var t = e.target.closest('.a2-ftab');
    if (!t || t.dataset.f === state.filter) return;
    state.filter = t.dataset.f;
    $('a2Ftabs').querySelectorAll('.a2-ftab').forEach(function (b) { b.classList.toggle('on', b === t); });
    renderSections();
  });

  // ============ CREATE MENU ============
  var createWrap = $('a2CreateWrap');
  $('a2Create').addEventListener('click', function (e) { e.stopPropagation(); closeCardMenus(); createWrap.classList.toggle('open'); });
  $('a2CreateMenu').addEventListener('click', function (e) {
    var it = e.target.closest('.a2-menu-it'); if (!it) return;
    createWrap.classList.remove('open');
    openDialog(null, null, it.dataset.new === 'chat' ? 'prompt' : 'name');
  });
  document.addEventListener('click', function (e) {
    if (!createWrap.contains(e.target)) createWrap.classList.remove('open');
    if (!e.target.closest('.a2-cardmenu')) closeCardMenus();
  });
  function closeCardMenus() { sectionsEl.querySelectorAll('.a2-menu.open').forEach(function (m) { m.classList.remove('open'); }); }

  // ============ TASK CARDS ============
  function matches(job) {
    if (!state.q) return true;
    var hay = (job.name + ' ' + (job.source || '') + ' ' + (job.desc || '') + ' ' + job.prompt + ' ' + schedLabel(job)).toLowerCase();
    return hay.indexOf(state.q) !== -1;
  }
  function schedLabel(job) {
    if (job.schedText) return job.schedText;
    var s = C.describe(job.schedule).replace(/\b0(\d:)/g, '$1');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function nextRel(job) {
    if (job._next == null) return null;
    var ms = job._next - now();
    if (ms < 3600000) return 'in ' + Math.max(1, Math.round(ms / 60000)) + 'm';
    var a = new Date(), b = new Date(job._next);
    var days = Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / DAY);
    if (days <= 0) return 'today';
    if (days === 1) return 'tomorrow';
    return 'in ' + days + ' days';
  }
  function cardL2(job) {
    if (job.running) {
      var lines = liveLines(job);
      var tail = lines.length ? lines[lines.length - 1] : 'starting \u2026';
      return '<span class="live">running \u00b7 ' + C.fmtMMSS(now() - job.running.t0) + ' \u2014 ' + esc(tail) + ' <span class="cursor">\u2588</span></span>';
    }
    if (!job.enabled) {
      if (job.completed) { var r0 = job.runs[0]; return 'Completed<span class="sep">\u00b7</span>ran ' + (r0 ? C.fmtAbs(r0.ts, true) : 'once'); }
      return 'Paused<span class="sep">\u00b7</span>' + esc(schedLabel(job));
    }
    var rel = nextRel(job);
    var s = esc(schedLabel(job)) + '<span class="sep">\u00b7</span>' + (rel == null ? 'Not scheduled' : 'Next run ' + rel);
    var last = job.runs[0];
    if (last && !last.ok) s += '<span class="sep">\u00b7</span><span class="warn">last run failed</span>';
    return s;
  }
  function cardHtml(job) {
    var st = stateOf(job);
    return '<div class="a2-card' + (st === 'paused' ? ' paused' : '') + '" data-job="' + job.id + '" data-state="' + st + '" tabindex="0" data-screen-label="Automation card">' +
      '<span class="a2-ring"></span>' +
      '<div class="a2-card-main">' +
        '<div class="a2-l1"><span class="nm">' + esc(job.name) + '</span></div>' +
        '<div class="a2-l2" data-l2>' + cardL2(job) + '</div>' +
      '</div>' +
      '<div class="a2-cardmenu">' +
        '<button class="a2-dots" data-dots aria-label="More actions">' + svg(I.dots, 2.6) + '</button>' +
        '<div class="a2-menu">' +
          '<button class="a2-menu-it" data-act="run"' + (job.running ? ' disabled' : '') + ' style="--d:25ms">' + svg(I.play) + 'Run now</button>' +
          '<button class="a2-menu-it" data-act="toggle" style="--d:55ms">' + svg(job.enabled ? I.pause : I.play, job.enabled ? 2 : 1.7) + (job.enabled ? 'Pause' : 'Resume') + '</button>' +
          '<button class="a2-menu-it" data-act="edit" style="--d:85ms">' + svg(I.pencil) + 'Edit</button>' +
          '<button class="a2-menu-it danger" data-act="delete" style="--d:115ms">' + svg(I.trash) + 'Delete</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ============ EMPTY STATE ============
  var MSTARS = [[168, 26, '+'], [198, 84, '\u00b7'], [16, 96, '\u00b7'], [150, 2, '.']];
  function emptyHtml() {
    return '<div class="a2-moonwrap">' +
        '<canvas class="a2-moon" id="a2MoonCanvas" width="118" height="118" aria-hidden="true"></canvas>' +
        '<div class="a2-moonshadow"></div>' +
        '<span class="a2-sparkle">' + SPARK + '</span>' +
        MSTARS.map(function (st, i) { return '<span class="a2-mstar" style="left:' + st[0] + 'px;top:' + st[1] + 'px;--tw:' + (4 + i * 1.2).toFixed(1) + 's;--td:' + (i * 0.8).toFixed(1) + 's;--pk:0.45">' + st[2] + '</span>'; }).join('') +
      '</div>' +
      '<span class="e1">Create your first automation</span>' +
      '<span class="e2">Schedule recurring tasks, reminders and monitors for your work \u2014 or start from a template.</span>' +
      '<div class="a2-tpls">' + TEMPLATES.slice(0, 4).map(function (t) { return '<button class="a2-tpl" data-tpl="' + t.id + '">' + svg(I[t.ic]) + esc(t.name) + '</button>'; }).join('') + '</div>';
  }

  function renderSections() {
    var has = JOBS.length > 0;
    $('a2SearchWrap').style.display = has ? '' : 'none';
    $('a2Ftabs').style.display = has ? '' : 'none';
    $('a2SugWrap').style.display = has ? '' : 'none';
    var list = JOBS.filter(function (j) {
      if (!matches(j)) return false;
      if (state.filter === 'active') return !!(j.enabled || j.running);
      if (state.filter === 'paused') return !j.enabled && !j.running;
      return true;
    });
    list.sort(function (a, b) {
      var ra = a.running ? 0 : (a.enabled ? 1 : 2), rb = b.running ? 0 : (b.enabled ? 1 : 2);
      if (ra !== rb) return ra - rb;
      if (ra === 0) return a.running.t0 - b.running.t0;
      if (ra === 2) return a.name.localeCompare(b.name);
      var na = a._next == null ? Infinity : a._next, nb = b._next == null ? Infinity : b._next;
      return na - nb;
    });
    var empty = $('a2Empty');
    if (!has) {
      sectionsEl.innerHTML = ''; empty.className = 'a2-empty show'; empty.innerHTML = emptyHtml();
      drawMoon($('a2MoonCanvas'), 118, 2, 1.1); return;
    }
    if (!list.length) {
      sectionsEl.innerHTML = ''; empty.className = 'a2-empty show';
      empty.innerHTML = '<span class="e1">Nothing here</span><span class="e2">' + (state.q ? 'Clear the search and try again.' : 'No ' + (state.filter === 'all' ? '' : state.filter + ' ') + 'automations right now.') + '</span>'; return;
    }
    empty.className = 'a2-empty'; empty.innerHTML = '';
    sectionsEl.innerHTML = '<div class="a2-list">' + list.map(cardHtml).join('') + '</div>';
  }

  // ============ SUGGESTIONS (reusable section — automations/au-suggestions.js) ============
  function renderSuggestions() {
    if (window.AU_SUG) window.AU_SUG.render($('a2SugWrap'), {
      onPick: function (t) { openDialog(null, t, 'name'); }
    });
  }

  // ============ CLICKS (delegation) ============
  root.addEventListener('click', function (e) {
    var tpl = e.target.closest('[data-tpl]');
    if (tpl) { openDialog(null, tplById(tpl.dataset.tpl), 'name'); return; }
    var card = e.target.closest('.a2-card');
    if (!card) return;
    var job = jobById(card.dataset.job);
    if (!job) return;
    var dots = e.target.closest('[data-dots]');
    if (dots) {
      e.stopPropagation();
      var menu = dots.parentNode.querySelector('.a2-menu');
      var wasOpen = menu.classList.contains('open');
      closeCardMenus(); createWrap.classList.remove('open');
      if (!wasOpen) menu.classList.add('open');
      return;
    }
    var act = e.target.closest('.a2-menu-it[data-act]');
    if (act) {
      e.stopPropagation(); closeCardMenus();
      switch (act.dataset.act) {
        case 'run': if (!job.running) startRun(job, true); break;
        case 'toggle': togglePause(job); break;
        case 'edit': openDialog(job); break;
        case 'delete': deleteJob(job); break;
      }
      return;
    }
    if (e.target.closest('.a2-cardmenu')) return;
    openDetail(job);
  });
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var card = e.target.closest && e.target.closest('.a2-card');
    if (card && e.target === card) { var j = jobById(card.dataset.job); if (j) openDetail(j); }
  });
  function deleteJob(job) {
    JOBS.splice(JOBS.indexOf(job), 1);
    if (detail.job === job) closeDetail();
    if (dialog.job === job) closeDialog();
    renderAll();
    toast(I.trash, '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 deleted');
  }

  // ============ SEARCH ============
  $('a2Search').addEventListener('input', function (e) { state.q = e.target.value.trim().toLowerCase(); renderSections(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    $('a2Search').focus();
  });

  // ============ RUNS ============
  function startRun(job, manual) {
    if (job.running) return;
    var isolated = job.session !== 'main';
    job.running = { t0: now(), dur: isolated ? 5200 + Math.random() * 4200 : 2300 + Math.random() * 1800, manual: !!manual };
    job._next = null;
    renderAll();
    if (detail.job === job) renderDetail(job);
  }
  function finishRun(job) {
    var r = job.running;
    var ok = !job.alwaysFails;
    var lines = (C.LIVE_LINES[job.id] || ['run started \u00b7 ' + job.name.toLowerCase(), 'done']).slice();
    job.runs.unshift({ ts: r.t0, ok: ok, dur: now() - r.t0, lines: lines });
    if (job.runs.length > 30) job.runs.length = 30;
    job.running = null;
    if (job.schedule.type === 'at') { job.enabled = false; job.completed = true; }
    computeNext(job);
    renderAll();
    if (detail.job === job) renderDetail(job);
    var d = C.fmtDur(job.runs[0].dur);
    if (ok) {
      var extra = job.session === 'main' ? 'event injected into main session' : (job.delivery === 'announce' ? 'summary posted to main chat' : 'logged');
      toast(I.okc, '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 ok in ' + d + ' \u00b7 ' + extra, true);
    } else {
      toast(I.xfail, '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 failed after ' + d);
    }
  }
  function togglePause(job) {
    job.enabled = !job.enabled;
    if (job.enabled) job.completed = false;
    computeNext(job);
    renderAll();
    if (detail.job === job) renderDetail(job);
    toast(job.enabled ? I.play : I.pause, '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 ' + (job.enabled ? 'resumed \u00b7 next ' + (job._next ? C.fmtAbs(job._next) : '\u2014') : 'paused'));
  }
  function liveLines(job) {
    if (!job.running) return [];
    var all = C.LIVE_LINES[job.id] || ['run started \u00b7 ' + job.name.toLowerCase()];
    var frac = (now() - job.running.t0) / job.running.dur;
    var n = Math.min(all.length, Math.floor(frac * (all.length + 1)));
    return all.slice(0, n);
  }

  // ============ HERO-EXPAND DETAIL ============
  var detail = { job: null };
  var detailWrap = $('a2DetailWrap'), detailEl = $('a2Detail'), scrimEl = $('a2Scrim');
  function openDetail(job) { detail.job = job; renderDetail(job); scrimEl.classList.add('open'); detailWrap.classList.add('open'); }
  function closeDetail() { detail.job = null; scrimEl.classList.remove('open'); detailWrap.classList.remove('open'); }

  function schedInstrument(job) {
    var s = job.schedule, inner = '<div class="a2-sched-expr">' + esc(C.exprText(s)) + '</div>';
    if (s.type === 'cron') {
      var f = String(s.expr).trim().split(/\s+/), labels = ['min', 'hour', 'day', 'mon', 'dow'];
      inner += '<div class="a2-fields">' + f.map(function (v, i) { return '<div class="a2-fcell"><span class="fv">' + esc(v) + '</span><span class="fl">' + labels[i] + '</span></div>'; }).join('') + '</div>';
    }
    var human = s.type === 'cron' ? (C.describeCron(s.expr) || 'cron schedule') : s.type === 'every' ? C.fmtEvery(s.ms) + ' \u00b7 anchored ' + C.fmtClock(s.anchor) : 'runs once, then retires';
    inner += '<div class="a2-sched-human">' + svg(I.cal) + '<span>' + esc(human) + '</span><span class="tz">' + esc(TZ) + '</span></div>';
    return '<div class="a2-well a2-sched">' + inner + '</div>';
  }
  function nextFiresHtml(job) {
    if (job.running) return '<div class="a2-nf"><span class="nf-tick" style="background:var(--a2-alive)"></span><span class="nf-abs" style="color:var(--a2-alive)">running now</span><span class="nf-rel">' + C.fmtMMSS(now() - job.running.t0) + '</span></div>';
    if (!job.enabled) return '<div class="a2-nf none">' + (job.completed ? 'completed \u00b7 one-shot already ran' : 'paused \u00b7 won\u2019t fire until resumed') + '</div>';
    var fires = C.firesBetween(job.schedule, now(), now() + 45 * DAY, 3);
    if (!fires.length) return '<div class="a2-nf none">no upcoming fires</div>';
    return fires.map(function (ts) { return '<div class="a2-nf"><span class="nf-tick"></span><span class="nf-abs">' + esc(C.fmtAbs(ts)) + '</span><span class="nf-rel">in ' + C.fmtCountdown(ts - now()) + '</span></div>'; }).join('');
  }
  function attemptsHtml(job) {
    var out = '';
    if (job.running) {
      var shown = liveLines(job);
      out += '<div class="a2-attempt running expanded"><div class="a2-attempt-head">' + svg(I.cycle) +
        '<div class="at-main"><span class="at-name"><span class="live">running</span> \u00b7 ' + C.fmtMMSS(now() - job.running.t0) + '</span>' +
        '<span class="at-sub">started ' + C.fmtClock(job.running.t0, true) + (job.running.manual ? ' \u00b7 manual' : ' \u00b7 scheduled') + '</span></div>' +
        '</div><div class="a2-attempt-log">' + shown.map(esc).join('\n') + (shown.length ? '\n' : '') + '<span class="cursor">\u2588</span></div></div>';
    }
    if (!job.runs.length && !job.running) return '<div class="a2-hist-empty">no runs yet \u2014 fires for the first time ' + (job._next ? C.fmtAbs(job._next) : 'when resumed') + '</div>';
    out += job.runs.slice(0, 8).map(function (r, i) {
      var hasLog = r.lines && r.lines.length;
      return '<div class="a2-attempt' + (r.ok ? '' : ' failed') + '" data-run="' + i + '">' +
        '<div class="a2-attempt-head"' + (hasLog ? '' : ' style="cursor:default"') + '>' + svg(r.ok ? I.okc : I.xfail) +
        '<div class="at-main"><span class="at-name">' + (r.ok ? 'ok in ' : 'failed after ') + C.fmtDur(r.dur) + '</span>' +
        '<span class="at-sub">' + C.fmtAbs(r.ts, true) + ' \u00b7 ' + C.fmtAgo(now() - r.ts) + '</span></div>' +
        (hasLog ? '<span class="at-chev">' + svg(I.chev, 2) + '</span>' : '') + '</div>' +
        (hasLog ? '<div class="a2-attempt-log">' + r.lines.map(esc).join('\n') + '</div>' : '') +
      '</div>';
    }).join('');
    return out;
  }
  function renderDetail(job) {
    var st = stateOf(job);
    var stName = { running: 'running', paused: job.completed ? 'completed' : 'paused', failing: 'failing', active: 'active' }[st];
    detailEl.innerHTML =
      '<div class="a2-detail-panel">' +
        '<div class="a2-detail-head">' +
          '<span class="a2-jid">cron:' + esc(job.id) + '</span>' +
          '<span class="a2-badge" data-state="' + st + '"><span class="b-dot"></span>' + stName + '</span>' +
          '<span class="spring"></span>' +
          '<button class="a2-detail-close" data-x="close">' + svg(I.close, 2) + '</button>' +
        '</div>' +
        '<div class="a2-detail-body">' +
          '<div class="a2-d-title">' + esc(job.name) + '</div>' +
          '<div class="a2-d-prompt">' + esc(job.prompt) + '</div>' +
          '<div class="a2-sec"><div class="a2-eyebrow">Schedule</div>' + schedInstrument(job) + '<div class="a2-fires">' + nextFiresHtml(job) + '</div></div>' +
          '<div class="a2-sec"><div class="a2-eyebrow">Run config</div><div class="a2-kvs">' +
            '<div class="a2-kv">' + svg(job.session === 'main' ? I.term : I.box) + '<span class="rk">session</span><span class="rv">' + (job.session === 'main' ? 'main \u00b7 injected as a system event' : 'isolated \u00b7 <span class="mono">cron:' + esc(job.id) + '</span>') + '</span></div>' +
            '<div class="a2-kv">' + svg(I.zap) + '<span class="rk">model</span><span class="rv">' + esc(job.model) + (job.model === 'default' ? ' <span class="dim">\u00b7 follows the app</span>' : '') + '</span></div>' +
            '<div class="a2-kv">' + svg(I.send) + '<span class="rk">delivery</span><span class="rv">' + (job.delivery === 'announce' ? 'announce \u00b7 summary to main chat' : 'silent \u00b7 log only') + '</span></div>' +
            '<div class="a2-kv">' + svg(I.clock) + '<span class="rk">timeout</span><span class="rv">' + (job.timeoutMin || 10) + ' min</span></div>' +
          '</div></div>' +
          '<div class="a2-sec"><div class="a2-eyebrow">History <span class="n">' + job.runs.length + '</span></div><div class="a2-attempts" id="a2Attempts">' + attemptsHtml(job) + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="a2-detail-acts">' +
        '<button class="a2-action go" data-x="run"' + (job.running ? ' disabled' : '') + '>' + svg(I.play) + 'Run now</button>' +
        '<button class="a2-action" data-x="toggle">' + svg(job.enabled ? I.pause : I.play, 2) + (job.enabled ? 'Pause' : 'Resume') + '</button>' +
        '<button class="a2-action" data-x="edit">' + svg(I.pencil) + 'Edit</button>' +
        '<span class="spring"></span>' +
        '<button class="a2-action danger" data-x="delete">' + svg(I.trash) + 'Delete</button>' +
      '</div>';
  }
  detailEl.addEventListener('click', function (e) {
    var x = e.target.closest('[data-x]');
    if (x) {
      var job = detail.job;
      switch (x.dataset.x) {
        case 'close': closeDetail(); return;
        case 'run': if (job && !job.running) startRun(job, true); return;
        case 'toggle': if (job) togglePause(job); return;
        case 'edit': if (job) { var j = job; closeDetail(); openDialog(j, null, null, true); } return;
        case 'delete': if (job) deleteJob(job); return;
      }
    }
    var head = e.target.closest('.a2-attempt-head');
    if (head) { var att = head.closest('.a2-attempt'); if (att && !att.classList.contains('running') && att.querySelector('.a2-attempt-log')) att.classList.toggle('expanded'); }
  });
  scrimEl.addEventListener('click', function () { closeDetail(); closeDialog(); });

  // ============ DIALOG MAT — create / edit ============
  var dialog = { job: null, mode: null, from: null };
  var dialogWrap = $('a2DialogWrap'), dialogEl = $('a2Dialog');
  var form = null;
  function openDialog(job, seed, focus, fromDetail) {
    dialog.job = job; dialog.mode = job ? 'edit' : 'new'; dialog.from = fromDetail ? 'detail' : 'list';
    renderDialog(job, seed);
    scrimEl.classList.add('open'); dialogWrap.classList.add('open');
    if (!job) { var el = focus === 'prompt' ? $('a2fPrompt') : $('a2fName'); if (el) setTimeout(function () { el.focus(); }, 320); }
  }
  function closeDialog() {
    var back = dialog.from === 'detail' ? dialog.job : null;
    dialog.job = null; dialog.mode = null; dialog.from = null;
    dialogWrap.classList.remove('open');
    if (back) { openDetail(back); } else { scrimEl.classList.remove('open'); }
  }
  function pick(name, opts) {
    return '<div class="a2-pick" data-pick="' + name + '">' + opts.map(function (o) {
      return '<button class="a2-pick-opt' + (form[name] === o.v ? ' on' : '') + '" data-v="' + o.v + '">' + (o.ic ? svg(o.ic) : '') + esc(o.l) + '</button>';
    }).join('') + '</div>';
  }
  function renderDialog(job, seed) {
    form = job ? {
      name: job.name, prompt: job.prompt, type: job.schedule.type,
      expr: job.schedule.type === 'cron' ? job.schedule.expr : '0 9 * * 1-5',
      everyN: job.schedule.type === 'every' ? Math.round(job.schedule.ms / 60000) : 30,
      everyUnit: (job.schedule.type === 'every' && job.schedule.ms % 3600000 === 0) ? 'h' : 'm',
      at: job.schedule.type === 'at' ? job.schedule.ts : now() + 3600000,
      session: job.session, delivery: job.delivery, model: job.model
    } : { name: '', prompt: '', type: 'cron', expr: '0 9 * * 1-5', everyN: 30, everyUnit: 'm', at: now() + 3600000, session: 'isolated', delivery: 'announce', model: 'default' };
    if (!job && seed && seed.form) { for (var k in seed.form) form[k] = seed.form[k]; }
    if (form.everyUnit === 'h' && job) form.everyN = Math.max(1, Math.round(form.everyN / 60));
    var frameLbl = job ? 'Edit automation' : (seed ? 'Template \u00b7 ' + seed.name.toLowerCase() : 'New automation');
    dialogEl.innerHTML =
      '<div class="a2-dlg-frame-lbl">' + esc(frameLbl) + '</div>' +
      '<div class="a2-dlg-panel">' +
        '<div class="a2-field"><label class="a2-flabel">Name</label><input class="a2-input" id="a2fName" type="text" placeholder="What should the agent do, in a few words" value="' + esc(form.name) + '"></div>' +
        '<div class="a2-field"><label class="a2-flabel">Prompt</label><textarea class="a2-input a2-ta" id="a2fPrompt" placeholder="The instruction the agent runs with. Be specific about where results go.">' + esc(form.prompt) + '</textarea></div>' +
        '<div class="a2-field"><label class="a2-flabel">Schedule</label>' + pick('type', [{ v: 'cron', l: 'cron' }, { v: 'every', l: 'interval' }, { v: 'at', l: 'once' }]) + '<div id="a2fSched"></div><div class="a2-preview" id="a2fPreview"></div></div>' +
        '<div class="a2-field"><label class="a2-flabel">Session</label>' + pick('session', [{ v: 'isolated', l: 'isolated', ic: I.box }, { v: 'main', l: 'main session', ic: I.term }]) + '<div class="a2-hint" id="a2fSessHint"></div></div>' +
        '<div class="a2-field"><label class="a2-flabel">Delivery</label>' + pick('delivery', [{ v: 'announce', l: 'announce to chat', ic: I.send }, { v: 'silent', l: 'silent' }]) + '</div>' +
        '<div class="a2-field"><label class="a2-flabel">Model</label>' + pick('model', [{ v: 'default', l: 'default' }, { v: 'opus', l: 'opus' }, { v: 'sonnet', l: 'sonnet' }]) + '</div>' +
      '</div>' +
      '<div class="a2-dlg-acts">' +
        '<button class="a2-pillbtn ghost" data-x="cancel">Cancel</button>' +
        '<button class="a2-pillbtn ink" data-x="save">' + svg(I.check, 2) + (job ? 'Save changes' : 'Create automation') + '</button>' +
      '</div>';
    renderSchedInputs(); updateSessHint(); updatePreview();
  }
  function renderSchedInputs() {
    var el = $('a2fSched');
    if (form.type === 'cron') {
      el.innerHTML = '<div class="a2-sched-inputs"><input class="a2-input mono" id="a2fExpr" type="text" spellcheck="false" value="' + esc(form.expr) + '" placeholder="0 9 * * 1-5"></div>';
    } else if (form.type === 'every') {
      el.innerHTML = '<div class="a2-sched-inputs"><input class="a2-input num" id="a2fEveryN" type="number" min="1" max="999" value="' + form.everyN + '"><div class="a2-pick" data-pick="everyUnit" style="flex:1"><button class="a2-pick-opt' + (form.everyUnit === 'm' ? ' on' : '') + '" data-v="m" style="flex:1">minutes</button><button class="a2-pick-opt' + (form.everyUnit === 'h' ? ' on' : '') + '" data-v="h" style="flex:1">hours</button></div></div>';
    } else {
      var d = new Date(form.at);
      var val = d.getFullYear() + '-' + C.pad2(d.getMonth() + 1) + '-' + C.pad2(d.getDate()) + 'T' + C.pad2(d.getHours()) + ':' + C.pad2(d.getMinutes());
      el.innerHTML = '<div class="a2-sched-inputs"><input class="a2-input mono" id="a2fAt" type="datetime-local" value="' + val + '"></div>';
    }
  }
  function formSchedule() {
    if (form.type === 'cron') return C.parseCron(form.expr) ? { type: 'cron', expr: form.expr.trim().replace(/\s+/g, ' ') } : null;
    if (form.type === 'every') { var n = parseInt(form.everyN, 10); if (!(n >= 1)) return null; return { type: 'every', ms: n * (form.everyUnit === 'h' ? 3600000 : 60000), anchor: now() }; }
    var ts = form.at; return (ts && ts > now()) ? { type: 'at', ts: ts } : null;
  }
  function updatePreview() {
    var pv = $('a2fPreview'); if (!pv) return;
    var sched = formSchedule();
    if (!sched) {
      var msg = form.type === 'cron' ? 'invalid expression \u00b7 5 fields: min hour day month weekday' : form.type === 'every' ? 'interval must be at least 1' : 'pick a time in the future';
      pv.className = 'a2-preview invalid';
      pv.innerHTML = '<div class="pv-line"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="bad"><path d="M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Z"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/></svg><span class="pv-ok">' + esc(msg) + '</span></div>';
      return;
    }
    pv.className = 'a2-preview';
    var human = sched.type === 'cron' ? (C.describeCron(sched.expr) || 'cron \u00b7 ' + sched.expr) : sched.type === 'every' ? C.fmtEvery(sched.ms) : 'once \u00b7 ' + C.fmtAbs(sched.ts, true);
    var fires = C.firesBetween(sched, now(), now() + 45 * DAY, 3);
    pv.innerHTML = '<div class="pv-line">' + svg(I.check, 2) + '<span class="pv-ok">' + esc(human) + '</span></div>' + (fires.length ? '<div class="pv-fires">next: ' + fires.map(function (t) { return esc(C.fmtAbs(t)); }).join(' \u00b7 ') + '</div>' : '');
  }
  function updateSessHint() {
    var el = $('a2fSessHint'); if (!el) return;
    el.textContent = form.session === 'main' ? 'the prompt lands in your main chat as a system event \u2014 the agent replies there' : 'runs in its own session (cron:\u2026) so it never interrupts your chat';
  }
  function slugify(name) {
    var base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'automation';
    var id = base, i = 2; while (jobById(id)) id = base + '-' + (i++); return id;
  }
  function saveForm() {
    var nameEl = $('a2fName'), name = nameEl.value.trim(), prompt = $('a2fPrompt').value.trim();
    if (!name) { nameEl.classList.add('err'); nameEl.focus(); setTimeout(function () { nameEl.classList.remove('err'); }, 500); return; }
    var sched = formSchedule();
    if (!sched) { updatePreview(); var se = $('a2fExpr') || $('a2fEveryN') || $('a2fAt'); if (se) { se.classList.add('err'); setTimeout(function () { se.classList.remove('err'); }, 500); } return; }
    var job = dialog.job, isNew = !job;
    if (!job) { job = { id: slugify(name), runs: [], enabled: true }; JOBS.push(job); }
    job.name = name; job.prompt = prompt || 'Do the thing the name says.';
    job.schedule = sched; job.schedText = null;
    job.session = form.session; job.delivery = form.delivery; job.model = form.model;
    job.timeoutMin = job.timeoutMin || 10;
    if (sched.type === 'at') job.completed = false;
    computeNext(job);
    dialog.from = null; // land on the detail for the saved job
    dialog.job = null; dialog.mode = null;
    dialogWrap.classList.remove('open');
    renderAll();
    openDetail(job);
    toast(I.check, '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 ' + (isNew ? 'created' : 'saved') + ' \u00b7 ' + (job._next ? 'next ' + C.fmtAbs(job._next) : 'not scheduled'), true);
  }
  dialogEl.addEventListener('click', function (e) {
    var x = e.target.closest('[data-x]');
    if (x) { if (x.dataset.x === 'cancel') { closeDialog(); return; } if (x.dataset.x === 'save') { saveForm(); return; } }
    var opt = e.target.closest('.a2-pick-opt');
    if (opt) {
      var p = opt.closest('.a2-pick'); form[p.dataset.pick] = opt.dataset.v;
      p.querySelectorAll('.a2-pick-opt').forEach(function (b) { b.classList.toggle('on', b === opt); });
      if (p.dataset.pick === 'type') renderSchedInputs();
      if (p.dataset.pick === 'session') updateSessHint();
      updatePreview(); return;
    }
  });
  dialogEl.addEventListener('input', function (e) {
    if (e.target.id === 'a2fExpr') { form.expr = e.target.value; updatePreview(); }
    if (e.target.id === 'a2fEveryN') { form.everyN = e.target.value; updatePreview(); }
    if (e.target.id === 'a2fAt') { form.at = e.target.value ? new Date(e.target.value).getTime() : null; updatePreview(); }
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDialog(); closeDetail(); closeCardMenus(); createWrap.classList.remove('open'); } });

  // ============ TOAST ============
  var toastTimer = null;
  function toast(icon, html, stamp) {
    var t = $('a2Toast');
    t.innerHTML = '<span class="tz-ic">' + svg(icon) + '</span><span class="tz-txt">' + html + '</span>' + (stamp ? '<span class="tz-stamp"></span>' : '');
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3800);
  }
  $('a2Toast').addEventListener('mouseenter', function () { clearTimeout(toastTimer); });
  $('a2Toast').addEventListener('mouseleave', function () { toastTimer = setTimeout(function () { $('a2Toast').classList.remove('show'); }, 1400); });

  // ============ RENDER + TICK ============
  function renderAll() { renderSections(); }
  function tick() {
    var t = now();
    JOBS.forEach(function (job) {
      if (job.running && t - job.running.t0 >= job.running.dur) { finishRun(job); return; }
      if (!job.running && job.enabled && job._next != null && job._next <= t) startRun(job, false);
    });
    sectionsEl.querySelectorAll('.a2-card').forEach(function (card) {
      var job = jobById(card.dataset.job), l2 = card.querySelector('[data-l2]');
      if (!job || !l2) return;
      if (job.running || (job.enabled && job._next != null && job._next - t < 3600000)) l2.innerHTML = cardL2(job);
    });
    if (detail.job && detail.job.running) {
      var att = detailEl.querySelector('.a2-attempt.running');
      if (att) {
        var nameEl = att.querySelector('.at-name');
        if (nameEl) nameEl.innerHTML = '<span class="live">running</span> \u00b7 ' + C.fmtMMSS(t - detail.job.running.t0);
        var logEl = att.querySelector('.a2-attempt-log');
        if (logEl) { var shown = liveLines(detail.job); logEl.innerHTML = shown.map(esc).join('\n') + (shown.length ? '\n' : '') + '<span class="cursor">\u2588</span>'; }
      }
      var badge = detailEl.querySelector('.a2-badge');
      var nf = detailEl.querySelector('.a2-fires .a2-nf .nf-rel');
      if (nf) nf.textContent = C.fmtMMSS(t - detail.job.running.t0);
    }
  }

  renderAll();
  renderSuggestions();
  setInterval(tick, 1000);

  // ============ HOST INTEGRATION / TWEAKS ============
  if (EMBEDDED) initHostEmbed(); else initTweaks();

  // Embedded in the shell: no page-local theme, no own Tweaks panel (the shell's
  // React panel drives the three surface prefs via window.__a2Tweaks). Registers
  // the host API the view-router calls.
  function initHostEmbed() {
    var main = root.closest('.main');
    var TW = { decor: 'off', density: 'cozy' };
    try { var saved = JSON.parse(localStorage.getItem('a2-tweaks') || '{}'); for (var k in saved) if (k in TW && saved[k] != null) TW[k] = saved[k]; } catch (e) {}
    function applyAll() {
      root.setAttribute('data-a2-decor', TW.decor);
      root.setAttribute('data-a2-density', TW.density);
      redrawMoons();
    }
    applyAll();
    window.__a2Tweaks = {
      get: function () { return { decor: TW.decor, density: TW.density }; },
      set: function (key, val) {
        if (!(key in TW) || TW[key] === val) return;
        TW[key] = val; applyAll();
        try { localStorage.setItem('a2-tweaks', JSON.stringify(TW)); } catch (e) {}
      }
    };
    window.__auHost = {
      enter: function () { if (main) main.classList.add('show-automations'); redrawMoons(); },
      exit: function () {
        if (main) main.classList.remove('show-automations');
        closeDialog(); closeDetail(); closeCardMenus();
        createWrap.classList.remove('open');
      }
    };
  }

  function initTweaks() {
    var THEMES = [['minimal', 'Soft'], ['daybreak', 'Daybreak'], ['atlas', 'Atlas'], ['dark', 'Umbra'], ['midnight', 'Midnight'], ['amber', 'Amber']];
    var APP = { minimal: 'light', daybreak: 'light', atlas: 'light', dark: 'dark', midnight: 'dark', amber: 'dark' };
    var TW = { theme: 'minimal', decor: 'off', density: 'cozy' };
    try { var saved = JSON.parse(localStorage.getItem('a2-tweaks') || '{}'); for (var k in saved) if (k in TW) TW[k] = saved[k]; } catch (e) {}
    try { var th = localStorage.getItem('a2-theme'); if (th && APP[th]) TW.theme = th; } catch (e) {}

    var panel = document.createElement('div');
    panel.className = 'a2-tweaks'; panel.id = 'a2Tweaks';
    panel.innerHTML =
      '<div class="a2-tw-head"><span class="dotmark">\u25d0</span><span class="t">Tweaks</span><button class="a2-tw-x" aria-label="Close tweaks">' + svg(I.close, 2) + '</button></div>' +
      '<div class="a2-tw-body">' +
        '<div class="a2-tw-sec"><span class="a2-tw-lbl">Theme</span><div class="a2-tw-seg" data-tw="theme">' + THEMES.map(function (t) { return '<button class="a2-tw-opt' + (TW.theme === t[0] ? ' on' : '') + '" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div></div>' +
        '<div class="a2-tw-sec"><span class="a2-tw-lbl">Ambient decor</span><div class="a2-tw-seg" data-tw="decor"><button class="a2-tw-opt' + (TW.decor === 'off' ? ' on' : '') + '" data-v="off">Off</button><button class="a2-tw-opt' + (TW.decor === 'on' ? ' on' : '') + '" data-v="on">Starfield</button></div></div>' +
        '<div class="a2-tw-sec"><span class="a2-tw-lbl">Density</span><div class="a2-tw-seg" data-tw="density"><button class="a2-tw-opt' + (TW.density === 'cozy' ? ' on' : '') + '" data-v="cozy">Cozy</button><button class="a2-tw-opt' + (TW.density === 'compact' ? ' on' : '') + '" data-v="compact">Compact</button></div></div>' +
      '</div>';
    document.body.appendChild(panel);

    function applyTheme() { var a = APP[TW.theme] || 'light'; var r = document.documentElement; r.setAttribute('data-theme', TW.theme); r.setAttribute('data-appearance', a); r.style.colorScheme = a; }
    function applyAll() {
      applyTheme();
      root.setAttribute('data-a2-decor', TW.decor);
      root.setAttribute('data-a2-density', TW.density);
      redrawMoons();
    }
    function persist() { try { localStorage.setItem('a2-tweaks', JSON.stringify({ decor: TW.decor, density: TW.density })); localStorage.setItem('a2-theme', TW.theme); } catch (e) {}
      try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { theme: TW.theme, decor: TW.decor, density: TW.density } }, '*'); } catch (e) {} }
    applyAll();

    panel.addEventListener('click', function (e) {
      var opt = e.target.closest('.a2-tw-opt'); if (opt) {
        var seg = opt.closest('.a2-tw-seg'), key = seg.dataset.tw;
        TW[key] = opt.dataset.v;
        seg.querySelectorAll('.a2-tw-opt').forEach(function (b) { b.classList.toggle('on', b === opt); });
        applyAll(); persist(); return;
      }
      if (e.target.closest('.a2-tw-x')) { panel.classList.remove('on'); try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (er) {} }
    });

    // drag the panel by its head
    var head = panel.querySelector('.a2-tw-head'), drag = null;
    head.addEventListener('mousedown', function (e) {
      if (e.target.closest('.a2-tw-x')) return;
      var rect = panel.getBoundingClientRect();
      drag = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
      e.preventDefault();
      function move(ev) { if (!drag) return; panel.style.left = (ev.clientX - drag.dx) + 'px'; panel.style.top = (ev.clientY - drag.dy) + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto'; }
      function up() { drag = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    });

    // host protocol
    window.addEventListener('message', function (e) {
      var ty = e.data && e.data.type;
      if (ty === '__activate_edit_mode') panel.classList.add('on');
      else if (ty === '__deactivate_edit_mode') panel.classList.remove('on');
    });
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
  }
})();
