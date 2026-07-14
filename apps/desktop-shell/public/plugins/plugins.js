/* ============================================================
   ECLIPSE OS — PLUGINS  (vanilla, data-driven)
   Connectors, skills and tools that extend the agent. A calm
   centered column: Board Mats holding a white ROWS panel
   (default) or flat Mat cards (Tweak). Opening one HERO-EXPANDS
   a centered detail panel — or docks a SIDE PANEL via Tweak.
   Browse tab = the registry. No install flow: installing is a
   one-click toast. Mirrors the Automations 2 module contract.
   ============================================================ */
(function () {
  "use strict";
  var root = document.getElementById('pgRoot');

  // ---- icons (24-box, currentColor, guide recipe) ----
  var I = {
    close: 'M6 6l12 12 M18 6 6 18',
    check: 'M5 12.5 10 17.5 19 6.5',
    chev:  'M7 9.3 12 14.2l5-4.9',
    search:'M10.6 4.4a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Z M15.4 15.4 20 20',
    dots:  'M5.7 12h.01 M12 12h.01 M18.3 12h.01',
    arrow: 'M4.8 12h14.4 M13.6 6.4l5.6 5.6-5.6 5.6',
    plug:  'M9 3.4v4.1 M15 3.4v4.1 M7 7.5h10v3.9a5 5 0 0 1-10 0V7.5Z M12 16.4v4.2',
    slider:'M4 7.5h9 M17 7.5h3 M15 5.4v4.2 M4 16.5h3 M11 16.5h9 M9 14.4v4.2',
    term:  'M3.6 5h16.8a1.6 1.6 0 0 1 1.6 1.6v10.8a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 17.4V6.6A1.6 1.6 0 0 1 3.6 5Z M6.5 9.3l3 2.7-3 2.7 M12.5 14.7h4.5',
    cycle: 'M4.6 12a7.4 7.4 0 0 1 12.6-5.2L20 9 M20 4.6V9h-4.5 M19.4 12a7.4 7.4 0 0 1-12.6 5.2L4 15 M4 19.4V15h4.5',
    power: 'M12 3.6v7.2 M7.3 6.3a6.9 6.9 0 1 0 9.4 0',
    trash: 'M4.5 6.5h15 M9.6 6.5V5.1a1.5 1.5 0 0 1 1.5-1.5h1.8a1.5 1.5 0 0 1 1.5 1.5v1.4 M6.4 6.5l.8 12a2 2 0 0 0 2 1.9h5.6a2 2 0 0 0 2-1.9l.8-12 M10 10.6v5.6 M14 10.6v5.6',
    okc:   'M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Z M8.4 12.4l2.5 2.5 4.7-5.3',
    // plugin marks — generic line-art, never brand logos
    branch:'M7 4.1a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Z M7 16.1a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Z M17 6.1a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Z M7 7.9v8.2 M17 10c0 4.2-10 2.4-10 6.1',
    db:    'M12 3.8c4.4 0 8 1.4 8 3.1s-3.6 3.1-8 3.1-8-1.4-8-3.1 3.6-3.1 8-3.1Z M4 6.9v10.2c0 1.7 3.6 3.1 8 3.1s8-1.4 8-3.1V6.9 M4 12c0 1.7 3.6 3.1 8 3.1s8-1.4 8-3.1',
    shieldpulse: 'M12 3.6 19 6.3v5c0 4.5-2.9 7.7-7 9.1-4.1-1.4-7-4.6-7-9.1v-5L12 3.6Z M8.3 12.2h1.9l1.1-2.6 1.6 4.6 1.2-2h1.6',
    shieldcheck: 'M12 3.6 19 6.3v5c0 4.5-2.9 7.7-7 9.1-4.1-1.4-7-4.6-7-9.1v-5L12 3.6Z M8.8 11.9l2.2 2.2 4.2-4.8',
    bubble:'M12 4.6c4.6 0 8.3 2.9 8.3 6.6s-3.7 6.6-8.3 6.6c-.9 0-1.7-.1-2.5-.3L5.2 19.4l1-3.1c-1.6-1.2-2.5-2.9-2.5-5.1 0-3.7 3.7-6.6 8.3-6.6Z',
    issues:'M9.5 6.3H20 M9.5 12H20 M9.5 17.7h6 M4 6.3h.01 M4 12h.01 M4 17.7h.01',
    frames:'M4.6 4.6h14.8v14.8H4.6Z M9.4 4.6v14.8 M9.4 10.6h10',
    doc:   'M6.4 3.8h8.2l3 3v13.4H6.4Z M14.2 3.8v3.4h3.4 M9.2 11.2h5.6 M9.2 14.6h5.6',
    rocket:'M12 3.5c2.3 1.7 3.5 4.3 3.5 7.2 0 1.5-.3 2.9-.8 4.1H9.3a10.7 10.7 0 0 1-.8-4.1c0-2.9 1.2-5.5 3.5-7.2Z M12 8.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z M9.3 14.8 7.5 17.5h9l-1.8-2.7 M12 17.5v3',
    chart: 'M4.2 4.6v14.8 M4.2 19.4H20 M7.6 14.6l3.3-3.7 2.7 2.3 4.7-5.5',
    chip:  'M8 8.4h8v7.2H8Z M10.4 4.6v3.8 M13.6 4.6v3.8 M10.4 15.6v3.8 M13.6 15.6v3.8 M4.6 10.4h3.4 M4.6 13.6h3.4 M16 10.4h3.4 M16 13.6h3.4',
    magcheck: 'M10.8 4.4a6.4 6.4 0 1 0 0 12.8 6.4 6.4 0 0 0 0-12.8Z M8.2 10.9l1.9 1.9 3.4-4 M15.7 15.7 20 20',
    dbarrow: 'M10.5 3.9c3.6 0 6.5 1.2 6.5 2.7s-2.9 2.7-6.5 2.7S4 8.1 4 6.6s2.9-2.7 6.5-2.7Z M4 6.6v10.8c0 1.5 2.9 2.7 6.5 2.7 1 0 2-.1 2.8-.3 M17 6.6v4.4 M13.6 16.4h6.8 M17.6 13.6l2.8 2.8-2.8 2.8',
    film:  'M4.4 5h15.2v14H4.4Z M4.4 9h15.2 M4.4 15h15.2 M8.4 5v4 M15.6 5v4 M8.4 15v4 M15.6 15v4',
    browser:'M3.8 5.2h16.4a1.5 1.5 0 0 1 1.5 1.5v10.6a1.5 1.5 0 0 1-1.5 1.5H3.8a1.5 1.5 0 0 1-1.5-1.5V6.7a1.5 1.5 0 0 1 1.5-1.5Z M2.3 9.2h19.4 M5.3 7.2h.01 M7.6 7.2h.01',
    cube:  'M12 3.6 20 8v8l-8 4.4L4 16V8l8-4.4Z M4 8l8 4.4L20 8 M12 12.4v8',
    cal:   'M5.4 5.7h13.2a1.6 1.6 0 0 1 1.6 1.6v11a1.6 1.6 0 0 1-1.6 1.6H5.4a1.6 1.6 0 0 1-1.6-1.6v-11a1.6 1.6 0 0 1 1.6-1.6Z M3.8 9.5h16.4 M8 3.7v3.4 M16 3.7v3.4',
    card:  'M3.8 5.8h16.4a1.5 1.5 0 0 1 1.5 1.5v9.4a1.5 1.5 0 0 1-1.5 1.5H3.8a1.5 1.5 0 0 1-1.5-1.5V7.3a1.5 1.5 0 0 1 1.5-1.5Z M2.3 9.6h19.4 M5.8 14.4h4'
  };

  function svg(d, sw) {
    var p = d.split(' M').map(function (s, i) { return '<path d="' + (i ? 'M' + s : s) + '"/>'; }).join('');
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }
  function esc(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ============ DATA ============
  var KINDS = [['connector', 'Connectors'], ['skill', 'Skills'], ['tool', 'Tools']];
  var KIND_LABEL = { connector: 'Connector', skill: 'Skill', tool: 'Tool' };

  var INSTALLED = [
    { id: 'github', name: 'GitHub', ver: '2.4.1', kind: 'connector', ic: 'branch', hue: 210, feat: true,
      desc: 'Repos, issues and pull requests — read, review and ship without leaving the chat.',
      line: 'dana-eclipse \u00b7 14 tools', inUse: 'main session \u2014 gh pr view 412',
      perms: ['Read and clone repositories', 'Create branches and open PRs', 'Read and comment on issues', 'Trigger workflow runs'],
      config: [['Account', 'dana-eclipse'], ['Scope', 'eclipse/shared-brain +2 repos'], ['Tools exposed', '14']],
      log: [['16:41', 'gh pr view 412 \u00b7 ok \u00b7 240ms'], ['16:38', 'git push origin fix/hooks \u00b7 ok'], ['15:02', 'issues sync \u00b7 3 new']] },
    { id: 'postgres', name: 'Postgres', ver: '1.9.0', kind: 'connector', ic: 'db', hue: 245, feat: true,
      desc: 'Query and inspect Postgres databases with guarded, read-first access.',
      line: 'db.internal:5432 \u00b7 9 tools \u00b7 used 3h ago',
      perms: ['Run read-only SQL', 'Inspect schemas and indexes', 'Run EXPLAIN plans', 'Write with per-query approval'],
      config: [['Host', 'db.internal:5432'], ['Database', 'shared_brain'], ['Mode', 'read-first']],
      log: [['13:12', 'SELECT count(*) FROM runs \u00b7 ok \u00b7 18ms'], ['13:11', 'schema introspect \u00b7 41 tables'], ['09:04', 'connection check \u00b7 ok']] },
    { id: 'sentry', name: 'Sentry', ver: '3.1.2', kind: 'connector', ic: 'shieldpulse', hue: 300, update: '3.2.0',
      desc: 'Errors and performance regressions, triaged into the conversation.',
      line: 'project eclipse-os \u00b7 used 1d ago',
      perms: ['Read issues and events', 'Read releases and source maps', 'Resolve and assign issues'],
      config: [['Project', 'eclipse-os'], ['Alerts', 'new regressions only']],
      log: [['yesterday', 'issue sweep \u00b7 2 new, 1 regressed'], ['yesterday', 'ECLIPSE-291 assigned to agent'], ['2d', 'release 0.42 mapped']] },
    { id: 'linear', name: 'Linear', ver: '2.0.4', kind: 'connector', ic: 'issues', hue: 265, error: 'token expired \u2014 reconnect to resume sync',
      desc: 'Issues and cycles, kept in sync with the workboard.',
      line: 'workspace eclipse \u00b7 cycle 14',
      perms: ['Read issues and cycles', 'Create and update issues'],
      config: [['Workspace', 'eclipse'], ['Sync', 'workboard \u21c4 cycle 14']],
      log: [['14:20', 'sync failed \u00b7 401 unauthorized', 'bad'], ['14:20', 'token refresh failed', 'bad'], ['09:12', 'sync ok \u00b7 12 issues']] },
    { id: 'slack', name: 'Slack', ver: '1.7.3', kind: 'connector', ic: 'bubble', hue: 155, off: true,
      desc: 'Post updates and read threads from the team workspace.',
      line: '#eng-eclipse',
      perms: ['Read channel messages', 'Post as Eclipse'],
      config: [['Workspace', 'eclipse-hq'], ['Channel', '#eng-eclipse']],
      log: [['3d', 'disabled by dana'], ['4d', 'standup summary posted']] },
    { id: 'code-review', name: 'Code review', ver: '0.9.2', kind: 'skill', ic: 'magcheck', hue: 25, feat: true,
      desc: 'Reviews every PR: correctness, style drift and risky diffs, commented in place.',
      line: 'runs on every PR \u00b7 used 2h ago',
      perms: ['Read diffs on open PRs', 'Comment review notes'],
      config: [['Trigger', 'on PR open + push'], ['Depth', 'full \u2014 tests included']],
      log: [['14:56', 'reviewed #412 \u00b7 2 notes'], ['11:20', 'reviewed #409 \u00b7 clean'], ['1d', 'reviewed #408 \u00b7 1 risky diff']] },
    { id: 'release-notes', name: 'Release notes', ver: '1.1.0', kind: 'skill', ic: 'doc', hue: 70, off: true,
      desc: 'Drafts release notes from merged PRs and commit history when a tag lands.',
      line: 'triggered by release tags',
      perms: ['Read merged PRs and tags', 'Draft notes into chat'],
      config: [['Trigger', 'tag v*'], ['Tone', 'terse changelog']],
      log: [['1w', 'drafted notes for v0.41']] },
    { id: 'playwright', name: 'Playwright', ver: '1.44.0', kind: 'tool', ic: 'browser', hue: 130, feat: true,
      desc: 'Drives a headless browser: navigate, click, screenshot and assert.',
      line: 'headless chromium \u00b7 6 tools \u00b7 used 40m ago',
      perms: ['Launch headless browsers', 'Read page content and screenshots'],
      config: [['Browser', 'chromium \u00b7 headless'], ['Timeout', '30s']],
      log: [['16:12', 'screenshot /settings \u00b7 ok'], ['16:11', 'goto localhost:3000 \u00b7 ok'], ['15:58', 'assert nav visible \u00b7 pass']] },
    { id: 'docker', name: 'Docker', ver: '4.2.1', kind: 'tool', ic: 'cube', hue: 190,
      desc: 'Build images and manage containers on connected machines.',
      line: '3 containers running \u00b7 used 5h ago',
      perms: ['Build and tag images', 'Start and stop containers', 'Read container logs'],
      config: [['Socket', '/var/run/docker.sock'], ['Machine', 'macbook-air-eclipse']],
      log: [['11:40', 'compose up shared-brain \u00b7 ok'], ['11:39', 'build \u00b7 42s \u00b7 cached 9/12'], ['1d', 'prune \u00b7 reclaimed 1.2GB']] }
  ];

  var CATALOG = [
    { id: 'figma', name: 'Figma', ver: '1.3.0', kind: 'connector', ic: 'frames', hue: 300, installs: '18k', desc: 'Read frames, components and tokens from design files.' },
    { id: 'notion', name: 'Notion', ver: '2.1.5', kind: 'connector', ic: 'doc', hue: 70, installs: '24k', desc: 'Search and read pages from the team workspace.' },
    { id: 'vercel', name: 'Vercel', ver: '3.0.2', kind: 'connector', ic: 'rocket', hue: 210, installs: '21k', desc: 'Deployments, previews and build logs.' },
    { id: 'gcal', name: 'Calendar', ver: '1.0.8', kind: 'connector', ic: 'cal', hue: 245, installs: '16k', desc: 'Read and schedule events on shared calendars.' },
    { id: 'datadog', name: 'Datadog', ver: '1.8.1', kind: 'connector', ic: 'chart', hue: 265, installs: '9k', desc: 'Metrics, monitors and dashboards, queried in chat.' },
    { id: 'redis', name: 'Redis', ver: '1.2.4', kind: 'connector', ic: 'chip', hue: 25, installs: '7k', desc: 'Inspect keys, queues and cache hit rates.' },
    { id: 'stripe', name: 'Stripe', ver: '2.2.0', kind: 'connector', ic: 'card', hue: 265, installs: '12k', desc: 'Payments, invoices and subscription events.' },
    { id: 'security-audit', name: 'Security audit', ver: '0.7.0', kind: 'skill', ic: 'shieldcheck', hue: 155, installs: '11k', desc: 'Scans diffs for secrets, injection and risky patterns.' },
    { id: 'migration-writer', name: 'Migration writer', ver: '0.5.2', kind: 'skill', ic: 'dbarrow', hue: 245, installs: '5k', desc: 'Drafts schema migrations from model changes.' },
    { id: 'test-writer', name: 'Test writer', ver: '0.4.1', kind: 'skill', ic: 'okc', hue: 190, installs: '8k', desc: 'Writes unit tests for uncovered paths on every PR.' },
    { id: 'ffmpeg', name: 'ffmpeg', ver: '6.1.0', kind: 'tool', ic: 'film', hue: 130, installs: '13k', desc: 'Transcode, probe and trim media from the terminal.' },
    { id: 'sqlite', name: 'SQLite', ver: '3.46.0', kind: 'tool', ic: 'db', hue: 45, installs: '6k', desc: 'Query local databases and CSVs without a server.' }
  ];
  var FILTERS = [['all', 'All'], ['connector', 'Connectors'], ['skill', 'Skills'], ['tool', 'Tools']];

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function stateOf(p) { return p.off ? 'off' : (p.error ? 'error' : 'on'); }

  // ---- data bridge — mobile surface (Plugins Mobile.html) ----
  // One catalog + state model, two renderers. The mobile page loads this
  // module without #pgRoot, takes PG_CORE, and stops here.
  window.PG_CORE = {
    INSTALLED: INSTALLED, CATALOG: CATALOG, KINDS: KINDS, KIND_LABEL: KIND_LABEL,
    FILTERS: FILTERS, ICONS: I, svg: svg, esc: esc, byId: byId, stateOf: stateOf
  };
  if (!root) return;
  // Embedded in the app shell (EclipseOS.html) vs standalone (Plugins.html).
  // Embedded: shell theme + shell Tweaks panel via window.__pgTweaks; the
  // view-router drives visibility through window.__pgHost.
  var EMBEDDED = root.classList.contains('plugins-view');

  // ============ SHELL ============
  if (!root.hasAttribute('data-pg-detail')) root.setAttribute('data-pg-detail', 'hero');
  var PAGES = {
    plugins: { h1: 'Plugins', sub: 'Work across the tools you already use \u2014 connectors and tools for the agent.', ph: 'Search plugins', add: 'Add plugin' },
    skills:  { h1: 'Skills', sub: 'Task-specific skills the agent runs on demand.', ph: 'Search skills', add: 'Add skill' }
  };
  var startPage = 'plugins';
  try { var pv = localStorage.getItem('pg-page'); if (PAGES[pv]) startPage = pv; } catch (e) {}
  root.innerHTML =
    '<div class="pg-topbar"><div class="pg-topbar-inner">' +
      '<div class="pg-pages" id="pgPages">' +
        '<button class="pg-ftab" data-page="plugins">Plugins</button>' +
        '<button class="pg-ftab" data-page="skills">Skills</button>' +
      '</div>' +
      '<span class="spring"></span>' +
      '<div class="pg-addwrap" id="pgAddWrap">' +
        '<button class="pg-add" id="pgAdd"></button>' +
        '<div class="pg-menu" id="pgAddMenu">' +
          '<button class="pg-menu-it" data-add="git" style="--d:30ms">' + svg(I.branch) + 'Install from a Git URL</button>' +
          '<button class="pg-menu-it" data-add="mcp" style="--d:70ms">' + svg(I.plug) + 'Add an MCP server</button>' +
        '</div>' +
      '</div>' +
    '</div></div>' +
    '<div class="pg-scroll">' +
      '<div class="pg-col">' +
        '<header class="pg-hero"><h1 id="pgH1"></h1><p class="pg-sub" id="pgSub"></p></header>' +
        '<label class="pg-search">' + svg(I.search) + '<input id="pgSearch" type="text"></label>' +
        '<section class="pg-inst" id="pgInst" data-screen-label="Installed strip">' +
          '<div class="pg-bar"><h2>Installed</h2><button class="pg-gear" id="pgGear" aria-label="Manage plugins" title="Manage plugins">' + svg(I.slider) + '</button></div>' +
          '<div class="pg-strip" id="pgStrip"></div>' +
        '</section>' +
        '<div class="pg-sections" id="pgSections"></div>' +
        '<div class="pg-none" id="pgNone">nothing matches \u2014 clear the search</div>' +
      '</div>' +
    '</div>' +
    '<div class="pg-scrim" id="pgScrim"></div>' +
    '<div class="pg-detail-wrap" id="pgDetailWrap"><div class="pg-detail" id="pgDetail"></div></div>' +
    '<div class="pg-toast" id="pgToast"></div>';

  var $ = function (id) { return document.getElementById(id); };
  var sectionsEl = $('pgSections');
  var state = { q: '', page: startPage, detail: null, open: {} };

  // ============ PAGE TABS — Plugins | Skills ============
  function setPage(page) {
    state.page = page; state.open = {};
    var meta = PAGES[page];
    $('pgPages').querySelectorAll('.pg-ftab').forEach(function (b) { b.classList.toggle('on', b.dataset.page === page); });
    $('pgH1').textContent = meta.h1;
    $('pgSub').textContent = meta.sub;
    $('pgSearch').placeholder = meta.ph;
    $('pgAdd').innerHTML = esc(meta.add) + svg(I.chev, 2);
    try { localStorage.setItem('pg-page', page); } catch (e) {}
    renderAll();
  }
  $('pgPages').addEventListener('click', function (e) {
    var t = e.target.closest('.pg-ftab');
    if (t && t.dataset.page !== state.page) setPage(t.dataset.page);
  });
  $('pgGear').addEventListener('click', function () { toast('Open any installed plugin to <b>configure or remove it</b>', I.slider); });

  // ============ ADD MENU ============
  var addWrap = $('pgAddWrap');
  $('pgAdd').addEventListener('click', function (e) { e.stopPropagation(); closeItemMenus(); addWrap.classList.toggle('open'); });
  $('pgAddMenu').addEventListener('click', function (e) {
    var it = e.target.closest('.pg-menu-it'); if (!it) return;
    addWrap.classList.remove('open');
    if (it.dataset.add === 'git') toast('Paste a repo URL in chat \u2014 <b>the agent installs it</b>');
    else toast('Describe the server in chat \u2014 <b>the agent wires it up</b>', I.plug);
  });
  document.addEventListener('click', function (e) {
    if (!addWrap.contains(e.target)) addWrap.classList.remove('open');
    if (!e.target.closest('.pg-itemmenu')) closeItemMenus();
  });
  function closeItemMenus() { sectionsEl.querySelectorAll('.pg-menu.open').forEach(function (m) { m.classList.remove('open'); }); }

  // ============ RENDER — two pages: Plugins (strip + featured + registry) / Skills ============
  var SHOW_MAX = 4;
  function matches(p) {
    if (!state.q) return true;
    return (p.name + ' ' + p.kind + ' ' + (p.desc || '')).toLowerCase().indexOf(state.q) !== -1;
  }
  function inPage(p) { return state.page === 'skills' ? p.kind === 'skill' : p.kind !== 'skill'; }

  function dsHtml(p) {
    if (p.inUse) return '<span class="live">in use \u00b7 ' + esc(p.inUse) + ' <span class="cursor">\u2588</span></span>';
    if (p.error) return '<span class="warn">' + esc(p.error) + '</span>';
    if (p.off) return 'Disabled \u00b7 ' + esc(p.desc);
    if (p.update) return '<span class="warn">update ' + esc(p.update) + ' available</span> \u00b7 ' + esc(p.desc);
    return esc(p.desc);
  }
  function instRowHtml(p) {
    return '<div class="pg-row" data-id="' + p.id + '" data-state="' + stateOf(p) + '" role="button" tabindex="0" style="--pg-h:' + (p.hue || 250) + '">' +
      '<span class="pg-tile">' + svg(I[p.ic]) + '</span>' +
      '<span class="pg-row-main"><span class="nm">' + esc(p.name) + '</span><span class="ds">' + dsHtml(p) + '</span></span>' +
      (state.page === 'skills' && !p.off && !p.error ? '<span class="pg-check">' + svg(I.check, 2) + '</span>' : '') +
      '<div class="pg-itemmenu">' +
        '<button class="pg-dots" aria-label="' + esc(p.name) + ' menu">' + svg(I.dots, 2.4) + '</button>' +
        '<div class="pg-menu">' +
          '<button class="pg-menu-it" data-act="configure" style="--d:30ms">' + svg(I.slider) + 'Configure</button>' +
          '<button class="pg-menu-it" data-act="detail" style="--d:70ms">' + svg(I.term) + 'View activity</button>' +
          (p.update ? '<button class="pg-menu-it" data-act="update" style="--d:110ms">' + svg(I.cycle) + 'Update to ' + esc(p.update) + '</button>' : '') +
          '<button class="pg-menu-it" data-act="toggle" style="--d:' + (p.update ? 150 : 110) + 'ms">' + svg(I.power) + (p.off ? 'Enable' : 'Disable') + '</button>' +
          '<button class="pg-menu-it danger" data-act="remove" style="--d:' + (p.update ? 190 : 150) + 'ms">' + svg(I.trash) + 'Remove</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  function regRowHtml(c) {
    var inst = !!byId(INSTALLED, c.id);
    return '<div class="pg-row" data-reg="' + c.id + '" role="button" tabindex="0" style="--pg-h:' + (c.hue || 250) + '">' +
      '<span class="pg-tile">' + svg(I[c.ic]) + '</span>' +
      '<span class="pg-row-main"><span class="nm">' + esc(c.name) + '</span><span class="ds">' + esc(c.desc) + '</span></span>' +
      (inst ? '<span class="pg-installed">' + svg(I.check, 2) + 'Installed</span>' : '<button class="pg-install">Install</button>') +
    '</div>';
  }
  function moreHtml(kind, rest) {
    if (!rest.length) return '';
    var names = rest.slice(0, 2).map(function (c) { return c.name; });
    var extra = rest.length - names.length;
    var label = 'See ' + names.join(', ') + (extra > 0 ? ', and ' + extra + ' more' : '');
    return '<button class="pg-more" data-more="' + kind + '">' +
      '<span class="pg-more-ics">' + rest.slice(0, 3).map(function (c) { return '<span class="mi" style="--pg-h:' + (c.hue || 250) + '">' + svg(I[c.ic]) + '</span>'; }).join('') + '</span>' +
      esc(label) +
    '</button>';
  }

  function renderStrip() {
    var plugs = INSTALLED.filter(function (p) { return p.kind !== 'skill'; });
    $('pgInst').style.display = (state.page === 'plugins' && plugs.length) ? '' : 'none';
    $('pgStrip').innerHTML = plugs.map(function (p) {
      var tick = p.error ? '<span class="tick err"></span>' : (p.off ? '<span class="tick off"></span>' : '');
      return '<button class="pg-chip-tile" data-id="' + p.id + '" data-state="' + stateOf(p) + '" title="' + esc(p.name) + '" aria-label="' + esc(p.name) + '" style="--pg-h:' + (p.hue || 250) + '">' + svg(I[p.ic]) + tick + '</button>';
    }).join('');
  }
  function renderSections() {
    var html = '', shown = 0;
    // installed — on Plugins it's the curated Featured set (all matches while
    // searching, so everything in the strip stays findable); on Skills it's
    // the whole installed list, check-marked
    var skills = state.page === 'skills';
    var own = INSTALLED.filter(function (p) {
      if (!inPage(p) || !matches(p)) return false;
      return skills || state.q ? true : p.feat;
    });
    if (own.length) {
      shown += own.length;
      var h = skills || state.q ? 'Installed' : 'Featured';
      html += '<section class="pg-board" data-screen-label="' + h + '"><div class="pg-bar"><h2>' + h + '</h2></div><div class="pg-grid">' + own.map(instRowHtml).join('') + '</div></section>';
    }
    // registry — one section per page
    var items = CATALOG.filter(function (c) { return inPage(c) && matches(c); });
    if (items.length) {
      shown += items.length;
      var open = state.q || state.open.reg;
      var vis = open ? items : items.slice(0, SHOW_MAX);
      var rest = open ? [] : items.slice(SHOW_MAX);
      html += '<section class="pg-board" data-screen-label="Registry"><div class="pg-bar"><h2>Registry</h2></div><div class="pg-grid">' + vis.map(regRowHtml).join('') + moreHtml('reg', rest) + '</div></section>';
    }
    sectionsEl.innerHTML = html;
    $('pgNone').classList.toggle('show', !shown);
  }
  function renderAll() { renderStrip(); renderSections(); }

  // strip — tap a tile for its detail
  $('pgStrip').addEventListener('click', function (e) {
    var t = e.target.closest('.pg-chip-tile');
    if (t) openDetail(t.dataset.id);
  });

  sectionsEl.addEventListener('click', function (e) {
    var more = e.target.closest('.pg-more');
    if (more) { state.open[more.dataset.more] = true; renderSections(); return; }
    var row = e.target.closest('.pg-row'); if (!row) return;
    // registry rows — install (button or row) / open detail when installed
    if (row.dataset.reg) {
      var c = byId(CATALOG, row.dataset.reg); if (!c) return;
      var inst = byId(INSTALLED, c.id);
      if (inst) { openDetail(c.id); return; }
      installFromReg(c);
      return;
    }
    // installed (featured) rows
    var p = byId(INSTALLED, row.dataset.id); if (!p) return;
    var dots = e.target.closest('.pg-dots');
    if (dots) {
      var menu = dots.nextElementSibling, was = menu.classList.contains('open');
      closeItemMenus(); addWrap.classList.remove('open');
      if (!was) menu.classList.add('open');
      return;
    }
    var act = e.target.closest('.pg-menu-it');
    if (act) { closeItemMenus(); doAction(p, act.dataset.act); return; }
    openDetail(p.id);
  });
  sectionsEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var row = e.target.closest('.pg-row'); if (!row || e.target !== row) return;
    e.preventDefault(); row.click();
  });

  $('pgSearch').addEventListener('input', function () { state.q = this.value.trim().toLowerCase(); renderSections(); });

  function installFromReg(c) {
    INSTALLED.push({
      id: c.id, name: c.name, ver: c.ver, kind: c.kind, ic: c.ic, hue: c.hue, desc: c.desc,
      line: 'installed just now',
      perms: ['Granted on first use \u2014 the agent asks per scope'],
      config: [['Source', 'registry'], ['Installed', 'just now']],
      log: [['now', 'installed from registry \u00b7 v' + c.ver]]
    });
    toast('<b>' + esc(c.name) + '</b> installed', I.okc);
    renderAll();
  }

  // ============ ACTIONS ============
  function togglePlugin(p) {
    p.off = !p.off;
    if (!p.off && p.id === 'linear') { /* re-enabling doesn't clear an expired token */ }
    toast('<b>' + esc(p.name) + '</b> ' + (p.off ? 'disabled' : 'enabled'), p.off ? I.power : I.okc);
    renderAll();
    if (state.detail === p.id) fillDetail(p);
  }
  function updatePlugin(p) {
    if (!p.update) return;
    p.ver = p.update; p.update = null;
    toast('<b>' + esc(p.name) + '</b> updated to ' + esc(p.ver), I.cycle);
    renderAll();
    if (state.detail === p.id) fillDetail(p);
  }
  function removePlugin(p) {
    var i = INSTALLED.indexOf(p);
    if (i > -1) INSTALLED.splice(i, 1);
    toast('<b>' + esc(p.name) + '</b> removed', I.trash);
    if (state.detail === p.id) closeDetail();
    renderAll();
  }
  function doAction(p, act) {
    if (act === 'configure') toast('Ask in chat to reconfigure <b>' + esc(p.name) + '</b>', I.slider);
    else if (act === 'detail') openDetail(p.id);
    else if (act === 'update') updatePlugin(p);
    else if (act === 'toggle') togglePlugin(p);
    else if (act === 'remove') removePlugin(p);
  }

  // ============ DETAIL ============
  var scrim = $('pgScrim'), detailWrap = $('pgDetailWrap'), detailEl = $('pgDetail');
  function badgeOf(p) {
    if (p.off) return ['disabled', 'disabled'];
    if (p.error) return ['error', 'error'];
    if (p.kind === 'connector') return ['connected', 'connected'];
    return ['enabled', 'enabled'];
  }
  function fillDetail(p) {
    var badge = badgeOf(p);
    var verRow = 'v' + esc(p.ver) + (p.update ? ' <span class="warn">\u00b7 ' + esc(p.update) + ' available</span>' : ' <span class="dim">\u00b7 latest</span>');
    detailEl.innerHTML =
      '<div class="pg-detail-panel">' +
        '<div class="pg-detail-head">' +
          '<span class="pg-jid">' + esc(p.id) + '@' + esc(p.ver) + '</span>' +
          '<span class="spring"></span>' +
          '<span class="pg-badge" data-state="' + badge[0] + '"><span class="b-dot"></span>' + badge[1] + '</span>' +
          '<button class="pg-detail-close" data-act="close" aria-label="Close">' + svg(I.close, 2) + '</button>' +
        '</div>' +
        '<div class="pg-detail-body">' +
          '<div class="pg-d-titlerow">' +
            '<span class="pg-d-tile">' + svg(I[p.ic]) + '</span>' +
            '<div><div class="pg-d-title">' + esc(p.name) + '</div><div class="pg-d-kind">' + KIND_LABEL[p.kind] + '</div></div>' +
          '</div>' +
          '<p class="pg-d-desc">' + esc(p.desc) + '</p>' +
          '<div class="pg-sec"><div class="pg-eyebrow">Permissions <span class="n">' + p.perms.length + '</span></div>' +
            '<div class="pg-perms">' + p.perms.map(function (pe) { return '<div class="pg-perm">' + svg(I.check, 2) + esc(pe) + '</div>'; }).join('') + '</div>' +
          '</div>' +
          '<div class="pg-sec"><div class="pg-eyebrow">Configuration</div>' +
            '<div class="pg-kvs">' +
              p.config.map(function (kv) { return '<div class="pg-kv"><span class="rk">' + esc(kv[0]) + '</span><span class="rv">' + esc(kv[1]) + '</span></div>'; }).join('') +
              '<div class="pg-kv"><span class="rk">Version</span><span class="rv">' + verRow + '</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="pg-sec"><div class="pg-eyebrow">Activity</div>' +
            '<div class="pg-well"><div class="pg-log">' +
              p.log.map(function (l) { return '<span class="t">' + esc(l[0]) + '</span>  <span class="' + (l[2] || '') + '">' + esc(l[1]) + '</span>'; }).join('\n') +
              (p.inUse ? '\n<span class="t">now</span>  ' + esc(p.inUse) + ' <span class="cursor">\u2588</span>' : '') +
            '</div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pg-detail-acts">' +
        '<button class="pg-action" data-act="toggle">' + svg(I.power) + (p.off ? 'Enable' : 'Disable') + '</button>' +
        (p.update ? '<button class="pg-action" data-act="update">' + svg(I.cycle) + 'Update to ' + esc(p.update) + '</button>' : '') +
        '<span class="spring"></span>' +
        '<button class="pg-action danger" data-act="remove">' + svg(I.trash) + 'Remove</button>' +
        '<button class="pg-action go" data-act="configure">' + svg(I.slider) + 'Configure</button>' +
      '</div>';
  }
  function openDetail(id) {
    var p = byId(INSTALLED, id); if (!p) return;
    state.detail = id;
    fillDetail(p);
    scrim.classList.add('open');
    detailWrap.classList.add('open');
  }
  function closeDetail() {
    state.detail = null;
    scrim.classList.remove('open');
    detailWrap.classList.remove('open');
  }
  detailEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'close') { closeDetail(); return; }
    var p = byId(INSTALLED, state.detail); if (!p) return;
    doAction(p, b.dataset.act);
  });
  scrim.addEventListener('click', closeDetail);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (detailWrap.classList.contains('open')) { closeDetail(); return; }
    closeItemMenus(); addWrap.classList.remove('open');
  });

  // ============ TOAST — a moment (§7) ============
  var toastEl = $('pgToast'), toastT = null;
  function toast(html, ic) {
    clearTimeout(toastT);
    toastEl.classList.remove('show');
    // force restart so the stamp re-pops
    void toastEl.offsetWidth;
    toastEl.innerHTML = '<span class="tz-ic">' + svg(ic || I.okc, 2) + '</span><span class="tz-txt">' + html + '</span><span class="tz-stamp"></span>';
    toastEl.classList.add('show');
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 4000);
  }
  toastEl.addEventListener('mouseenter', function () { clearTimeout(toastT); });
  toastEl.addEventListener('mouseleave', function () { toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 1500); });

  // ============ FIRST RENDER ============
  setPage(state.page);

  // ============ HOST INTEGRATION / TWEAKS ============
  if (EMBEDDED) initHostEmbed(); else initTweaks();

  // Embedded in the shell: no page-local theme, no own Tweaks panel (the
  // shell's React panel drives the surface prefs via window.__pgTweaks).
  // Registers the host API the view-router calls.
  function initHostEmbed() {
    var main = root.closest('.main');
    var TW = { detail: 'hero', density: 'cozy' };
    try { var saved = JSON.parse(localStorage.getItem('pg-tweaks') || '{}'); for (var k in saved) if (k in TW && saved[k] != null) TW[k] = saved[k]; } catch (e) {}
    function applyAll() {
      root.setAttribute('data-pg-detail', TW.detail);
      root.setAttribute('data-pg-density', TW.density);
    }
    applyAll();
    window.__pgTweaks = {
      get: function () { return { detail: TW.detail, density: TW.density }; },
      set: function (key, val) {
        if (!(key in TW) || TW[key] === val) return;
        TW[key] = val; applyAll();
        try { localStorage.setItem('pg-tweaks', JSON.stringify(TW)); } catch (e) {}
      }
    };
    window.__pgHost = {
      enter: function () { if (main) main.classList.add('show-plugins'); },
      exit: function () {
        if (main) main.classList.remove('show-plugins');
        closeDetail(); closeItemMenus();
        addWrap.classList.remove('open');
      }
    };
  }

  // ============ TWEAKS (standalone page — page-local keys) ============
  function initTweaks() {
    var THEMES = [['minimal', 'Soft'], ['daybreak', 'Daybreak'], ['atlas', 'Atlas'], ['dark', 'Umbra'], ['midnight', 'Midnight'], ['amber', 'Amber']];
    var APP = { minimal: 'light', daybreak: 'light', atlas: 'light', dark: 'dark', midnight: 'dark', amber: 'dark' };
    var TW = { theme: 'dark', detail: 'hero', density: 'cozy' };
    try { var saved = JSON.parse(localStorage.getItem('pg-tweaks') || '{}'); for (var k in saved) if (k in TW && saved[k] != null) TW[k] = saved[k]; } catch (e) {}
    try { var th = localStorage.getItem('pg-theme'); if (th && APP[th]) TW.theme = th; } catch (e) {}

    var panel = document.createElement('div');
    panel.className = 'pg-tweaks'; panel.id = 'pgTweaks';
    function seg(key, opts) {
      return '<div class="pg-tw-sec"><span class="pg-tw-lbl">' + key.charAt(0).toUpperCase() + key.slice(1) + '</span><div class="pg-tw-seg" data-tw="' + key + '">' +
        opts.map(function (o) { return '<button class="pg-tw-opt' + (TW[key] === o[0] ? ' on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') +
      '</div></div>';
    }
    panel.innerHTML =
      '<div class="pg-tw-head"><span class="dotmark">\u25d0</span><span class="t">Tweaks</span><button class="pg-tw-x" aria-label="Close tweaks">' + svg(I.close, 2) + '</button></div>' +
      '<div class="pg-tw-body">' +
        seg('theme', THEMES) +
        seg('detail', [['hero', 'Hero expand'], ['side', 'Side panel']]) +
        seg('density', [['cozy', 'Cozy'], ['compact', 'Compact']]) +
      '</div>';
    document.body.appendChild(panel);

    var html = document.documentElement;
    function applyAll() {
      html.setAttribute('data-theme', TW.theme);
      html.setAttribute('data-appearance', APP[TW.theme]);
      html.style.colorScheme = APP[TW.theme];
      root.setAttribute('data-pg-detail', TW.detail);
      root.setAttribute('data-pg-density', TW.density);
    }
    function persist() {
      try { localStorage.setItem('pg-tweaks', JSON.stringify({ detail: TW.detail, density: TW.density })); localStorage.setItem('pg-theme', TW.theme); } catch (e) {}
      try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { theme: TW.theme, detail: TW.detail, density: TW.density } }, '*'); } catch (e) {}
    }
    applyAll();

    panel.addEventListener('click', function (e) {
      var opt = e.target.closest('.pg-tw-opt');
      if (opt) {
        var key = opt.closest('.pg-tw-seg').dataset.tw;
        TW[key] = opt.dataset.v;
        opt.closest('.pg-tw-seg').querySelectorAll('.pg-tw-opt').forEach(function (b) { b.classList.toggle('on', b === opt); });
        applyAll(); persist(); return;
      }
      if (e.target.closest('.pg-tw-x')) { panel.classList.remove('on'); try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (er) {} }
    });

    window.addEventListener('message', function (e) {
      var ty = e.data && e.data.type;
      if (ty === '__activate_edit_mode') panel.classList.add('on');
      else if (ty === '__deactivate_edit_mode') panel.classList.remove('on');
    });
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
  }
})();
