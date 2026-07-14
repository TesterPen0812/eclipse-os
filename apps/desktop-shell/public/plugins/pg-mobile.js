/* ============================================================
   ECLIPSE OS — PLUGINS · MOBILE renderer
   The desktop Plugins module, pocket-sized. Consumes PG_CORE
   (exported by plugins/plugins.js — one catalog + state model,
   two renderers) and MSHELL. Installed ⇄ Browse tabs, kind
   sections as rows panels, ink toggles, one-tap installs, and
   a Dialog-Mat detail sheet with actions on the mat.
   ============================================================ */
(function () {
  "use strict";
  var P = window.PG_CORE, M = window.MSHELL;
  if (!P || !M || !document.getElementById('pgmApp')) return;
  var I = P.ICONS, svg = P.svg, esc = P.esc;
  var INSTALLED = P.INSTALLED, CATALOG = P.CATALOG;

  var $ = function (id) { return document.getElementById(id); };
  var state = { tab: 'installed', q: '', rq: '', cat: 'all', detail: null };
  var toast = M.toaster($('pgmToast'));
  var sheet = M.sheet({ sheet: $('pgmSheet'), scrim: $('pgmScrim'), onClose: function () { state.detail = null; } });

  // ============ HEADER SUB ============
  function renderSub() {
    var on = INSTALLED.filter(function (p) { return !p.off; }).length;
    var err = INSTALLED.filter(function (p) { return p.error && !p.off; }).length;
    $('pgmSub').innerHTML = '<span>' + on + ' of ' + INSTALLED.length + ' enabled' +
      (err ? ' \u00b7 <b>' + err + ' needs attention</b>' : '') + '</span>';
  }

  // ============ TABS ============
  var elSeg = $('pgmSeg');
  function setTab(tab, animate) {
    state.tab = tab;
    elSeg.querySelectorAll('.m-seg-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); });
    M.segThumb(elSeg, animate !== false);
    $('pgmInstalled').hidden = tab !== 'installed';
    $('pgmBrowse').hidden = tab !== 'browse';
  }
  elSeg.addEventListener('click', function (e) {
    var t = e.target.closest('.m-seg-tab');
    if (!t || t.dataset.tab === state.tab) return;
    setTab(t.dataset.tab);
  });

  // ============ INSTALLED ============
  function matches(p) {
    if (!state.q) return true;
    return (p.name + ' ' + p.kind + ' ' + p.desc + ' ' + p.line).toLowerCase().indexOf(state.q) !== -1;
  }
  function dotClass(p) {
    if (p.off) return '';
    if (p.error) return ' err';
    if (p.inUse) return ' live';
    return p.kind === 'connector' ? ' conn' : ' on';
  }
  function l2Html(p) {
    var dot = '<span class="pgm-dot' + dotClass(p) + '"></span>';
    if (p.inUse) return dot + '<span class="live">in use \u00b7 ' + esc(p.inUse) + ' <span class="cursor">\u2588</span></span>';
    if (p.error) return dot + '<span class="warn">' + esc(p.error) + '</span>';
    var s = dot + (p.off ? 'Disabled<span class="sep">\u00b7</span>' : '') + esc(p.line);
    if (p.update && !p.off) s += '<span class="sep">\u00b7</span><span class="warn">update ' + esc(p.update) + ' available</span>';
    return s;
  }
  function itemHtml(p) {
    return '<div class="pgm-item" data-id="' + p.id + '" data-state="' + P.stateOf(p) + '" role="button" tabindex="0">' +
      '<span class="pgm-tile">' + svg(I[p.ic]) + '</span>' +
      '<span class="pgm-main">' +
        '<span class="pgm-l1"><span class="nm">' + esc(p.name) + '</span><span class="vr">v' + esc(p.ver) + '</span></span>' +
        '<span class="pgm-l2">' + l2Html(p) + '</span>' +
      '</span>' +
      '<button class="m-tgl" data-tgl="' + p.id + '" role="switch" aria-checked="' + (!p.off) + '" aria-label="' + esc(p.name) + ' enabled"></button>' +
    '</div>';
  }
  function renderInstalled() {
    var html = '', any = false;
    P.KINDS.forEach(function (k) {
      var items = INSTALLED.filter(function (p) { return p.kind === k[0] && matches(p); });
      if (!items.length) return;
      any = true;
      html += '<section class="pgm-board">' +
        '<div class="m-eyebrow">' + k[1] + ' <span class="n">' + items.length + '</span></div>' +
        '<div class="pgm-panel">' + items.map(itemHtml).join('') + '</div>' +
      '</section>';
    });
    $('pgmSections').innerHTML = html || '<div class="m-none">nothing matches \u2014 clear the search or browse the registry</div>';
    renderSub();
  }
  $('pgmSections').addEventListener('click', function (e) {
    var tgl = e.target.closest('[data-tgl]');
    if (tgl) { var p0 = P.byId(INSTALLED, tgl.dataset.tgl); if (p0) togglePlugin(p0); return; }
    var item = e.target.closest('.pgm-item');
    if (item) openDetail(item.dataset.id);
  });
  $('pgmSections').addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('pgm-item')) {
      e.preventDefault(); openDetail(e.target.dataset.id);
    }
  });
  $('pgmSearch').addEventListener('input', function () { state.q = this.value.trim().toLowerCase(); renderInstalled(); });

  // ============ ACTIONS ============
  function togglePlugin(p) {
    p.off = !p.off;
    toast(svg(p.off ? I.power : I.okc, 2), '<b>' + esc(p.name) + '</b> ' + (p.off ? 'disabled' : 'enabled'), !p.off);
    renderInstalled();
    if (state.detail === p.id) openDetail(p.id);
  }
  function updatePlugin(p) {
    if (!p.update) return;
    p.ver = p.update; p.update = null;
    toast(svg(I.cycle, 2), '<b>' + esc(p.name) + '</b> updated to v' + esc(p.ver), true);
    renderInstalled();
    if (state.detail === p.id) openDetail(p.id);
  }
  function removePlugin(p) {
    var i = INSTALLED.indexOf(p);
    if (i > -1) INSTALLED.splice(i, 1);
    toast(svg(I.trash, 2), '<b>' + esc(p.name) + '</b> removed');
    if (state.detail === p.id) sheet.close();
    renderInstalled(); renderBrowse();
  }

  // ============ BROWSE ============
  function regMatches(c) {
    if (state.cat !== 'all' && c.kind !== state.cat) return false;
    if (!state.rq) return true;
    return (c.name + ' ' + c.kind + ' ' + c.desc).toLowerCase().indexOf(state.rq) !== -1;
  }
  function renderFilters() {
    $('pgmFilters').innerHTML = P.FILTERS.map(function (f) {
      return '<button class="m-chip' + (state.cat === f[0] ? ' on' : '') + '" data-cat="' + f[0] + '">' + f[1] + '</button>';
    }).join('');
  }
  function renderBrowse() {
    var out = '', any = false;
    CATALOG.forEach(function (c) {
      if (!regMatches(c)) return;
      any = true;
      var installed = !!P.byId(INSTALLED, c.id);
      out += '<button class="pgm-regcard' + (installed ? ' installed' : '') + '" data-id="' + c.id + '">' +
        '<span class="rc-top"><span class="rc-ic">' + svg(I[c.ic]) + '</span><span class="rc-kind">' + P.KIND_LABEL[c.kind] + '</span></span>' +
        '<span class="rc-name">' + esc(c.name) + '<span class="vr">v' + esc(c.ver) + '</span></span>' +
        '<span class="rc-desc">' + esc(c.desc) + '</span>' +
        '<span class="rc-foot"><span>' + esc(c.installs) + ' installs</span>' +
          (installed
            ? '<span class="go">' + svg(I.check, 2) + 'Installed</span>'
            : '<span class="go">Install' + svg(I.arrow, 2) + '</span>') +
        '</span>' +
      '</button>';
    });
    $('pgmGrid').innerHTML = out || '<div class="m-none">nothing matches \u2014 clear the search or pick another filter</div>';
  }
  $('pgmGrid').addEventListener('click', function (e) {
    var card = e.target.closest('.pgm-regcard'); if (!card || card.classList.contains('installed')) return;
    var c = P.byId(CATALOG, card.dataset.id); if (!c) return;
    INSTALLED.push({
      id: c.id, name: c.name, ver: c.ver, kind: c.kind, ic: c.ic, desc: c.desc,
      line: 'installed just now',
      perms: ['Granted on first use \u2014 the agent asks per scope'],
      config: [['Source', 'registry'], ['Installed', 'just now']],
      log: [['now', 'installed from registry \u00b7 v' + c.ver]]
    });
    toast(svg(I.okc, 2), '<b>' + esc(c.name) + '</b> installed', true);
    renderInstalled(); renderBrowse();
  });
  $('pgmFilters').addEventListener('click', function (e) {
    var f = e.target.closest('[data-cat]'); if (!f) return;
    state.cat = f.dataset.cat;
    renderFilters(); renderBrowse();
  });
  $('pgmRegSearch').addEventListener('input', function () { state.rq = this.value.trim().toLowerCase(); renderBrowse(); });

  // ============ DETAIL — Dialog Mat sheet ============
  function badgeOf(p) {
    if (p.off) return 'disabled';
    if (p.error) return 'error';
    if (p.kind === 'connector') return 'connected';
    return 'enabled';
  }
  function openDetail(id) {
    var p = P.byId(INSTALLED, id); if (!p) return;
    state.detail = id;
    var badge = badgeOf(p);
    var verRow = 'v' + esc(p.ver) + (p.update ? ' <span class="warn">\u00b7 ' + esc(p.update) + ' available</span>' : ' <span class="dim">\u00b7 latest</span>');
    sheet.open(
      '<div class="m-frame-lbl">' + P.KIND_LABEL[p.kind] + '</div>' +
      '<div class="m-sheet-scroll"><div class="m-panel">' +
        '<div class="m-panel-head"><span class="m-jid">' + esc(p.id) + '@' + esc(p.ver) + '</span><span class="spring"></span>' +
          '<span class="m-badge" data-state="' + badge + '"><span class="b-dot"></span>' + badge + '</span></div>' +
        '<div class="pgm-d-titlerow">' +
          '<span class="pgm-d-tile">' + svg(I[p.ic]) + '</span>' +
          '<div><div class="m-panel-title">' + esc(p.name) + '</div><div class="pgm-d-kind">' + P.KIND_LABEL[p.kind] + '</div></div>' +
        '</div>' +
        '<div class="m-panel-desc">' + esc(p.desc) + '</div>' +
        '<div class="m-sec"><div class="m-eyebrow">Permissions <span class="n">' + p.perms.length + '</span></div>' +
          '<div class="pgm-perms">' + p.perms.map(function (pe) { return '<div class="pgm-perm">' + svg(I.check, 2) + esc(pe) + '</div>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="m-sec"><div class="m-eyebrow">Configuration</div><div class="m-kvs">' +
          p.config.map(function (kv) { return '<div class="m-kv"><span class="rk">' + esc(kv[0]) + '</span><span class="rv">' + esc(kv[1]) + '</span></div>'; }).join('') +
          '<div class="m-kv"><span class="rk">Version</span><span class="rv">' + verRow + '</span></div>' +
        '</div></div>' +
        '<div class="m-sec"><div class="m-eyebrow">Activity</div>' +
          '<div class="m-well"><div class="m-log">' +
            p.log.map(function (l) { return '<span class="t">' + esc(l[0]) + '</span>  <span class="' + (l[2] || '') + '">' + esc(l[1]) + '</span>'; }).join('\n') +
            (p.inUse ? '\n<span class="t">now</span>  ' + esc(p.inUse) + ' <span class="cursor">\u2588</span>' : '') +
          '</div></div>' +
        '</div>' +
      '</div></div>' +
      '<div class="m-acts">' +
        '<button class="m-act go" data-act="configure">' + svg(I.slider) + 'Configure</button>' +
        '<button class="m-act" data-act="toggle">' + svg(I.power) + (p.off ? 'Enable' : 'Disable') + '</button>' +
        (p.update ? '<button class="m-act" data-act="update">' + svg(I.cycle) + 'Update</button>' : '') +
        '<button class="m-act danger" data-act="remove">' + svg(I.trash) + '</button>' +
      '</div>'
    );
    sheet.el.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'configure') { toast(svg(I.slider, 2), 'Ask in chat to reconfigure <b>' + esc(p.name) + '</b>'); return; }
      if (act === 'toggle') togglePlugin(p);
      else if (act === 'update') updatePlugin(p);
      else if (act === 'remove') removePlugin(p);
    };
  }

  // ============ ADD MENU (FAB) ============
  $('pgmFab').innerHTML = svg(I.plug, 1.8);
  $('pgmFab').addEventListener('click', function () {
    sheet.open(
      '<div class="m-frame-lbl">Add plugin</div>' +
      '<div class="m-sheet-scroll"><div class="m-panel" style="padding:7px"><div class="m-rows" style="padding:0">' +
        '<button class="m-row" data-add="browse">' + svg(I.search) + '<span class="r-main"><span class="r-title">Browse the registry</span><span class="r-sub">connectors, skills and tools</span></span></button>' +
        '<button class="m-row" data-add="git">' + svg(I.branch) + '<span class="r-main"><span class="r-title">Install from a Git URL</span><span class="r-sub">paste a repo \u2014 the agent installs it</span></span></button>' +
        '<button class="m-row" data-add="mcp">' + svg(I.plug) + '<span class="r-main"><span class="r-title">Add an MCP server</span><span class="r-sub">describe it in chat \u2014 the agent wires it up</span></span></button>' +
      '</div></div></div>'
    );
    sheet.el.onclick = function (e) {
      var it = e.target.closest('[data-add]'); if (!it) return;
      sheet.el.onclick = null;
      sheet.close();
      if (it.dataset.add === 'browse') setTab('browse');
      else if (it.dataset.add === 'git') toast(svg(I.branch, 2), 'Paste a repo URL in chat \u2014 <b>the agent installs it</b>');
      else toast(svg(I.plug, 2), 'Describe the server in chat \u2014 <b>the agent wires it up</b>');
    };
  });

  // ============ FIRST RENDER ============
  renderSub();
  renderInstalled();
  renderFilters();
  renderBrowse();
  setTab('installed', false);
  window.addEventListener('resize', function () { M.segThumb(elSeg, false); });
})();
