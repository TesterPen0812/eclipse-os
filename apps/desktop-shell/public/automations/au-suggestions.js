/* ============================================================
   ECLIPSE OS — AUTOMATION SUGGESTIONS · reusable template section
   The curated automation templates as a scannable flat list in
   the page's visual language: tinted icon · name + schedule ·
   one-line description, hover-wash rows, hover-revealed "use"
   arrow. Drop-in anywhere:

     AU_SUG.render(container, {
       heading: 'Suggestions',            // optional
       onPick:  function (template) {}    // seed a create dialog
     });

   Template data lives HERE (AU_SUG.TEMPLATES) — au2.js and any
   other surface read it instead of carrying their own copy.
   Styling: automations/au-suggestions.css (global tokens only,
   so the section works on any Eclipse page). Icon tints are
   muted oklch hues via --sug-h, brighter on dark appearances.
   Requires au-cron.js (for human schedule text) loaded first.
   ============================================================ */
(function () {
  'use strict';

  /* icons — 24-box, currentColor (same drawing style as au2.js) */
  var ICONS = {
    sunrise: 'M4 17.5h16 M8.2 14.2a3.9 3.9 0 0 1 7.6 0 M12 4.6v2.8 M5.3 8.1l2 2 M18.7 8.1l-2 2',
    cal:     'M5.4 5.7h13.2a1.6 1.6 0 0 1 1.6 1.6v11a1.6 1.6 0 0 1-1.6 1.6H5.4a1.6 1.6 0 0 1-1.6-1.6v-11a1.6 1.6 0 0 1 1.6-1.6Z M3.8 9.5h16.4 M8 3.7v3.4 M16 3.7v3.4',
    chart:   'M4.2 4.6v14.8 M4.2 19.4H20 M7.6 14.6l3.3-3.7 2.7 2.3 4.7-5.5',
    bell:    'M12 4.1a5.7 5.7 0 0 1 5.7 5.7c0 3.1.9 4.6 1.7 5.5H4.6c.8-.9 1.7-2.4 1.7-5.5A5.7 5.7 0 0 1 12 4.1Z M10 18.6a2.1 2.1 0 0 0 4 0',
    rocket:  'M12 3.5c2.3 1.7 3.5 4.3 3.5 7.2 0 1.5-.3 2.9-.8 4.1H9.3a10.7 10.7 0 0 1-.8-4.1c0-2.9 1.2-5.5 3.5-7.2Z M12 8.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z M9.3 14.8 7.5 17.5h9l-1.8-2.7 M12 17.5v3',
    bug:     'M12 7.6a4.4 4.4 0 0 1 4.4 4.4v2.4a4.4 4.4 0 0 1-8.8 0V12A4.4 4.4 0 0 1 12 7.6Z M9.7 8.1 8.2 6 M14.3 8.1 15.8 6 M7.6 12H4.6 M19.4 12h-3 M8 15.8l-2.5 1.9 M16 15.8l2.5 1.9 M12 7.6V19',
    reload:  'M20 11.5a8 8 0 1 0-.7 4.4 M20 5v5h-5',
    arrow:   'M4.8 12h14.4 M13.6 6.4l5.6 5.6-5.6 5.6'
  };

  /* the curated templates — hue drives the icon tint (--sug-h) */
  var TEMPLATES = [
    { id: 'tpl-daily-brief', ic: 'sunrise', hue: 245, name: 'Daily brief', desc: 'Summarize updates and blockers each morning.', cats: ['briefs'],
      form: { name: 'Daily brief', prompt: 'Each weekday morning, summarize updates and blockers: overnight commits, CI runs, and anything new on the workboard. Post the brief to the main chat before standup.', type: 'cron', expr: '0 8 * * 1-5', session: 'isolated', delivery: 'announce', model: 'default' } },
    { id: 'tpl-weekly-review', ic: 'cal', hue: 300, name: 'Weekly review', desc: 'Compile progress, wins, and key insights.', cats: ['briefs', 'project'],
      form: { name: 'Weekly review', prompt: 'Every Friday, compile the week: progress, wins, and key insights from the workboard and merged PRs. Post the digest to the main chat.', type: 'cron', expr: '0 9 * * 5', session: 'isolated', delivery: 'announce', model: 'default' } },
    { id: 'tpl-project-monitor', ic: 'chart', hue: 155, name: 'Project monitor', desc: 'Watch for stalled tasks and overdue work.', cats: ['monitoring', 'project'],
      form: { name: 'Project monitor', prompt: 'Scan the workboard for stalled tasks and overdue work. Raise anything stuck for more than two days in the main session.', type: 'cron', expr: '0 17 * * 1-5', session: 'main', delivery: 'silent', model: 'default' } },
    { id: 'tpl-followup', ic: 'bell', hue: 70, name: 'Follow-up reminder', desc: 'Remind me to follow up on open threads.', cats: ['reminders'],
      form: { name: 'Follow-up reminder', prompt: 'Scan open threads and unanswered messages. Remind me to follow up on anything that has been waiting on me for more than a day.', type: 'cron', expr: '30 9 * * 1-5', session: 'main', delivery: 'announce', model: 'default' } },
    { id: 'tpl-release-recap', ic: 'rocket', hue: 210, name: 'Release recap', desc: 'Summarize deployment status and recent changes.', cats: ['engineering', 'briefs'],
      form: { name: 'Release recap', prompt: 'Summarize deployment status and recent changes: what shipped, what rolled back, and what to watch. Post the recap to the main chat.', type: 'cron', expr: '0 18 * * 5', session: 'isolated', delivery: 'announce', model: 'default' } },
    { id: 'tpl-bug-triage', ic: 'bug', hue: 25, name: 'Bug triage', desc: 'Collect new issues and highlight urgent ones.', cats: ['engineering', 'monitoring'],
      form: { name: 'Bug triage', prompt: 'Collect issues filed since the last run, fold duplicates together, and highlight anything urgent in the main chat.', type: 'every', everyN: 4, everyUnit: 'h', session: 'isolated', delivery: 'announce', model: 'default' } }
  ];

  function esc(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svg(d, sw) {
    var p = d.split(' M').map(function (s, i) { return '<path d="' + (i ? 'M' + s : s) + '"/>'; }).join('');
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }
  function byId(id) { for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i]; return null; }

  /* human schedule line — "Weekdays at 8:00", "Every 4 hours" */
  function schedText(t) {
    var f = t.form, C = window.AU_CRON, s;
    if (f.type === 'every') s = 'every ' + f.everyN + ' ' + (f.everyUnit === 'h' ? 'hours' : 'minutes');
    else s = (C && C.describeCron && C.describeCron(f.expr)) || 'scheduled';
    s = s.replace(/\b0(\d:)/g, '$1');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function rowHtml(t) {
    return '<button class="au-sug-row" data-sug="' + t.id + '" style="--sug-h:' + t.hue + '">' +
      '<span class="au-sug-ic">' + svg(ICONS[t.ic]) + '</span>' +
      '<span class="au-sug-main">' +
        '<span class="au-sug-l1"><span class="nm">' + esc(t.name) + '</span><span class="when">' + esc(schedText(t)) + '</span></span>' +
        '<span class="au-sug-desc">' + esc(t.desc) + '</span>' +
      '</span>' +
      '<span class="au-sug-go">' + svg(ICONS.arrow, 2) + '</span>' +
    '</button>';
  }

  function render(container, opts) {
    opts = opts || {};
    var pool = opts.templates || TEMPLATES;
    var COUNT = Math.min(opts.count || 3, pool.length);
    // start the visible window at a stable point, advance it on reload
    var offset = 0;

    function windowed() {
      var out = [];
      for (var i = 0; i < COUNT; i++) out.push(pool[(offset + i) % pool.length]);
      return out;
    }
    function paint(animate) {
      var listEl = container.querySelector('.au-sug-list');
      listEl.innerHTML = windowed().map(rowHtml).join('');
      if (animate) { listEl.classList.remove('au-sug-cycle'); void listEl.offsetWidth; listEl.classList.add('au-sug-cycle'); }
    }

    var canReload = pool.length > COUNT;
    container.innerHTML =
      '<section class="au-sug' + (opts.divider === false ? ' no-divider' : '') + '" data-screen-label="Suggestions">' +
        '<div class="au-sug-bar">' +
          '<h2 class="au-sug-head">' + esc(opts.heading || 'Suggestions') + '</h2>' +
          (canReload ? '<button class="au-sug-reload" type="button" aria-label="Refresh suggestions" title="Refresh suggestions">' + svg(ICONS.reload) + '</button>' : '') +
        '</div>' +
        '<div class="au-sug-list"></div>' +
      '</section>';
    paint(false);

    if (canReload) {
      var btn = container.querySelector('.au-sug-reload');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        offset = (offset + COUNT) % pool.length;
        btn.classList.remove('spin'); void btn.offsetWidth; btn.classList.add('spin');
        paint(true);
      });
    }

    if (opts.onPick && !container.__auSugBound) {
      container.__auSugBound = true;
      container.addEventListener('click', function (e) {
        var row = e.target.closest('.au-sug-row');
        if (!row) return;
        var t = byId(row.dataset.sug);
        if (t) opts.onPick(t);
      });
    }
  }

  window.AU_SUG = { TEMPLATES: TEMPLATES, byId: byId, schedText: schedText, render: render };
})();
