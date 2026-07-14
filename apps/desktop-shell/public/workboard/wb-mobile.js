/* ============================================================
   ECLIPSE OS — WORKBOARD · MOBILE renderer (v2)
   The desktop board, pocket-sized. Consumes WB_CORE (exported
   by workboard.js — one seed-data + status model + card
   vocabulary, two renderers) and MSHELL (mobile-shell.js).
   Desktop parity: board/list views, search + priority/agent/
   archived filters, board switcher, notifications, dispatcher,
   full card anatomy, and a Dialog-Mat detail sheet with the
   drawer's routing / handoff / diagnostics / actions.
   ============================================================ */
(function () {
  "use strict";
  var W = window.WB_CORE, M = window.MSHELL;
  if (!W || !M || !document.getElementById('wbmApp')) return;
  var I = W.ICONS, svg = W.svg, esc = W.esc, now = W.now;

  // ---- state ----
  var curBoard = (function () {
    try { var b = localStorage.getItem('sb-wb-board'); return W.BOARDS[b] ? b : 'shared-brain'; } catch (e) { return 'shared-brain'; }
  })();
  var curLane = (function () {
    try { var l = localStorage.getItem('wbm-lane'); return W.LANES.some(function (x) { return x.id === l; }) ? l : 'progress'; } catch (e) { return 'progress'; }
  })();
  var view = (function () {
    try { return localStorage.getItem('wbm-view') === 'list' ? 'list' : 'board'; } catch (e) { return 'board'; }
  })();
  var filter = { q: '', prio: 'all', agent: 'all', archived: false };
  var autoDispatch = false;
  var detailId = null, detailTab = 'evidence';
  var nextId = 260;

  var $ = function (id) { return document.getElementById(id); };
  var elSub = $('wbmSub'), elSwitch = $('wbmSwitch'), elSeg = $('wbmView');
  var elFilters = $('wbmFilters'), elLanes = $('wbmLanes'), elPager = $('wbmPager'), elList = $('wbmList');
  var toast = M.toaster($('wbmToast'));
  var sheet = M.sheet({ sheet: $('wbmSheet'), scrim: $('wbmScrim'), onClose: function () { detailId = null; } });

  function board() { return W.BOARDS[curBoard]; }
  function allCards() { return board().cards.filter(function (c) { return !c.hidden; }); }
  function matchesFilter(c) {
    if (filter.archived ? !c.archived : c.archived) return false;
    if (filter.prio !== 'all' && String(c.prio) !== filter.prio) return false;
    if (filter.agent === 'unassigned') { if (c.owner) return false; }
    else if (filter.agent !== 'all' && c.owner !== filter.agent) return false;
    if (filter.q) { var q = filter.q.toLowerCase(); if ((c.title + ' ' + c.id).toLowerCase().indexOf(q) < 0) return false; }
    return true;
  }
  function visibleCards() { return allCards().filter(matchesFilter); }
  function laneCards(id) { return visibleCards().filter(function (c) { return c.lane === id; }); }
  function laneIndex(id) { for (var i = 0; i < W.LANES.length; i++) if (W.LANES[i].id === id) return i; return 0; }
  function filterActive() { return !!(filter.q || filter.prio !== 'all' || filter.agent !== 'all'); }

  // ============ HEADER ============
  function renderSub() {
    var all = allCards();
    var inFlight = all.filter(function (c) { return c.lane === 'progress' && !c.archived; }).length;
    var alive = all.filter(function (c) { return c.lane === 'progress' && !c.archived && !W.isStale(c); }).length;
    var blocked = all.filter(function (c) { return c.lane === 'blocked' && !c.archived; }).length;
    var bits = '';
    if (inFlight) bits += (alive ? '<span class="live-dot"></span>' : '<span class="idle-dot"></span>') + '<span>' + inFlight + ' in flight</span>';
    if (blocked) bits += (bits ? '<span class="sep">\u00b7</span>' : '') + '<span class="wb-blk">' + blocked + ' blocked</span>';
    elSub.innerHTML = bits || '<span>Agent work queue</span>';
    var unread = W.NOTIFS.some(function (n) { return !n.read; });
    $('wbmBell').innerHTML = svg(I.bell, 2) + (unread ? '<span class="nd"></span>' : '');
  }
  function renderSwitch() {
    var b = board();
    elSwitch.innerHTML = svg(I.folder, 2) +
      '<span class="bd-name">' + esc(b.name) + '</span>' +
      '<span class="bd-branch">' + esc(b.branch) + '</span>' +
      '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + I.chev + '"/></svg>';
  }

  // ============ FILTER CHIPS ============
  var PRIO_OPTIONS = [['all', 'All priorities'], ['0', 'P0 \u00b7 high'], ['1', 'P1 \u00b7 med'], ['2', 'P2 \u00b7 low']];
  function agentOptions() {
    var opts = [['all', 'All agents'], ['unassigned', 'Unassigned']];
    Object.keys(W.AGENTS).forEach(function (a) { opts.push([a, a]); });
    return opts;
  }
  function renderFilters() {
    var prioLabel = filter.prio === 'all' ? 'All priorities' : 'P' + filter.prio;
    var agentLabel = filter.agent === 'all' ? 'All agents' : (filter.agent === 'unassigned' ? 'Unassigned' : filter.agent);
    elFilters.innerHTML =
      '<button class="m-chip' + (filter.prio !== 'all' ? ' on' : '') + '" data-f="prio">' + esc(prioLabel) + svg(I.chev, 2.2) + '</button>' +
      '<button class="m-chip' + (filter.agent !== 'all' ? ' on' : '') + '" data-f="agent">' + esc(agentLabel) + svg(I.chev, 2.2) + '</button>' +
      '<button class="m-chip' + (filter.archived ? ' on' : '') + '" data-f="archived">' + svg(I.arch, 2) + 'Archived</button>' +
      (filterActive() ? '<button class="m-chip" data-f="clear">' + svg(I.close, 2) + 'Clear</button>' : '');
  }
  elFilters.addEventListener('click', function (e) {
    var ch = e.target.closest('[data-f]'); if (!ch) return;
    var f = ch.dataset.f;
    if (f === 'archived') { filter.archived = !filter.archived; rerender(); return; }
    if (f === 'clear') { filter.q = ''; filter.prio = 'all'; filter.agent = 'all'; $('wbmSearch').value = ''; rerender(); return; }
    if (f === 'prio') openPicker('Priority', PRIO_OPTIONS, filter.prio, function (v) { filter.prio = v; rerender(); });
    if (f === 'agent') openPicker('Agent', agentOptions(), filter.agent, function (v) { filter.agent = v; rerender(); });
  });
  function openPicker(title, opts, cur, apply) {
    sheet.open(
      '<div class="wbm-sheet-h"><span class="t">' + title + '</span></div>' +
      '<div class="m-sheet-scroll"><div class="m-panel" style="padding:7px"><div class="m-rows" style="padding:0">' +
      opts.map(function (o) {
        return '<button class="m-row" data-pick="' + o[0] + '"><span class="r-title" style="flex:1">' + esc(o[1]) + '</span>' +
          (String(cur) === o[0] ? svg(I.check, 2) : '') + '</button>';
      }).join('') + '</div></div></div>'
    );
    sheet.el.onclick = function (e) {
      var r = e.target.closest('[data-pick]'); if (!r) return;
      sheet.el.onclick = null;
      apply(r.dataset.pick);
      sheet.close();
    };
  }

  var elSearch = $('wbmSearch');
  elSearch.addEventListener('input', function () { filter.q = elSearch.value; renderFilters(); renderBoardOrList(); });

  // ============ VIEW SEG ============
  function applyView(animate) {
    elSeg.querySelectorAll('.m-seg-tab').forEach(function (t) { t.classList.toggle('on', t.dataset.view === view); });
    M.segThumb(elSeg, animate);
    elLanes.hidden = view !== 'board';
    elPager.hidden = view !== 'board';
    elList.hidden = view !== 'list';
  }
  elSeg.addEventListener('click', function (e) {
    var t = e.target.closest('.m-seg-tab');
    if (!t || t.dataset.view === view) return;
    view = t.dataset.view;
    try { localStorage.setItem('wbm-view', view); } catch (er) {}
    applyView(true);
    renderBoardOrList();
  });

  // ============ LANE STRIP ============
  function renderLanes() {
    var running = laneCards('progress').length > 0;
    elLanes.innerHTML = W.LANES.map(function (l) {
      var n = laneCards(l.id).length;
      var dot = (l.id === 'progress' && running) ? '<span class="live-dot"></span>' : '';
      return '<button class="m-chip' + (l.id === curLane ? ' on' : '') + '" data-lane="' + l.id + '">' +
        dot + esc(l.name) + '<span class="n">' + n + '</span></button>';
    }).join('');
    syncChips();
  }
  function syncChips() {
    elLanes.querySelectorAll('[data-lane]').forEach(function (ch) { ch.classList.toggle('on', ch.dataset.lane === curLane); });
    var on = elLanes.querySelector('.m-chip.on');
    if (on) {
      var target = on.offsetLeft - (elLanes.clientWidth - on.offsetWidth) / 2;
      elLanes.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
  }
  elLanes.addEventListener('click', function (e) {
    var ch = e.target.closest('[data-lane]'); if (!ch) return;
    curLane = ch.dataset.lane;
    try { localStorage.setItem('wbm-lane', curLane); } catch (er) {}
    syncChips();
    elPager.scrollTo({ left: laneIndex(curLane) * elPager.clientWidth, behavior: 'smooth' });
  });

  // ============ CARDS — desktop anatomy, shared vocabulary ============
  function cardHTML(c) {
    var stale = W.isStale(c), parent = W.depParent(c);
    var cls = 'wb-card';
    if (c.lane === 'done') cls += ' done-card';
    if (c.lane === 'blocked' || stale) cls += ' dim';
    if (stale) cls += ' stale';

    var top = '<div class="wb-card-top"><span class="wb-id">' + c.id + '</span>' +
      W.prioHTML(c) + '<span class="spring"></span>' + W.cardFlag(c) + W.statusChip(c, true) + '</div>';
    var title = '<div class="wb-card-title">' + esc(c.title) + '</div>';
    var tags = c.skills.length ? '<div class="wb-tags">' + c.skills.map(function (s) {
      return '<span class="wb-tag">' + esc(s) + '</span>';
    }).join('') + '</div>' : '';

    var meta = [];
    if (parent) meta.push('<span class="wb-meta-chip">' + svg(I.branch, 2) + (parent.lane === 'done' ? 'after ' : 'needs ') + parent.id + '</span>');
    if (c.children.length) meta.push('<span class="wb-meta-chip">' + svg(I.split, 2) + c.children.length + '</span>');
    var evN = W.evCount(c);
    if (evN) meta.push('<span class="wb-meta-chip">' + svg(I.file, 2) + evN + '</span>');
    var metaRow = (meta.length && c.lane !== 'progress') ? '<div class="wb-card-meta">' + meta.join('') + '</div>' : '';

    var proc = (c.lane === 'progress') ? (W.worktreeRef(c) + W.logtailHTML(c)) : '';
    var budget = (c.lane === 'progress') ? W.budgetMeter(c) : '';

    var foot;
    if (c.lane === 'progress') {
      var elapsed = c.startedTs ? (now() - c.startedTs) / 1000 : 0;
      foot = '<div class="wb-card-foot">' + W.avatar(c.owner) + '<span class="wb-owner-name">' + esc(c.owner || '\u2014') + '</span>' +
        '<span class="wb-hb">' +
          (stale ? '<span class="wb-stale-tag">stale \u00b7 ' + W.fmtAgo((now() - c.lastBeatTs) / 1000) + '</span>' : '') +
          '<span class="wb-hb-dot"></span>' +
          '<span class="wb-hb-time" data-elapsed="' + c.id + '">' + W.fmtMMSS(elapsed) + '</span>' +
        '</span></div>';
    } else if (c.lane === 'done') {
      foot = '<div class="wb-card-foot">' + W.avatar(c.owner) + '<span class="wb-owner-name">' + esc(c.owner || '\u2014') + '</span>' +
        '<span class="wb-done-tag">' + svg(I.check, 2.2) + (c.archived ? 'archived' : 'shipped') + '</span></div>';
    } else if (c.lane === 'ready') {
      foot = '<div class="wb-card-foot">' +
        (c.suggestAgent ? '<span class="wb-suggest">suggest ' + esc(c.suggestAgent) + '</span>' : '<span class="wb-unclaimed">open to any agent</span>') +
        '<button class="wb-claim-btn" data-claim="' + c.id + '">' + svg(I.user, 2) + 'Claim</button></div>';
    } else if (c.lane === 'blocked') {
      foot = parent ? '<div class="wb-card-foot"><span class="wb-meta-chip">' + svg(I.block, 2) + 'needs ' + parent.id + '</span></div>' : '';
    } else if (c.lane === 'review') {
      foot = '<div class="wb-card-foot">' + W.avatar(c.owner) + '<span class="wb-owner-name">' + esc(c.owner || '\u2014') + '</span>' +
        '<span class="wb-need">' + ((c.attempts && c.attempts.length) ? (c.attempts.length + ' attempt' + (c.attempts.length === 1 ? '' : 's')) : 'ran') + '</span></div>';
    } else if (c.lane === 'scheduled') {
      foot = '<div class="wb-card-foot"><span class="wb-meta-chip">' + svg(I.cal, 2) + esc(c.scheduledFor || 'scheduled') + '</span></div>';
    } else if (c.lane === 'triage') {
      foot = c.source ? '<div class="wb-card-foot"><span class="wb-unclaimed">' + esc(c.source.label) + '</span></div>' : '';
    } else if (c.lane === 'todo') {
      foot = c.parent ? '<div class="wb-card-foot"><span class="wb-unclaimed">for ' + c.parent + '</span></div>' : '';
    } else {
      foot = c.suggestSkill ? '<div class="wb-card-foot"><span class="wb-suggest">' + svg(I.spark, 2) + esc(c.suggestSkill) + '</span></div>' : '';
    }
    return '<article class="' + cls + '" data-card="' + c.id + '" tabindex="0" role="button">' +
      top + title + tags + metaRow + proc + budget + foot + '</article>';
  }

  function renderPager() {
    elPager.innerHTML = W.LANES.map(function (l) {
      var cs = laneCards(l.id);
      var body = cs.length ? cs.map(cardHTML).join('')
        : '<div class="wbm-lane-empty"><span class="le-glyphs" aria-hidden="true">\u00b7 \u02d6 \u00b7</span>' + W.emptyText(l.id) + '</div>';
      return '<section class="wbm-lane-page" data-lane="' + l.id + '">' + body + '</section>';
    }).join('');
    elPager.scrollLeft = laneIndex(curLane) * elPager.clientWidth;
  }

  // pager scroll → active chip
  var scrollT = null;
  elPager.addEventListener('scroll', function () {
    if (scrollT) return;
    scrollT = requestAnimationFrame(function () {
      scrollT = null;
      var i = Math.round(elPager.scrollLeft / Math.max(1, elPager.clientWidth));
      var l = W.LANES[Math.max(0, Math.min(W.LANES.length - 1, i))];
      if (l && l.id !== curLane) {
        curLane = l.id;
        try { localStorage.setItem('wbm-lane', curLane); } catch (er) {}
        syncChips();
      }
    });
  });
  window.addEventListener('resize', function () {
    if (view === 'board') elPager.scrollLeft = laneIndex(curLane) * elPager.clientWidth;
  });

  // ============ LIST VIEW ============
  function listRowHTML(c) {
    return '<button class="wbm-lrow" data-card="' + c.id + '">' +
      '<span class="lr-top"><span class="wb-id">' + c.id + '</span>' + W.prioHTML(c) +
        '<span class="spring"></span>' + W.cardFlag(c) + W.statusChip(c, false) + '</span>' +
      '<span class="lr-title">' + esc(c.title) + '</span>' +
      '<span class="lr-foot">' + W.assigneeCell(c) + '<span class="spring"></span>' +
        c.skills.slice(0, 3).map(function (s) { return '<span class="wb-tag">' + esc(s) + '</span>'; }).join('') + '</span>' +
    '</button>';
  }
  function renderList() {
    elList.innerHTML = W.LANES.map(function (l) {
      var cs = laneCards(l.id);
      var rows = cs.length ? cs.map(listRowHTML).join('')
        : '<div class="wbm-list-empty">' + W.emptyText(l.id) + '</div>';
      return '<section class="wbm-list-sec"><div class="wbm-list-head">' + svg(W.laneIcon(l.id), 2) +
        '<span class="ln">' + l.name + '</span><span class="n">' + cs.length + '</span></div>' + rows + '</section>';
    }).join('');
  }

  function renderBoardOrList() {
    renderLanes();
    if (view === 'board') renderPager(); else renderList();
  }
  function rerender() { renderSub(); renderSwitch(); renderFilters(); renderBoardOrList(); }

  // card taps (pager + list)
  function wireCardTaps(el) {
    el.addEventListener('click', function (e) {
      var claim = e.target.closest('[data-claim]');
      if (claim) { e.stopPropagation(); doAct('claim', claim.dataset.claim); return; }
      var card = e.target.closest('[data-card]');
      if (card) openCard(card.dataset.card);
    });
    el.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.hasAttribute && e.target.hasAttribute('data-card')) {
        e.preventDefault(); openCard(e.target.dataset.card);
      }
    });
  }
  wireCardTaps(elPager);
  wireCardTaps(elList);

  // ============ CARD DETAIL — Dialog Mat sheet ============
  function kv(icon, k, v) {
    if (!v) return '';
    return '<div class="m-kv">' + svg(icon, 2) + '<span class="rk">' + k + '</span><span class="rv">' + v + '</span></div>';
  }
  function sec(label, body, n) {
    if (!body) return '';
    return '<div class="m-sec"><div class="m-eyebrow">' + label + (n ? ' <span class="n">' + n + '</span>' : '') + '</div>' + body + '</div>';
  }
  function ownBlock(c) {
    var stale = W.isStale(c);
    if (c.lane === 'progress') {
      return '<div class="wbm-own">' + W.avatar(c.owner) +
        '<div class="wbm-own-info"><span class="wbm-own-name">' + esc(c.owner) + '</span>' +
        '<span class="wbm-own-sub">' + (stale
          ? 'last heartbeat ' + W.fmtAgo((now() - c.lastBeatTs) / 1000) + ' ago \u00b7 stale'
          : 'heartbeat <span class="alive">' + W.fmtAgo((now() - c.lastBeatTs) / 1000) + ' ago</span> \u00b7 <span data-elapsed-d>' + W.fmtMMSS((now() - c.startedTs) / 1000) + '</span> elapsed') +
        '</span></div></div>';
    }
    if (c.lane === 'done') {
      return '<div class="wbm-own">' + W.avatar(c.owner) + '<div class="wbm-own-info"><span class="wbm-own-name">' + esc(c.owner || 'Unassigned') + '</span><span class="wbm-own-sub">completed \u00b7 verified</span></div></div>';
    }
    if (c.lane === 'ready') {
      return '<div class="wbm-own"><span class="wb-avatar none">?</span><div class="wbm-own-info"><span class="wbm-own-name">Unclaimed</span><span class="wbm-own-sub">' + (c.suggestAgent ? 'suggested \u00b7 ' + esc(c.suggestAgent) : 'open to any agent') + '</span></div></div>';
    }
    return '';
  }
  function depRow(c, role) {
    return '<button class="wbm-dep" data-lane="' + c.lane + '" data-open="' + c.id + '">' +
      '<span class="dep-dot"></span><span class="dep-id">' + c.id + '</span>' +
      '<span class="dep-title">' + esc(c.title) + '</span>' +
      '<span class="dep-state">' + (role === 'parent' ? '\u2191 ' : '') + c.lane + '</span></button>';
  }
  function handoffSec(c) {
    var b = board(), ctx = [];
    ctx.push('repo ' + b.name + ' @ ' + b.branch);
    if (c.workspace) ctx.push('worktree ' + c.workspace);
    ctx.push((c.lane === 'triage' || (c.lane === 'backlog' && !c.specified)) ? 'rough notes \u2014 needs a spec' : 'card spec + notes');
    if (c.parent) ctx.push('parent ' + c.parent + ' for context');
    if (c.children && c.children.length) ctx.push(c.children.length + ' child cards');
    var artN = (c.evidence && (c.evidence.artifacts || []).length) || 0;
    if (artN) ctx.push(artN + ' attachment' + (artN === 1 ? '' : 's'));
    var session = c.session
      ? '<div class="wbm-session"><span class="ss-ic">' + svg(I.link, 2) + '</span><div class="ss-main"><span class="ss-title">' + esc(c.session.title) + '</span><span class="ss-sub">' + esc(c.session.id) + ' \u00b7 ' + c.session.turns + ' turns</span></div><button class="ss-open" data-act="session">Open \u2197</button></div>'
      : '<div class="wbm-dep-note">No session yet \u2014 a fresh chat is created and handed the context below when an agent claims this card.</div>';
    var preview = '<div class="wbm-handoff"><span class="hc-label">' + svg(I.send, 2) + 'Agent receives</span><div class="hc-list">' + ctx.map(function (x) { return '<span class="hc-item">' + esc(x) + '</span>'; }).join('') + '</div></div>';
    return sec('Session &amp; handoff', session + preview);
  }

  // diagnostics tabs
  function evidenceBody(c) {
    var e = c.evidence || {}, rows = '';
    if (e.proof) rows += '<div class="wbm-ev proof">' + svg(I.shield, 2) + '<div class="ev-main"><span class="ev-name">Proof of completion</span><span class="ev-sub">verified \u00b7 green build</span></div></div>';
    (e.artifacts || []).forEach(function (a) {
      rows += '<div class="wbm-ev">' + svg(I.file, 2) + '<div class="ev-main"><span class="ev-name">' + esc(a.name) + '</span><span class="ev-sub">' + esc(a.sub) + '</span></div><span class="ev-size">' + esc(a.size) + '</span></div>';
    });
    (e.runs || []).forEach(function (r) {
      rows += '<div class="wbm-ev">' + svg(I.link, 2) + '<div class="ev-main"><span class="ev-name">' + esc(r.label) + '</span><span class="ev-sub">' + esc(r.sub) + '</span></div></div>';
    });
    return rows || '<div class="wbm-dep-note">No evidence attached yet. Workers attach proof, artifacts and runs as they go.</div>';
  }
  function logsBody(c) {
    var lines = W.logLines(c);
    if (!lines.length) return '<div class="wbm-dep-note">No logs yet.</div>';
    return '<div class="m-well"><div class="m-log">' + lines.map(function (l) { return W.fmtLog(l); }).join('\n') + '</div></div>';
  }
  function attemptsBody(c) {
    var at = c.attempts || [];
    if (!at.length) return '<div class="wbm-dep-note">No attempts recorded \u2014 this card has not run yet.</div>';
    return at.map(function (a) {
      var ic = a.result === 'failed' ? I.xfail : (a.result === 'passed' ? I.check : I.cycle);
      return '<div class="wbm-att ' + a.result + (a.result === 'running' ? ' running' : '') + '">' + svg(ic, 2) +
        '<div class="at-main"><span class="at-name">Attempt ' + a.n + ' \u00b7 ' + a.result + '</span><span class="at-sub">' + esc(a.reason || '') + '</span></div>' +
        '<span class="at-ago">' + W.fmtAgo(a.ago) + ' ago</span></div>';
    }).join('');
  }
  function activityBody(c) {
    var ev = [];
    if (c.createdAgo != null) ev.push({ ago: c.createdAgo, text: 'Card created', ic: I.plus });
    (c.attempts || []).forEach(function (a) { ev.push({ ago: a.ago, text: 'Attempt ' + a.n + ' ' + a.result + (a.reason ? ' \u2014 ' + a.reason : ''), ic: a.result === 'failed' ? I.xfail : (a.result === 'passed' ? I.check : I.cycle) }); });
    (c.comments || []).forEach(function (cm) { ev.push({ ago: cm.ago, text: (cm.who === 'you' ? 'You' : cm.who) + ' commented', ic: I.send }); });
    if (c.lane === 'review') ev.push({ ago: c.updatedAgo != null ? c.updatedAgo : 0, text: 'Opened for review', ic: I.eye });
    if (c.lane === 'done') ev.push({ ago: c.updatedAgo != null ? c.updatedAgo : 0, text: 'Shipped \u00b7 merged green', ic: I.check });
    ev.sort(function (a, b) { return a.ago - b.ago; });
    if (!ev.length) return '<div class="wbm-dep-note">No activity yet.</div>';
    return ev.map(function (e) {
      return '<div class="wbm-tl-row"><span class="tl-ic">' + svg(e.ic, 2) + '</span><span class="tl-text">' + esc(e.text) + '</span><span class="tl-ago">' + W.fmtAgo(e.ago) + ' ago</span></div>';
    }).join('');
  }
  function commentsBody(c) {
    var comm = (c.comments || []).map(function (cm) {
      var human = cm.who === 'you';
      return '<div class="wbm-cmt">' + (human ? '<span class="wb-avatar" style="background:#666">Y</span>' : W.avatar(cm.who)) +
        '<div class="wbm-cmt-b"><div class="wbm-cmt-h"><span class="who">' + (human ? 'You' : esc(cm.who)) + '</span><span class="when">' + W.fmtAgo(cm.ago) + ' ago</span></div>' +
        '<div class="wbm-cmt-t">' + W.linkify(esc(cm.text)) + '</div></div></div>';
    }).join('');
    return (comm || '<div class="wbm-dep-note">No comments yet.</div>') +
      '<div class="wbm-cmt-box"><textarea id="wbmCmtInput" rows="1" placeholder="Comment, or @mention an agent\u2026"></textarea>' +
      '<button class="wbm-cmt-send" id="wbmCmtSend" aria-label="Send comment">' + svg(I.send, 2) + '</button></div>';
  }
  function tabBody(c) {
    if (detailTab === 'logs') return logsBody(c);
    if (detailTab === 'attempts') return attemptsBody(c);
    if (detailTab === 'activity') return activityBody(c);
    if (detailTab === 'comments') return commentsBody(c);
    return evidenceBody(c);
  }
  function tabsSec(c) {
    var evN = W.evCount(c) - W.logLines(c).length + ((c.evidence && c.evidence.proof) ? 0 : 0);
    var tabs = [
      { id: 'evidence', label: 'Evidence' },
      { id: 'logs', label: 'Logs', n: W.logLines(c).length },
      { id: 'attempts', label: 'Attempts', n: (c.attempts || []).length },
      { id: 'activity', label: 'Activity' },
      { id: 'comments', label: 'Comments', n: (c.comments || []).length }
    ];
    var bar = '<div class="wbm-tabs">' + tabs.map(function (t) {
      return '<button class="wbm-tab' + (detailTab === t.id ? ' on' : '') + '" data-tab="' + t.id + '">' + t.label + (t.n ? '<span class="tab-n">' + t.n + '</span>' : '') + '</button>';
    }).join('') + '</div>';
    return '<div class="m-sec"><div class="m-eyebrow">Diagnostics</div>' + bar + '<div class="wbm-tab-body">' + tabBody(c) + '</div></div>';
  }

  // per-lane actions on the mat (mirrors the desktop drawer foot)
  function footActions(c) {
    var a = [];
    function btn(act, icon, label, cls) {
      return '<button class="m-act ' + (cls || '') + '" data-act="' + act + '">' + svg(icon, 2) + label + '</button>';
    }
    if (c.archived) a.push(btn('unarchive', I.arch, 'Restore', 'go'));
    else if (c.lane === 'triage') { a.push(btn('move:backlog', I.check, 'Accept', 'go')); a.push(btn('move:scheduled', I.cal, 'Schedule')); a.push(btn('dismiss', I.close, 'Dismiss', 'danger')); }
    else if (c.lane === 'backlog') {
      if (!c.specified) a.push(btn('specify', I.check, 'Specify', 'go'));
      else a.push(btn('move:ready', I.check, 'Mark ready', 'go'));
      a.push(btn('move:todo', I.circle, 'To do'));
    }
    else if (c.lane === 'todo') { a.push(btn('move:ready', I.check, 'Mark ready', 'go')); a.push(btn('move:scheduled', I.cal, 'Schedule')); a.push(btn('block', I.block, 'Block')); }
    else if (c.lane === 'scheduled') { a.push(btn('move:ready', I.play, 'Make ready now', 'go')); a.push(btn('reschedule', I.cal, 'Reschedule')); }
    else if (c.lane === 'ready') { a.push(btn('claim', I.user, 'Claim', 'go')); a.push(btn('move:scheduled', I.cal, 'Schedule')); a.push(btn('block', I.block, 'Block')); }
    else if (c.lane === 'progress') { a.push(btn('move:review', I.eye, 'Send to review', 'go')); a.push(btn('complete', I.check, 'Complete')); a.push(btn('release', I.block, 'Release')); }
    else if (c.lane === 'review') { a.push(btn('complete', I.check, 'Approve \u2192 Done', 'go')); a.push(btn('changes', I.block, 'Request changes')); a.push(btn('rerun', I.cycle, 'Re-run')); }
    else if (c.lane === 'blocked') {
      var p = W.depParent(c);
      if (!p || p.lane === 'done') a.push(btn('move:ready', I.cycle, 'Promote to ready', 'go'));
      a.push(btn('move:todo', I.block, 'Unblock'));
    }
    else if (c.lane === 'done') a.push(btn('archive', I.arch, 'Archive', 'danger'));
    a.push(btn('watch', I.eye, 'Watch', 'quiet'));
    return a.join('');
  }

  function openCard(id) {
    var c = W.cardById(id); if (!c) return;
    if (detailId !== id) detailTab = 'evidence';
    detailId = id;
    var s = W.statusMeta(c);
    var badgeState = s.tone === 'live' ? 'running' : (s.tone === 'warn' ? 'failing' : (c.lane === 'done' ? 'done' : 'muted'));
    var parent = W.depParent(c);
    var kids = c.children.map(W.cardById).filter(Boolean);

    var kvs = '<div class="m-kvs">' +
      kv(I.shield, 'Priority', 'P' + c.prio + (c.prio === 0 ? ' \u00b7 highest' : '')) +
      kv(I.spark, 'Skills', c.skills.length ? esc(c.skills.join(', ')) : (c.suggestSkill ? esc(c.suggestSkill) + ' (suggested)' : '\u2014')) +
      (c.workspace ? kv(I.folder, 'Worktree', '<span class="mono">' + esc(c.workspace) + '</span>') : '') +
      (c.retries ? kv(I.cycle, 'Retries', c.retries[0] + ' / ' + c.retries[1]) : '') +
      (c.budget && c.lane === 'progress' ? kv(I.clock, 'Runtime', c.budget[0].toFixed(1) + ' / ' + c.budget[1] + 'm') : '') +
      (c.scheduledFor ? kv(I.cal, 'Scheduled', esc(c.scheduledFor)) : '') +
      (c.source ? kv(I.inbox, 'Source', esc(c.source.label)) : '') +
    '</div>';

    var depRows = '';
    if (parent) depRows += depRow(parent, 'parent');
    kids.forEach(function (k) { depRows += depRow(k, 'child'); });
    var depNote = '';
    if (parent && parent.lane !== 'done') depNote = '<div class="wbm-dep-note">Stays ' + (c.lane === 'blocked' ? 'blocked' : 'gated') + ' until ' + parent.id + ' completes.</div>';
    else if (parent && parent.lane === 'done' && c.lane === 'blocked') depNote = '<div class="wbm-dep-note">' + parent.id + ' is complete \u2014 this card is ready to promote.</div>';
    var depSec = (depRows || depNote) ? sec('Dependencies', '<div class="wbm-deps">' + depRows + '</div>' + depNote) : '';

    var vSec = c.violations.length ? sec('Protocol violations', c.violations.map(function (v) {
      return '<div class="wbm-viol">' + svg(I.shield, 2) + esc(v) + '</div>';
    }).join('')) : '';

    var b = board();
    sheet.open(
      '<div class="m-frame-lbl">' + esc(b.name) + ' @ ' + esc(b.branch) + '</div>' +
      '<div class="m-sheet-scroll"><div class="m-panel">' +
        '<div class="m-panel-head"><span class="m-jid">' + c.id + '</span>' + W.prioHTML(c) +
          '<span class="spring"></span><span class="m-badge" data-state="' + badgeState + '"><span class="b-dot"></span>' + esc(W.laneName(c.lane)) + '</span></div>' +
        '<div class="m-panel-title">' + esc(c.title) + '</div>' +
        (c.desc ? '<div class="m-panel-desc">' + esc(c.desc) + '</div>' : '') +
        ownBlock(c) +
        sec('Routing', kvs) +
        handoffSec(c) +
        depSec + vSec +
        tabsSec(c) +
      '</div></div>' +
      '<div class="m-acts">' + footActions(c) + '</div>'
    );
    wireDetail(c);
  }
  function wireDetail(c) {
    var el = sheet.el;
    el.onclick = function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) { detailTab = t.dataset.tab; openCard(c.id); return; }
      var dep = e.target.closest('[data-open]');
      if (dep) { openCard(dep.dataset.open); return; }
      var act = e.target.closest('[data-act]');
      if (act) {
        if (act.dataset.act === 'session') { toast(svg(I.link), 'handing off to session <b>' + esc(c.session.id) + '</b>'); return; }
        doAct(act.dataset.act, c.id);
        return;
      }
      if (e.target.closest('#wbmCmtSend')) sendComment(c);
    };
    var ci = el.querySelector('#wbmCmtInput');
    if (ci) {
      ci.addEventListener('input', function () {
        ci.style.height = 'auto'; ci.style.height = Math.min(ci.scrollHeight, 90) + 'px';
        var cs = el.querySelector('#wbmCmtSend');
        if (cs) cs.classList.toggle('ready', ci.value.trim().length > 0);
      });
      ci.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(c); } });
    }
  }
  function sendComment(c) {
    var ci = sheet.el.querySelector('#wbmCmtInput');
    if (!ci) return;
    var v = ci.value.trim(); if (!v) return;
    c.comments.push({ who: 'you', ago: 0, text: v });
    detailTab = 'comments';
    openCard(c.id);
    toast(svg(I.send), 'comment posted on <b>' + c.id + '</b>', true);
  }

  // ============ ACTIONS ============
  var AGENT_KEYS = Object.keys(W.AGENTS);
  function pickAgent(c) { return c.suggestAgent || AGENT_KEYS[Math.floor(Math.random() * AGENT_KEYS.length)]; }
  function startCard(c, owner) {
    c.lane = 'progress';
    c.owner = owner || c.owner || pickAgent(c);
    c.startedTs = now(); c.lastBeatTs = now();
    if (!c.budget) c.budget = [0.1, 8];
    if (!c.workspace) c.workspace = 'eclipse/' + c.id.toLowerCase();
  }
  function doAct(act, id) {
    var c = W.cardById(id); if (!c) return;
    var reopen = true;
    if (act.indexOf('move:') === 0) {
      var lane = act.slice(5);
      if (lane === 'scheduled' && !c.scheduledFor) c.scheduledFor = 'Tomorrow 09:00';
      c.lane = lane;
      toast(svg(I.check), '<b>' + c.id + '</b> \u2192 ' + esc(W.laneName(lane)), true);
    }
    else if (act === 'claim') { startCard(c); toast(svg(I.user), '<b>' + esc(c.owner) + '</b> claimed <b>' + c.id + '</b>', true); }
    else if (act === 'rerun' || act === 'changes') {
      startCard(c, c.owner);
      toast(svg(I.cycle), '<b>' + c.id + '</b> \u00b7 ' + (act === 'changes' ? 'changes requested \u2014 re-running' : 're-running'));
    }
    else if (act === 'complete') { c.lane = 'done'; (c.evidence = c.evidence || {}).proof = true; toast(svg(I.check), '<b>' + c.id + '</b> \u00b7 shipped', true); }
    else if (act === 'specify') { c.specified = true; toast(svg(I.check), '<b>' + c.id + '</b> \u00b7 specified \u2014 ready to promote', true); }
    else if (act === 'block') { c.lane = 'blocked'; toast(svg(I.block), '<b>' + c.id + '</b> \u00b7 blocked'); }
    else if (act === 'release') { c.owner = null; c.lane = 'ready'; toast(svg(I.cycle), '<b>' + c.id + '</b> \u00b7 released back to ready'); }
    else if (act === 'dismiss' || act === 'archive') { c.archived = true; toast(svg(I.arch), '<b>' + c.id + '</b> \u00b7 archived'); reopen = false; }
    else if (act === 'unarchive') { c.archived = false; toast(svg(I.arch), '<b>' + c.id + '</b> \u00b7 restored', true); }
    else if (act === 'reschedule') { c.scheduledFor = ['In 1h', 'Tonight 02:00', 'Tomorrow 09:00', 'Next window'][Math.floor(Math.random() * 4)]; toast(svg(I.cal), '<b>' + c.id + '</b> \u00b7 ' + esc(c.scheduledFor)); }
    else if (act === 'watch') { toast(svg(I.eye), 'watching <b>' + c.id + '</b>'); reopen = false; sheet.close(); }
    c.updatedAgo = 0;
    rerender();
    if (reopen && detailId === id) openCard(id); else if (!reopen) sheet.close();
  }

  // ============ BOARD SWITCHER ============
  elSwitch.addEventListener('click', function () {
    var rows = Object.keys(W.BOARDS).map(function (k) {
      var b = W.BOARDS[k];
      var n = b.cards.filter(function (c) { return !c.hidden && !c.archived; }).length;
      return '<button class="m-row" data-board="' + k + '"><span class="r-ic">' + svg(I.folder, 2) + '</span>' +
        '<span class="r-main"><span class="r-title">' + esc(b.name) + '</span><span class="r-sub">' + esc(b.branch) + '</span></span>' +
        '<span class="r-side">' + n + ' cards</span>' + (k === curBoard ? svg(I.check, 2) : '') + '</button>';
    }).join('');
    sheet.open('<div class="wbm-sheet-h"><span class="t">Boards</span></div>' +
      '<div class="m-sheet-scroll"><div class="m-panel" style="padding:7px"><div class="m-rows" style="padding:0">' + rows + '</div></div></div>');
    sheet.el.onclick = function (e) {
      var row = e.target.closest('[data-board]'); if (!row) return;
      sheet.el.onclick = null;
      curBoard = row.dataset.board;
      try { localStorage.setItem('sb-wb-board', curBoard); } catch (er) {}
      sheet.close();
      rerender();
      toast(svg(I.folder), 'switched to <b>' + esc(board().name) + '</b>');
    };
  });

  // ============ NOTIFICATIONS ============
  $('wbmBell').addEventListener('click', function () {
    var rows = W.NOTIFS.map(function (n) {
      return '<button class="m-row wbm-nrow' + (n.read ? ' read' : '') + '" data-notif="' + n.id + '"' + (n.card ? ' data-opencard="' + n.card + '"' : '') + '>' +
        '<span class="r-dot"></span>' +
        '<span class="r-main"><span class="r-title">' + n.text + '</span></span>' +
        '<span class="r-side">' + W.fmtAgo(n.ago) + '</span></button>';
    }).join('');
    sheet.open('<div class="wbm-sheet-h"><span class="t">Notifications</span><span class="spring"></span><button class="wbm-mini" id="wbmReadAll">Mark all read</button></div>' +
      '<div class="m-sheet-scroll"><div class="m-panel" style="padding:7px"><div class="m-rows" style="padding:0">' + rows + '</div></div></div>');
    sheet.el.onclick = function (e) {
      if (e.target.closest('#wbmReadAll')) {
        W.NOTIFS.forEach(function (n) { n.read = true; });
        sheet.el.querySelectorAll('.wbm-nrow').forEach(function (r) { r.classList.add('read'); });
        renderSub();
        return;
      }
      var row = e.target.closest('[data-notif]'); if (!row) return;
      var n = W.NOTIFS.filter(function (x) { return x.id === row.dataset.notif; })[0];
      if (n) { n.read = true; renderSub(); }
      if (row.dataset.opencard && W.cardById(row.dataset.opencard)) {
        sheet.el.onclick = null;
        openCard(row.dataset.opencard);
      } else {
        row.classList.add('read');
      }
    };
  });

  // ============ DISPATCH ============
  $('wbmDispatch').addEventListener('click', function () {
    var ready = laneCards('ready');
    var rows = ready.length ? ready.map(function (c) {
      return '<div class="wbm-disp-row"><span class="di-id">' + c.id + '</span><span class="di-title">' + esc(c.title) + '</span><span class="di-agent">\u2192 ' + esc(c.suggestAgent || 'any agent') + '</span></div>';
    }).join('') : '<div class="wbm-dep-note">No cards ready to claim \u2014 the dispatcher has nothing to do.</div>';
    sheet.open(
      '<div class="m-frame-lbl">Dispatcher</div>' +
      '<div class="m-sheet-scroll"><div class="m-panel">' +
        '<div class="m-panel-head"><span class="m-jid"><span class="wbm-disp-prompt">&gt;_</span></span><span class="spring"></span>' +
          '<span class="m-badge"' + (autoDispatch ? ' data-state="running"' : '') + '><span class="b-dot"></span>' + (autoDispatch ? 'auto' : 'manual') + '</span></div>' +
        '<div class="m-panel-title">Dispatch ready work</div>' +
        '<div class="m-panel-desc">Assigns every ready card to its suggested agent and starts the runs.</div>' +
        '<div class="m-sec"><div class="m-eyebrow">Ready <span class="n">' + ready.length + '</span></div>' + rows + '</div>' +
        '<div class="m-sec"><div class="wbm-auto-row"><span class="au-main"><span>Auto-dispatch</span><span class="au-sub">claim ready cards as they appear</span></span>' +
          '<button class="m-tgl" id="wbmAutoTgl" role="switch" aria-checked="' + autoDispatch + '"></button></div></div>' +
      '</div></div>' +
      '<div class="m-acts">' +
        '<button class="m-act go" data-dispatch="1"' + (ready.length ? '' : ' disabled') + '>' + svg(I.cycle, 2) + 'Dispatch ' + (ready.length || 'ready') + (ready.length ? (ready.length === 1 ? ' card' : ' cards') : ' work') + '</button>' +
      '</div>'
    );
    sheet.el.onclick = function (e) {
      var tgl = e.target.closest('#wbmAutoTgl');
      if (tgl) {
        autoDispatch = !autoDispatch;
        tgl.setAttribute('aria-checked', autoDispatch);
        var badge = sheet.el.querySelector('.m-badge');
        if (badge) { badge.toggleAttribute && null; badge.outerHTML = '<span class="m-badge"' + (autoDispatch ? ' data-state="running"' : '') + '><span class="b-dot"></span>' + (autoDispatch ? 'auto' : 'manual') + '</span>'; }
        return;
      }
      if (e.target.closest('[data-dispatch]')) {
        sheet.el.onclick = null;
        var ready2 = laneCards('ready');
        ready2.forEach(function (c) { startCard(c); });
        sheet.close();
        rerender();
        toast(svg(I.cycle), 'dispatched <b>' + ready2.length + '</b> card' + (ready2.length === 1 ? '' : 's'), true);
      }
    };
  });

  // ============ NEW CARD ============
  $('wbmFab').innerHTML = svg(I.plus, 2);
  $('wbmFab').addEventListener('click', function () {
    var form = { prio: 1, lane: 'backlog' };
    sheet.open(
      '<div class="m-frame-lbl">New card</div>' +
      '<div class="m-sheet-scroll"><div class="m-panel">' +
        '<div class="m-field"><span class="m-flabel">Title</span><input class="m-input" id="wbmNewTitle" type="text" placeholder="What needs doing"></div>' +
        '<div class="m-field"><span class="m-flabel">Notes</span><textarea class="m-input m-ta" id="wbmNewDesc" placeholder="Context the agent will need \u2014 links, constraints, definition of done."></textarea></div>' +
        '<div class="m-field"><span class="m-flabel">Priority</span><div class="m-pick" id="wbmNewPrio">' +
          [0, 1, 2].map(function (p) { return '<button class="m-pick-opt' + (form.prio === p ? ' on' : '') + '" data-p="' + p + '">P' + p + ' \u00b7 ' + ['high', 'med', 'low'][p] + '</button>'; }).join('') +
        '</div></div>' +
        '<div class="m-field"><span class="m-flabel">Lane</span><div class="m-pick" id="wbmNewLane">' +
          [['triage', 'Triage'], ['backlog', 'Backlog'], ['todo', 'To do'], ['ready', 'Ready']].map(function (l) {
            return '<button class="m-pick-opt' + (form.lane === l[0] ? ' on' : '') + '" data-l="' + l[0] + '">' + l[1] + '</button>';
          }).join('') +
        '</div></div>' +
      '</div></div>' +
      '<div class="m-acts"><button class="m-act go" data-create="1">' + svg(I.plus, 2) + 'Add card</button></div>'
    );
    setTimeout(function () { var t = $('wbmNewTitle'); if (t) t.focus(); }, 380);
    sheet.el.onclick = function (e) {
      var opt = e.target.closest('.m-pick-opt');
      if (opt) {
        var wrap = opt.parentElement;
        wrap.querySelectorAll('.m-pick-opt').forEach(function (b) { b.classList.toggle('on', b === opt); });
        if (wrap.id === 'wbmNewPrio') form.prio = parseInt(opt.dataset.p, 10);
        if (wrap.id === 'wbmNewLane') form.lane = opt.dataset.l;
        return;
      }
      if (!e.target.closest('[data-create]')) return;
      var ti = $('wbmNewTitle'), title = ti.value.trim();
      if (!title) { ti.classList.add('err'); ti.focus(); setTimeout(function () { ti.classList.remove('err'); }, 500); return; }
      sheet.el.onclick = null;
      var id = 'SB-' + (nextId++);
      board().cards.unshift({
        id: id, title: title, lane: form.lane, prio: form.prio,
        desc: $('wbmNewDesc').value.trim(), skills: [], children: [], comments: [],
        evidence: {}, violations: [], createdAgo: 0, updatedAgo: 0,
        specified: form.lane === 'ready',
        source: { kind: 'manual', label: 'Filed by you \u00b7 mobile' }
      });
      sheet.close();
      curLane = form.lane;
      try { localStorage.setItem('wbm-lane', curLane); } catch (er) {}
      rerender();
      toast(svg(I.plus, 2), '<b>' + id + '</b> \u00b7 added to ' + esc(W.laneName(form.lane)), true);
    };
  });

  // ============ LIVE TICK ============
  var tickN = 0;
  setInterval(function () {
    tickN++;
    var anyLive = false;
    allCards().forEach(function (c) {
      if (c.lane !== 'progress') return;
      anyLive = true;
      if (!W.isStale(c) && (now() - c.lastBeatTs) / 1000 > 11) c.lastBeatTs = now();
      if (c.startedTs) {
        document.querySelectorAll('[data-elapsed="' + c.id + '"]').forEach(function (el) {
          el.textContent = W.fmtMMSS((now() - c.startedTs) / 1000);
        });
        if (c.budget) c.budget[0] = Math.round((c.budget[0] + 1 / 60) * 100) / 100;
      }
    });
    // auto-dispatch pass
    if (autoDispatch && tickN % 6 === 0) {
      var ready = laneCards('ready');
      if (ready.length) {
        startCard(ready[0]);
        rerender();
        toast(svg(I.cycle), 'auto-dispatched <b>' + ready[0].id + '</b> \u2192 ' + esc(ready[0].owner), true);
        return;
      }
    }
    var d = sheet.el.querySelector('[data-elapsed-d]');
    if (d && detailId) { var c2 = W.cardById(detailId); if (c2 && c2.startedTs) d.textContent = W.fmtMMSS((now() - c2.startedTs) / 1000); }
    if (anyLive && tickN % 20 === 0 && view === 'board' && !sheet.isOpen()) renderPager();
  }, 1000);

  // ============ FIRST RENDER ============
  applyView(false);
  rerender();
  window.addEventListener('resize', function () { M.segThumb(elSeg, false); });
})();
