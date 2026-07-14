/* ============================================================
   ECLIPSE OS — AUTOMATIONS · MOBILE renderer (v2)
   The desktop Automations 2 module, pocket-sized. Same data
   (AU_CRON: schedule engine + JOBS + LIVE_LINES), same shapes:
   Tasks ⇄ Templates seg, Current / Paused sections, template
   cards, Dialog-Mat sheets for detail + create/edit, ink toast.
   Jobs fire on real schedules while the page is open.
   ============================================================ */
(function () {
  "use strict";
  var C = window.AU_CRON, M = window.MSHELL;
  if (!C || !M || !document.getElementById('aumApp')) return;
  var JOBS = C.JOBS;
  var svg = M.svg, esc = M.esc;
  var now = function () { return Date.now(); };
  var DAY = 86400000;
  var TZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'; } catch (e) { return 'local'; } })();

  // ---- icons (24-box, currentColor — same set as the desktop module) ----
  var I = {
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7v5l4 2',
    close: 'M6 6l12 12 M18 6 6 18',
    check: 'M5 12.5 10 17.5 19 6.5',
    chev:  'M7 9.3 12 14.2l5-4.9',
    plus:  'M12 3.8v16.4 M3.8 12h16.4',
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
    arrow: 'M4.8 12h14.4 M13.6 6.4l5.6 5.6-5.6 5.6'
  };

  // ============ TEMPLATES (same six as desktop) ============
  var TEMPLATES = [
    { id: 'tpl-daily-brief', ic: 'sunrise', name: 'Daily brief', desc: 'Summarize updates and blockers each morning.', cats: ['briefs'],
      form: { name: 'Daily brief', prompt: 'Each weekday morning, summarize updates and blockers: overnight commits, CI runs, and anything new on the workboard. Post the brief to the main chat before standup.', type: 'cron', expr: '0 8 * * 1-5', session: 'isolated', delivery: 'announce', model: 'default' } },
    { id: 'tpl-weekly-review', ic: 'cal', name: 'Weekly review', desc: 'Compile progress, wins, and key insights.', cats: ['briefs', 'project'],
      form: { name: 'Weekly review', prompt: 'Every Friday, compile the week: progress, wins, and key insights from the workboard and merged PRs. Post the digest to the main chat.', type: 'cron', expr: '0 9 * * 5', session: 'isolated', delivery: 'announce', model: 'default' } },
    { id: 'tpl-project-monitor', ic: 'chart', name: 'Project monitor', desc: 'Watch for stalled tasks and overdue work.', cats: ['monitoring', 'project'],
      form: { name: 'Project monitor', prompt: 'Scan the workboard for stalled tasks and overdue work. Raise anything stuck for more than two days in the main session.', type: 'cron', expr: '0 17 * * 1-5', session: 'main', delivery: 'silent', model: 'default' } },
    { id: 'tpl-followup', ic: 'bell', name: 'Follow-up reminder', desc: 'Remind me to follow up on open threads.', cats: ['reminders'],
      form: { name: 'Follow-up reminder', prompt: 'Scan open threads and unanswered messages. Remind me to follow up on anything that has been waiting on me for more than a day.', type: 'cron', expr: '30 9 * * 1-5', session: 'main', delivery: 'announce', model: 'default' } },
    { id: 'tpl-release-recap', ic: 'rocket', name: 'Release recap', desc: 'Summarize deployment status and recent changes.', cats: ['engineering', 'briefs'],
      form: { name: 'Release recap', prompt: 'Summarize deployment status and recent changes: what shipped, what rolled back, and what to watch. Post the recap to the main chat.', type: 'cron', expr: '0 18 * * 5', session: 'isolated', delivery: 'announce', model: 'default' } },
    { id: 'tpl-bug-triage', ic: 'bug', name: 'Bug triage', desc: 'Collect new issues and highlight urgent ones.', cats: ['engineering', 'monitoring'],
      form: { name: 'Bug triage', prompt: 'Collect issues filed since the last run, fold duplicates together, and highlight anything urgent in the main chat.', type: 'every', everyN: 4, everyUnit: 'h', session: 'isolated', delivery: 'announce', model: 'default' } }
  ];
  var FILTERS = [['all', 'All'], ['briefs', 'Briefs'], ['monitoring', 'Monitoring'], ['reminders', 'Reminders'], ['project', 'Project'], ['engineering', 'Engineering']];
  function tplById(id) { for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i]; return null; }

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

  var $ = function (id) { return document.getElementById(id); };
  var state = { tab: 'tasks', q: '', tq: '', cat: 'all' };
  var detail = { job: null };
  var dialog = { job: null, seed: null, from: null };
  var form = null;
  var toast = M.toaster($('aumToast'));
  var sheet = M.sheet({
    sheet: $('aumSheet'), scrim: $('aumScrim'),
    onClose: function () { detail.job = null; dialog.job = null; dialog.seed = null; dialog.from = null; form = null; }
  });

  // ============ STIPPLED CANVAS MOON (empty state) ============
  var CRATERS = [[-0.35, -0.25, 0.28], [0.32, 0.18, 0.22], [0.05, 0.48, 0.18], [-0.12, 0.18, 0.12], [0.42, -0.3, 0.14]];
  function hash2(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function drawMoon(canvas, size, gap, dot) {
    if (!canvas) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = canvas.height = Math.round(size * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    var light = document.documentElement.getAttribute('data-appearance') === 'light';
    ctx.fillStyle = getComputedStyle(document.getElementById('aumApp')).color;
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
        if (hash2(px, py) < dens * 0.92 + 0.04) {
          ctx.globalAlpha = 0.2 + 0.8 * Math.min(1, dens * 1.15);
          ctx.fillRect(cx + jx, cy + jy, dot, dot);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  new MutationObserver(function () { drawMoon($('aumMoonCanvas'), 118, 2, 1.1); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-appearance'] });

  // ============ HEADER SUB ============
  function renderSub() {
    var el = $('aumSub');
    var running = JOBS.filter(function (j) { return j.running; });
    if (running.length) {
      el.innerHTML = '<span class="live-dot"></span><span><b>' + esc(running[0].name.toLowerCase()) + '</b> running \u00b7 ' + C.fmtMMSS(now() - running[0].running.t0) + '</span>';
      return;
    }
    var soon = null;
    JOBS.forEach(function (j) { if (j._next != null && (soon == null || j._next < soon)) soon = j._next; });
    var active = JOBS.filter(function (j) { return j.enabled; }).length;
    el.innerHTML = JOBS.length
      ? '<span>' + active + ' armed' + (soon != null ? ' \u00b7 next <b>in ' + C.fmtCountdown(soon - now()) + '</b>' : '') + '</span>'
      : '<span>Recurring tasks, reminders and monitors</span>';
  }

  // ============ TABS ============
  var elSeg = $('aumSeg');
  elSeg.addEventListener('click', function (e) {
    var t = e.target.closest('.m-seg-tab');
    if (!t || t.dataset.tab === state.tab) return;
    state.tab = t.dataset.tab;
    elSeg.querySelectorAll('.m-seg-tab').forEach(function (b) { b.classList.toggle('on', b === t); });
    M.segThumb(elSeg, true);
    $('aumTasks').hidden = state.tab !== 'tasks';
    $('aumTemplates').hidden = state.tab !== 'templates';
  });

  // ============ TASK CARDS ============
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
  function liveLines(job) {
    if (!job.running) return [];
    var all = C.LIVE_LINES[job.id] || ['run started \u00b7 ' + job.name.toLowerCase()];
    var frac = (now() - job.running.t0) / job.running.dur;
    return all.slice(0, Math.min(all.length, Math.floor(frac * (all.length + 1))));
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
    var s = (rel == null ? 'Not scheduled' : 'Next run ' + rel) + '<span class="sep">\u00b7</span>' + esc(schedLabel(job));
    var last = job.runs[0];
    if (last && !last.ok) s += '<span class="sep">\u00b7</span><span class="warn">last run failed</span>';
    return s;
  }
  function tapeHtml(job) {
    var runs = job.runs.slice(0, 8).reverse(), s = '';
    for (var i = 0; i < 8 - runs.length; i++) s += '<span class="tk ghost"></span>';
    runs.forEach(function (r) { s += '<span class="tk' + (r.ok ? '' : ' fail') + '"></span>'; });
    return '<span class="aum-tape">' + s + '</span>';
  }
  function cardHtml(job) {
    var st = stateOf(job);
    var d1 = job.source ? esc(job.source) : (job.session === 'main' ? 'Main session' : 'Isolated');
    return '<button class="aum-card' + (st === 'paused' ? ' paused' : '') + '" data-job="' + job.id + '" data-screen-label="Automation card">' +
      '<span class="a-l1"><span class="nm">' + esc(job.name) + '</span><span class="d1">' + d1 + '</span>' + tapeHtml(job) + '</span>' +
      '<span class="a-l2" data-l2>' + cardL2(job) + '</span>' +
    '</button>';
  }
  function matches(job) {
    if (!state.q) return true;
    var hay = (job.name + ' ' + (job.source || '') + ' ' + (job.desc || '') + ' ' + job.prompt + ' ' + schedLabel(job)).toLowerCase();
    return hay.indexOf(state.q) !== -1;
  }
  function emptyHtml() {
    var MSTARS = [[168, 26, '+'], [198, 84, '\u00b7'], [16, 96, '\u00b7'], [150, 2, '.']];
    return '<div class="aum-moonwrap">' +
        '<canvas class="aum-moon" id="aumMoonCanvas" width="118" height="118" aria-hidden="true"></canvas>' +
        MSTARS.map(function (st, i) { return '<span class="aum-mstar" style="left:' + st[0] + 'px;top:' + st[1] + 'px;--tw:' + (4 + i * 1.2).toFixed(1) + 's;--td:' + (i * 0.8).toFixed(1) + 's;--pk:0.45">' + st[2] + '</span>'; }).join('') +
      '</div>' +
      '<span class="e1">Create your first automation</span>' +
      '<span class="e2">Schedule recurring tasks, reminders and monitors for your work \u2014 or start from a template.</span>' +
      '<div class="aum-tpls">' + TEMPLATES.slice(0, 4).map(function (t) { return '<button class="aum-tpl" data-tpl="' + t.id + '">' + svg(I[t.ic]) + esc(t.name) + '</button>'; }).join('') + '</div>';
  }
  function renderSections() {
    $('aumSearchWrap').style.display = JOBS.length ? '' : 'none';
    var current = [], paused = [];
    JOBS.forEach(function (j) { if (!matches(j)) return; (j.enabled || j.running ? current : paused).push(j); });
    current.sort(function (a, b) {
      var ra = a.running ? 0 : 1, rb = b.running ? 0 : 1;
      if (ra !== rb) return ra - rb;
      if (ra === 0) return a.running.t0 - b.running.t0;
      var na = a._next == null ? Infinity : a._next, nb = b._next == null ? Infinity : b._next;
      return na - nb;
    });
    var empty = $('aumEmpty'), sections = $('aumSections');
    if (JOBS.length === 0) {
      sections.innerHTML = ''; empty.className = 'aum-empty show'; empty.innerHTML = emptyHtml();
      drawMoon($('aumMoonCanvas'), 118, 2, 1.1); return;
    }
    if (!current.length && !paused.length) {
      sections.innerHTML = ''; empty.className = 'aum-empty show';
      empty.innerHTML = '<span class="e1">Nothing matches</span><span class="e2">Clear the search and try again.</span>'; return;
    }
    empty.className = 'aum-empty'; empty.innerHTML = '';
    var html = '';
    if (current.length) html += '<div class="aum-sec"><div class="m-eyebrow">Current <span class="n">' + current.length + '</span></div><div class="aum-cards">' + current.map(cardHtml).join('') + '</div></div>';
    if (paused.length) html += '<div class="aum-sec"><div class="m-eyebrow">Paused <span class="n">' + paused.length + '</span></div><div class="aum-cards">' + paused.map(cardHtml).join('') + '</div></div>';
    sections.innerHTML = html;
  }

  // ============ TEMPLATES ============
  function tplMatches(t) {
    if (state.cat !== 'all' && t.cats.indexOf(state.cat) === -1) return false;
    if (!state.tq) return true;
    return (t.name + ' ' + t.desc).toLowerCase().indexOf(state.tq) !== -1;
  }
  function renderTpls() {
    var list = TEMPLATES.filter(tplMatches);
    $('aumTplGrid').innerHTML = list.length ? list.map(function (t) {
      return '<button class="aum-tplcard" data-tpl="' + t.id + '">' +
        '<span class="tc-top"><span class="tc-ic">' + svg(I[t.ic]) + '</span><span class="tc-name">' + esc(t.name) + '</span></span>' +
        '<span class="tc-desc">' + esc(t.desc) + '</span>' +
        '<span class="tc-foot">Use template' + svg(I.arrow, 2) + '</span>' +
      '</button>';
    }).join('') : '<div class="m-none">nothing matches \u2014 clear the search or pick another filter</div>';
  }
  function renderTplFilters() {
    $('aumTplFilters').innerHTML = FILTERS.map(function (f) {
      return '<button class="m-chip' + (state.cat === f[0] ? ' on' : '') + '" data-cat="' + f[0] + '">' + f[1] + '</button>';
    }).join('');
  }
  $('aumTplFilters').addEventListener('click', function (e) {
    var f = e.target.closest('[data-cat]'); if (!f) return;
    state.cat = f.dataset.cat;
    renderTplFilters(); renderTpls();
  });
  $('aumTplSearch').addEventListener('input', function (e) { state.tq = e.target.value.trim().toLowerCase(); renderTpls(); });
  $('aumBrowse').addEventListener('click', function () { toast(svg(I.box), '<b>template library</b> \u00b7 these six cover the common patterns'); });
  $('aumSearch').addEventListener('input', function (e) { state.q = e.target.value.trim().toLowerCase(); renderSections(); });

  // card / template taps
  document.getElementById('aumApp').addEventListener('click', function (e) {
    if (sheet.el.contains(e.target)) return;
    var tpl = e.target.closest('[data-tpl]');
    if (tpl) { openDialog(null, tplById(tpl.dataset.tpl)); return; }
    var card = e.target.closest('.aum-card');
    if (card) { var j = jobById(card.dataset.job); if (j) openDetail(j); }
  });

  // ============ RUNS (same semantics as desktop) ============
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
      toast(svg(I.okc), '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 ok in ' + d + ' \u00b7 ' + extra, true);
    } else {
      toast(svg(I.xfail), '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 failed after ' + d);
    }
  }
  function togglePause(job) {
    job.enabled = !job.enabled;
    if (job.enabled) job.completed = false;
    computeNext(job);
    renderAll();
    if (detail.job === job) renderDetail(job);
    toast(svg(job.enabled ? I.play : I.pause), '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 ' + (job.enabled ? 'resumed \u00b7 next ' + (job._next ? C.fmtAbs(job._next) : '\u2014') : 'paused'));
  }
  function deleteJob(job) {
    JOBS.splice(JOBS.indexOf(job), 1);
    sheet.close();
    renderAll();
    toast(svg(I.trash), '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 deleted');
  }

  // ============ DETAIL — Dialog Mat sheet ============
  function schedInstrument(job) {
    var s = job.schedule, inner = '<div class="a-expr">' + esc(C.exprText(s)) + '</div>';
    if (s.type === 'cron') {
      var f = String(s.expr).trim().split(/\s+/), labels = ['min', 'hour', 'day', 'mon', 'dow'];
      inner += '<div class="aum-fields">' + f.map(function (v, i) { return '<div class="aum-fcell"><span class="fv">' + esc(v) + '</span><span class="fl">' + labels[i] + '</span></div>'; }).join('') + '</div>';
    }
    var human = s.type === 'cron' ? (C.describeCron(s.expr) || 'cron schedule') : s.type === 'every' ? C.fmtEvery(s.ms) + ' \u00b7 anchored ' + C.fmtClock(s.anchor) : 'runs once, then retires';
    inner += '<div class="a-human">' + svg(I.cal) + '<span>' + esc(human) + '</span><span class="tz">' + esc(TZ) + '</span></div>';
    return '<div class="m-well aum-sched">' + inner + '</div>';
  }
  function nextFiresHtml(job) {
    if (job.running) return '<div class="aum-nf"><span class="nf-tick" style="background:var(--au-alive)"></span><span class="nf-abs" style="color:var(--au-alive)">running now</span><span class="nf-rel" data-nf-rel>' + C.fmtMMSS(now() - job.running.t0) + '</span></div>';
    if (!job.enabled) return '<div class="aum-nf none">' + (job.completed ? 'completed \u00b7 one-shot already ran' : 'paused \u00b7 won\u2019t fire until resumed') + '</div>';
    var fires = C.firesBetween(job.schedule, now(), now() + 45 * DAY, 3);
    if (!fires.length) return '<div class="aum-nf none">no upcoming fires</div>';
    return fires.map(function (ts) { return '<div class="aum-nf"><span class="nf-tick"></span><span class="nf-abs">' + esc(C.fmtAbs(ts)) + '</span><span class="nf-rel">in ' + C.fmtCountdown(ts - now()) + '</span></div>'; }).join('');
  }
  function attemptsHtml(job) {
    var out = '';
    if (job.running) {
      var shown = liveLines(job);
      out += '<div class="aum-att running"><div class="aum-att-head">' + svg(I.cycle) +
        '<div class="at-main"><span class="at-name"><span class="live">running</span> \u00b7 <span data-run-mmss>' + C.fmtMMSS(now() - job.running.t0) + '</span></span>' +
        '<span class="at-sub">started ' + C.fmtClock(job.running.t0, true) + (job.running.manual ? ' \u00b7 manual' : ' \u00b7 scheduled') + '</span></div>' +
        '</div><div class="aum-att-log" data-run-log>' + shown.map(esc).join('\n') + (shown.length ? '\n' : '') + '<span class="cursor">\u2588</span></div></div>';
    }
    if (!job.runs.length && !job.running) return '<div class="aum-hist-empty">no runs yet \u2014 fires for the first time ' + (job._next ? C.fmtAbs(job._next) : 'when resumed') + '</div>';
    out += job.runs.slice(0, 6).map(function (r, i) {
      var hasLog = r.lines && r.lines.length;
      return '<div class="aum-att' + (r.ok ? '' : ' failed') + '">' +
        '<div class="aum-att-head" data-att="' + i + '"' + (hasLog ? '' : ' style="cursor:default"') + '>' + svg(r.ok ? I.okc : I.xfail) +
        '<div class="at-main"><span class="at-name">' + (r.ok ? 'ok in ' : 'failed after ') + C.fmtDur(r.dur) + '</span>' +
        '<span class="at-sub">' + C.fmtAbs(r.ts, true) + ' \u00b7 ' + C.fmtAgo(now() - r.ts) + '</span></div>' +
        (hasLog ? '<span class="at-chev">' + svg(I.chev, 2) + '</span>' : '') + '</div>' +
        (hasLog ? '<div class="aum-att-log">' + r.lines.map(esc).join('\n') + '</div>' : '') +
      '</div>';
    }).join('');
    return out;
  }
  function openDetail(job) { detail.job = job; dialog.job = null; renderDetail(job); }
  function renderDetail(job) {
    if (detail.job !== job || !sheet.isOpen()) { /* first open or refresh */ }
    var st = stateOf(job);
    var stName = { running: 'running', paused: job.completed ? 'completed' : 'paused', failing: 'failing', active: 'active' }[st];
    var html =
      '<div class="m-frame-lbl">Automation</div>' +
      '<div class="m-sheet-scroll"><div class="m-panel">' +
        '<div class="m-panel-head"><span class="m-jid">cron:' + esc(job.id) + '</span><span class="spring"></span>' +
          '<span class="m-badge" data-state="' + st + '"><span class="b-dot"></span>' + stName + '</span></div>' +
        '<div class="m-panel-title">' + esc(job.name) + '</div>' +
        '<div class="m-panel-desc">' + esc(job.prompt) + '</div>' +
        '<div class="m-sec"><div class="m-eyebrow">Schedule</div>' + schedInstrument(job) + '<div class="aum-fires">' + nextFiresHtml(job) + '</div></div>' +
        '<div class="m-sec"><div class="m-eyebrow">Run config</div><div class="m-kvs">' +
          '<div class="m-kv">' + svg(job.session === 'main' ? I.term : I.box) + '<span class="rk">session</span><span class="rv">' + (job.session === 'main' ? 'main \u00b7 system event' : 'isolated \u00b7 <span class="mono">cron:' + esc(job.id) + '</span>') + '</span></div>' +
          '<div class="m-kv">' + svg(I.zap) + '<span class="rk">model</span><span class="rv">' + esc(job.model) + (job.model === 'default' ? ' <span class="dim">\u00b7 follows the app</span>' : '') + '</span></div>' +
          '<div class="m-kv">' + svg(I.send) + '<span class="rk">delivery</span><span class="rv">' + (job.delivery === 'announce' ? 'announce \u00b7 summary to chat' : 'silent \u00b7 log only') + '</span></div>' +
          '<div class="m-kv">' + svg(I.clock) + '<span class="rk">timeout</span><span class="rv">' + (job.timeoutMin || 10) + ' min</span></div>' +
        '</div></div>' +
        '<div class="m-sec"><div class="m-eyebrow">History <span class="n">' + job.runs.length + '</span></div><div class="aum-atts">' + attemptsHtml(job) + '</div></div>' +
      '</div></div>' +
      '<div class="m-acts">' +
        '<button class="m-act go" data-x="run"' + (job.running ? ' disabled' : '') + '>' + svg(I.play) + 'Run now</button>' +
        '<button class="m-act" data-x="toggle">' + svg(job.enabled ? I.pause : I.play, job.enabled ? 2 : 1.7) + (job.enabled ? 'Pause' : 'Resume') + '</button>' +
        '<button class="m-act" data-x="edit">' + svg(I.pencil) + 'Edit</button>' +
        '<button class="m-act danger" data-x="delete">' + svg(I.trash) + '</button>' +
      '</div>';
    sheet.open(html);
    detail.job = job;
    sheet.el.onclick = function (e) {
      var x = e.target.closest('[data-x]');
      if (x) {
        switch (x.dataset.x) {
          case 'run': if (!job.running) startRun(job, true); return;
          case 'toggle': togglePause(job); return;
          case 'edit': openDialog(job, null, true); return;
          case 'delete': deleteJob(job); return;
        }
        return;
      }
      var head = e.target.closest('.aum-att-head');
      if (head) { var att = head.closest('.aum-att'); if (att && !att.classList.contains('running') && att.querySelector('.aum-att-log')) att.classList.toggle('expanded'); }
    };
  }

  // ============ DIALOG MAT — create / edit (stacked form, §6) ============
  function openDialog(job, seed, fromDetail) {
    dialog.job = job; dialog.seed = seed; dialog.from = fromDetail ? job : null;
    detail.job = null;
    form = job ? {
      name: job.name, prompt: job.prompt, type: job.schedule.type,
      expr: job.schedule.type === 'cron' ? job.schedule.expr : '0 9 * * 1-5',
      everyN: job.schedule.type === 'every' ? Math.max(1, Math.round(job.schedule.ms / ((job.schedule.ms % 3600000 === 0) ? 3600000 : 60000))) : 30,
      everyUnit: (job.schedule.type === 'every' && job.schedule.ms % 3600000 === 0) ? 'h' : 'm',
      at: job.schedule.type === 'at' ? job.schedule.ts : now() + 3600000,
      session: job.session, delivery: job.delivery, model: job.model
    } : { name: '', prompt: '', type: 'cron', expr: '0 9 * * 1-5', everyN: 30, everyUnit: 'm', at: now() + 3600000, session: 'isolated', delivery: 'announce', model: 'default' };
    if (!job && seed && seed.form) { for (var k in seed.form) form[k] = seed.form[k]; }
    var frameLbl = job ? 'Edit automation' : (seed ? 'Template \u00b7 ' + seed.name.toLowerCase() : 'New automation');

    function pick(name, opts) {
      return '<div class="m-pick" data-pick="' + name + '">' + opts.map(function (o) {
        return '<button class="m-pick-opt' + (form[name] === o.v ? ' on' : '') + '" data-v="' + o.v + '">' + (o.ic ? svg(o.ic) : '') + esc(o.l) + '</button>';
      }).join('') + '</div>';
    }
    sheet.open(
      '<div class="m-frame-lbl">' + esc(frameLbl) + '</div>' +
      '<div class="m-sheet-scroll"><div class="m-panel">' +
        '<div class="m-field"><span class="m-flabel">Name</span><input class="m-input" id="amName" type="text" placeholder="What should the agent do, in a few words" value="' + esc(form.name) + '"></div>' +
        '<div class="m-field"><span class="m-flabel">Prompt</span><textarea class="m-input m-ta" id="amPrompt" placeholder="The instruction the agent runs with. Be specific about where results go.">' + esc(form.prompt) + '</textarea></div>' +
        '<div class="m-field"><span class="m-flabel">Schedule</span>' + pick('type', [{ v: 'cron', l: 'cron' }, { v: 'every', l: 'interval' }, { v: 'at', l: 'once' }]) + '<div id="amSched"></div><div class="m-preview" id="amPreview"></div></div>' +
        '<div class="m-field"><span class="m-flabel">Session</span>' + pick('session', [{ v: 'isolated', l: 'isolated', ic: I.box }, { v: 'main', l: 'main session', ic: I.term }]) + '<div class="m-hint" id="amSessHint"></div></div>' +
        '<div class="m-field"><span class="m-flabel">Delivery</span>' + pick('delivery', [{ v: 'announce', l: 'announce to chat', ic: I.send }, { v: 'silent', l: 'silent' }]) + '</div>' +
        '<div class="m-field"><span class="m-flabel">Model</span>' + pick('model', [{ v: 'default', l: 'default' }, { v: 'opus', l: 'opus' }, { v: 'sonnet', l: 'sonnet' }]) + '</div>' +
      '</div></div>' +
      '<div class="m-acts">' +
        '<button class="m-act quiet" data-x="cancel">Cancel</button>' +
        '<button class="m-act go" data-x="save">' + svg(I.check, 2) + (job ? 'Save changes' : 'Create automation') + '</button>' +
      '</div>'
    );
    renderSchedInputs(); updateSessHint(); updatePreview();
    if (!job && !seed) setTimeout(function () { var el = $('amName'); if (el) el.focus(); }, 380);

    sheet.el.onclick = function (e) {
      var x = e.target.closest('[data-x]');
      if (x) {
        if (x.dataset.x === 'cancel') { var back = dialog.from; sheet.close(); if (back && jobById(back.id)) openDetail(back); return; }
        if (x.dataset.x === 'save') { saveForm(); return; }
      }
      var opt = e.target.closest('.m-pick-opt');
      if (opt) {
        var p = opt.closest('.m-pick'); form[p.dataset.pick] = opt.dataset.v;
        p.querySelectorAll('.m-pick-opt').forEach(function (b) { b.classList.toggle('on', b === opt); });
        if (p.dataset.pick === 'type') renderSchedInputs();
        if (p.dataset.pick === 'session') updateSessHint();
        updatePreview();
      }
    };
    sheet.el.oninput = function (e) {
      if (!form) return;
      if (e.target.id === 'amName') form.name = e.target.value;
      if (e.target.id === 'amPrompt') form.prompt = e.target.value;
      if (e.target.id === 'amExpr') { form.expr = e.target.value; updatePreview(); }
      if (e.target.id === 'amEveryN') { form.everyN = e.target.value; updatePreview(); }
      if (e.target.id === 'amAt') { form.at = e.target.value ? new Date(e.target.value).getTime() : null; updatePreview(); }
    };
  }
  function renderSchedInputs() {
    var el = $('amSched'); if (!el) return;
    if (form.type === 'cron') {
      el.innerHTML = '<div class="m-sched-inputs"><input class="m-input mono" id="amExpr" type="text" spellcheck="false" value="' + esc(form.expr) + '" placeholder="0 9 * * 1-5"></div>';
    } else if (form.type === 'every') {
      el.innerHTML = '<div class="m-sched-inputs"><input class="m-input num" id="amEveryN" type="number" min="1" max="999" value="' + form.everyN + '"><div class="m-pick" data-pick="everyUnit" style="flex:1"><button class="m-pick-opt' + (form.everyUnit === 'm' ? ' on' : '') + '" data-v="m">minutes</button><button class="m-pick-opt' + (form.everyUnit === 'h' ? ' on' : '') + '" data-v="h">hours</button></div></div>';
    } else {
      var d = new Date(form.at || (now() + 3600000));
      var val = d.getFullYear() + '-' + C.pad2(d.getMonth() + 1) + '-' + C.pad2(d.getDate()) + 'T' + C.pad2(d.getHours()) + ':' + C.pad2(d.getMinutes());
      el.innerHTML = '<div class="m-sched-inputs"><input class="m-input mono" id="amAt" type="datetime-local" value="' + val + '"></div>';
    }
  }
  function formSchedule() {
    if (form.type === 'cron') return C.parseCron(form.expr) ? { type: 'cron', expr: String(form.expr).trim().replace(/\s+/g, ' ') } : null;
    if (form.type === 'every') { var n = parseInt(form.everyN, 10); if (!(n >= 1)) return null; return { type: 'every', ms: n * (form.everyUnit === 'h' ? 3600000 : 60000), anchor: now() }; }
    var ts = form.at; return (ts && ts > now()) ? { type: 'at', ts: ts } : null;
  }
  function updatePreview() {
    var pv = $('amPreview'); if (!pv) return;
    var sched = formSchedule();
    if (!sched) {
      var msg = form.type === 'cron' ? 'invalid expression \u00b7 5 fields: min hour day month weekday' : form.type === 'every' ? 'interval must be at least 1' : 'pick a time in the future';
      pv.className = 'm-preview invalid';
      pv.innerHTML = '<div class="pv-line"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="bad"><path d="M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Z"></path><path d="M9 9l6 6"></path><path d="M15 9l-6 6"></path></svg><span class="pv-ok">' + esc(msg) + '</span></div>';
      return;
    }
    pv.className = 'm-preview';
    var human = sched.type === 'cron' ? (C.describeCron(sched.expr) || 'cron \u00b7 ' + sched.expr) : sched.type === 'every' ? C.fmtEvery(sched.ms) : 'once \u00b7 ' + C.fmtAbs(sched.ts, true);
    var fires = C.firesBetween(sched, now(), now() + 45 * DAY, 3);
    pv.innerHTML = '<div class="pv-line">' + svg(I.check, 2) + '<span class="pv-ok">' + esc(human) + '</span></div>' + (fires.length ? '<div class="pv-fires">next: ' + fires.map(function (t) { return esc(C.fmtAbs(t)); }).join(' \u00b7 ') + '</div>' : '');
  }
  function updateSessHint() {
    var el = $('amSessHint'); if (!el) return;
    el.textContent = form.session === 'main' ? 'the prompt lands in your main chat as a system event \u2014 the agent replies there' : 'runs in its own session (cron:\u2026) so it never interrupts your chat';
  }
  function slugify(name) {
    var base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'automation';
    var id = base, i = 2; while (jobById(id)) id = base + '-' + (i++); return id;
  }
  function saveForm() {
    var nameEl = $('amName'), name = nameEl.value.trim(), prompt = $('amPrompt').value.trim();
    if (!name) { nameEl.classList.add('err'); nameEl.focus(); setTimeout(function () { nameEl.classList.remove('err'); }, 500); return; }
    var sched = formSchedule();
    if (!sched) { updatePreview(); var se = $('amExpr') || $('amEveryN') || $('amAt'); if (se) { se.classList.add('err'); setTimeout(function () { se.classList.remove('err'); }, 500); } return; }
    var job = dialog.job, isNew = !job;
    if (!job) { job = { id: slugify(name), runs: [], enabled: true }; JOBS.push(job); }
    job.name = name; job.prompt = prompt || 'Do the thing the name says.';
    job.schedule = sched; job.schedText = null;
    job.session = form.session; job.delivery = form.delivery; job.model = form.model;
    job.timeoutMin = job.timeoutMin || 10;
    if (sched.type === 'at') job.completed = false;
    job.enabled = true;
    computeNext(job);
    renderAll();
    openDetail(job);
    toast(svg(I.check, 2), '<b>' + esc(job.name.toLowerCase()) + '</b> \u00b7 ' + (isNew ? 'created' : 'saved') + ' \u00b7 ' + (job._next ? 'next ' + C.fmtAbs(job._next) : 'not scheduled'), true);
  }

  // ============ CREATE MENU (FAB) ============
  $('aumFab').innerHTML = svg(I.plus, 2);
  $('aumFab').addEventListener('click', function () {
    sheet.open(
      '<div class="m-frame-lbl">Create automation</div>' +
      '<div class="m-sheet-scroll"><div class="m-panel" style="padding:7px"><div class="m-rows" style="padding:0">' +
        '<button class="m-row" data-new="chat">' + svg(I.pencil) + '<span class="r-main"><span class="r-title">Describe it in chat</span><span class="r-sub">write the prompt \u2014 the agent wires the schedule</span></span></button>' +
        '<button class="m-row" data-new="manual">' + svg(I.slider) + '<span class="r-main"><span class="r-title">Configure manually</span><span class="r-sub">name, prompt, schedule, session</span></span></button>' +
        '<button class="m-row" data-new="tpl">' + svg(I.box) + '<span class="r-main"><span class="r-title">Start from a template</span><span class="r-sub">briefs, monitors, reminders</span></span></button>' +
      '</div></div></div>'
    );
    sheet.el.onclick = function (e) {
      var it = e.target.closest('[data-new]'); if (!it) return;
      sheet.el.onclick = null;
      if (it.dataset.new === 'tpl') {
        sheet.close();
        state.tab = 'templates';
        elSeg.querySelectorAll('.m-seg-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === 'templates'); });
        M.segThumb(elSeg, true);
        $('aumTasks').hidden = true; $('aumTemplates').hidden = false;
        return;
      }
      openDialog(null, null);
      if (it.dataset.new === 'chat') setTimeout(function () { var el = $('amPrompt'); if (el) el.focus(); }, 380);
    };
  });

  // ============ RENDER + TICK ============
  function renderAll() { renderSub(); renderSections(); }
  function tick() {
    var t = now();
    JOBS.forEach(function (job) {
      if (job.running && t - job.running.t0 >= job.running.dur) { finishRun(job); return; }
      if (!job.running && job.enabled && job._next != null && job._next <= t) startRun(job, false);
    });
    renderSub();
    // per-card live line / countdown refresh
    document.querySelectorAll('.aum-card').forEach(function (card) {
      var job = jobById(card.dataset.job), l2 = card.querySelector('[data-l2]');
      if (!job || !l2) return;
      if (job.running || (job.enabled && job._next != null && job._next - t < 3600000)) l2.innerHTML = cardL2(job);
    });
    // live detail sheet
    if (detail.job && detail.job.running && sheet.isOpen()) {
      var mm = sheet.el.querySelector('[data-run-mmss]');
      if (mm) mm.textContent = C.fmtMMSS(t - detail.job.running.t0);
      var log = sheet.el.querySelector('[data-run-log]');
      if (log) { var shown = liveLines(detail.job); log.innerHTML = shown.map(esc).join('\n') + (shown.length ? '\n' : '') + '<span class="cursor">\u2588</span>'; }
      var rel = sheet.el.querySelector('[data-nf-rel]');
      if (rel) rel.textContent = C.fmtMMSS(t - detail.job.running.t0);
    }
  }

  renderAll();
  renderTplFilters();
  renderTpls();
  M.segThumb(elSeg, false);
  window.addEventListener('resize', function () { M.segThumb(elSeg, false); });
  setInterval(tick, 1000);
})();
