/* ============================================================
   ECLIPSE OS — WORKBOARD  (vanilla, data-driven)
   An agentic task board: cards flow through lanes, agents claim
   and heartbeat work, a dispatcher promotes / reclaims / blocks,
   cards decompose into children, and evidence accrues per card.
   ============================================================ */
(function () {
  "use strict";
  // root may be absent (the mobile surface loads this module for its data +
  // status model only) — everything up to the WB_CORE export below is DOM-free;
  // the export is followed by a bail-out before any desktop wiring runs.
  var root = document.getElementById('workboardView');

  var STALE = 300; // seconds before a heartbeat is "stale"
  var LANES = [
    { id: 'triage',    name: 'Triage' },
    { id: 'backlog',   name: 'Backlog' },
    { id: 'todo',      name: 'To do' },
    { id: 'scheduled', name: 'Scheduled' },
    { id: 'ready',     name: 'Ready' },
    { id: 'progress',  name: 'Running' },
    { id: 'review',    name: 'Review' },
    { id: 'blocked',   name: 'Blocked' },
    { id: 'done',      name: 'Done' }
  ];

  var AGENTS = {
    Mencius:   { c: '#e0a06a' }, Arendt:  { c: '#c2603f' },
    Descartes: { c: '#5b8dc9' }, Kepler:  { c: '#6fae84' },
    Confucius: { c: '#b57fc9' }, Spinoza: { c: '#d2645f' }
  };

  // ---- icons (host recipe: 24-box, currentColor, 2) ----
  var I = {
    chev:  'M7 9.3 12 14.2l5-4.9',
    dots:  'M5.2 12h.01 M12 12h.01 M18.8 12h.01',
    plus:  'M12 4.2v15.6 M4.2 12h15.6',
    close: 'M6.4 6.4 17.6 17.6 M17.6 6.4 6.4 17.6',
    check: 'M5 12.5 10 17.5 19 6.5',
    cycle: 'M4.4 12a7.6 7.6 0 0 1 13-5.4L19.9 9 M20 4.4V9h-4.6 M19.6 12a7.6 7.6 0 0 1-13 5.4L4.1 15 M4 19.6V15h4.6',
    bell:  'M6.4 10.4a5.6 5.6 0 0 1 11.2 0c0 3.9 1.2 5.5 1.8 6.2H4.6c.6-.7 1.8-2.3 1.8-6.2Z M10 19.6a2.2 2.2 0 0 0 4 0',
    block: 'M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z M5.8 5.8l12.4 12.4',
    branch:'M6.1 5a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z M17.9 14.2a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z M6.1 14.2a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z M6.1 9.8v4.4 M8.5 7.4h3.2a3.5 3.5 0 0 1 3.5 3.5v.3a3.3 3.3 0 0 0 2.8 3.3',
    file:  'M13.6 3.6H7.5A2.3 2.3 0 0 0 5.2 5.9v12.2a2.3 2.3 0 0 0 2.3 2.3h9a2.3 2.3 0 0 0 2.3-2.3V8.8L13.6 3.6Z M13.6 3.6v5.2h5.2',
    term:  'M3 7.8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8.4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7.8Z M7 9.6l2.8 2.4L7 14.4 M12.4 14.6h4.6',
    link:  'M9.8 14.2l4.4-4.4 M8.6 11.2 6.9 12.9a3.3 3.3 0 0 0 4.7 4.7l1.7-1.7 M15.4 12.8l1.7-1.7a3.3 3.3 0 0 0-4.7-4.7l-1.7 1.7',
    clock: 'M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z M12 7.6V12l3.2 1.9',
    spark: 'M12 3.4 13.7 9.1 19.4 10.8 13.7 12.5 12 18.2 10.3 12.5 4.6 10.8 10.3 9.1 12 3.4Z',
    user:  'M12 4.2a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z M5.2 19.8a6.8 6.8 0 0 1 13.6 0',
    folder:'M3.2 8.2A2.6 2.6 0 0 1 5.8 5.6h3.5l2.2 2.3h6.7A2.6 2.6 0 0 1 20.8 10.5v5.5a2.6 2.6 0 0 1-2.6 2.6H5.8a2.6 2.6 0 0 1-2.6-2.6V8.2Z',
    arch:  'M4 6.8h16 M5.4 6.8v11a2.2 2.2 0 0 0 2.2 2.2h8.8a2.2 2.2 0 0 0 2.2-2.2v-11 M4.4 6.8 5.6 4.4h12.8l1.2 2.4 M9.8 11.4h4.4',
    eye:   'M2.8 12S6 6.4 12 6.4 21.2 12 21.2 12 18 17.6 12 17.6 2.8 12 2.8 12Z M12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z',
    split: 'M6 4.5v6.2a3 3 0 0 0 3 3h6 M12 9.5l4 4-4 4 M6 4.5a1.4 1.4 0 1 0 0 .1Z',
    send:  'M12 19.4V5.2 M5.8 11.4 12 5.2l6.2 6.2',
    shield:'M12 3 19.6 5.9v5.3c0 4.7-2.9 8-7.6 9.8-4.7-1.8-7.6-5.1-7.6-9.8V5.9L12 3Z M8.4 12.3l2.5 2.5 4.7-5.2',
    search:'M11.2 4.2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z M16.4 16.4 20.6 20.6',
    inbox:'M3.4 12.6 6 6.3a1.8 1.8 0 0 1 1.7-1.1h8.6a1.8 1.8 0 0 1 1.7 1.1l2.6 6.3 M3.4 12.6v4.6a2.2 2.2 0 0 0 2.2 2.2h12.8a2.2 2.2 0 0 0 2.2-2.2v-4.6 M3.4 12.6h4.4l1.2 2.3h6l1.2-2.3h4.4',
    circle:'M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Z',
    play:'M8.8 5.6 18.2 12l-9.4 6.4Z',
    cal:'M5.2 5.8h13.6a2.2 2.2 0 0 1 2.2 2.2v10.2a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 18.2V8a2.2 2.2 0 0 1 2.2-2.2Z M3.4 10h17.2 M8 3.6v3.2 M16 3.6v3.2',
    dot:'M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z',
    xfail:'M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z M9.2 9.2l5.6 5.6 M14.8 9.2l-5.6 5.6',
    flag:'M6.4 20.6V4.2 M6.4 4.8h9.4l-1.7 3.2 1.7 3.2H6.4',
    cols:'M5 4.4h4.2v15.2H5Z M14.8 4.4H19v15.2h-4.2Z',
    rows:'M4.4 6.4h15.2 M4.4 12h15.2 M4.4 17.6h15.2',
    grid:'M4.4 4.4h6.4v6.4H4.4Z M13.2 4.4h6.4v6.4h-6.4Z M4.4 13.2h6.4v6.4H4.4Z M13.2 13.2h6.4v6.4h-6.4Z'
  };
  function svg(d, sw) {
    var p = d.split(' M').map(function (s, i) { return '<path d="' + (i ? 'M' + s : s) + '"/>'; }).join('');
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) +
      '" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }
  function avatar(agent, cls) {
    var a = AGENTS[agent];
    return '<span class="wb-avatar ' + (cls || '') + '" style="background:' + (a ? a.c : '#888') + '">' +
      (agent ? agent[0] : '?') + '</span>';
  }
  function esc(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function fmtMMSS(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function fmtAgo(sec) {
    sec = Math.floor(sec);
    if (sec < 60) return sec + 's';
    if (sec < 3600) return Math.floor(sec / 60) + 'm';
    return Math.floor(sec / 3600) + 'h';
  }
  var now = function () { return Date.now(); };

  // ============ SEED DATA ============
  var nextId = 260;
  function mkCard(o) {
    o.skills = o.skills || [];
    o.children = o.children || [];
    o.comments = o.comments || [];
    o.evidence = o.evidence || {};
    o.violations = o.violations || [];
    if (o.lane === 'progress') {
      if (o.startedAgo != null) o.startedTs = now() - o.startedAgo * 1000;
      o.lastBeatTs = now() - (o.beatAgo != null ? o.beatAgo : 5) * 1000;
    }
    return o;
  }

  var BOARDS = {
    'shared-brain': {
      name: 'shared-brain', branch: 'main', throughput: 7,
      cards: [
        // ---- backlog ----
        mkCard({ id: 'SB-251', title: 'Add a keyboard-shortcuts overlay', lane: 'backlog', prio: 2, skills: ['frontend'],
          desc: 'A press-and-hold or ⌘/ overlay listing every shortcut. Rough idea — needs a spec and a decomposition pass before it can be claimed.' }),
        mkCard({ id: 'SB-250', title: 'Set up a benchmark branch for the mobile PWA', lane: 'backlog', prio: 0, skills: ['infra'],
          desc: 'Cut a benchmark branch off main and wire CI so the mobile PWA gets Lighthouse numbers per push.', suggestSkill: 'infra' }),
        mkCard({ id: 'SB-247', title: 'Document the icon construction recipe', lane: 'backlog', prio: 2, skills: ['docs'],
          desc: 'Lift the in-repo icon guide into the design-system docs so new icons follow the same 24-box recipe.' }),
        // ---- ready ----
        mkCard({ id: 'SB-248', title: 'Tighten the footer pill truncation order', lane: 'ready', prio: 1, skills: ['frontend'], specified: true,
          desc: 'Define an explicit shrink-priority so Remote collapses first and the branch label holds out longest.' }),
        mkCard({ id: 'SB-246', title: 'Add a reduced-motion fallback for the wordmark caret', lane: 'ready', prio: 1, skills: ['a11y'], specified: true, suggestAgent: 'Kepler',
          desc: 'Under prefers-reduced-motion the caret should rest solid instead of blinking. Mirror the pattern used elsewhere.' }),
        mkCard({ id: 'SB-249', title: 'Profile the moon raytracer on 4K displays', lane: 'ready', prio: 1, skills: ['perf'], specified: true,
          desc: 'Frame times climb on large viewports — capture a profile and find the hot path in the per-pixel loop.',
          evidence: { artifacts: [{ name: 'moon-4k.cpuprofile', sub: 'attached by you', size: '2.1 MB' }] } }),
        // ---- in progress ----
        mkCard({ id: 'SB-242', title: 'Wire the environment side panel', lane: 'progress', prio: 0, skills: ['frontend'], owner: 'Kepler',
          startedAgo: 251, beatAgo: 6, budget: [4.2, 8], retries: [1, 2], workspace: 'eclipse/env-panel',
          session: { id: 'chat-7f3a', title: 'env panel build', turns: 24 }, source: { kind: 'card', label: 'Claimed from ready' }, createdAgo: 5200, updatedAgo: 6,
          attempts: [{ n: 1, result: 'failed', reason: 'lint failed on env-panel.css', ago: 300 }, { n: 2, result: 'running', reason: 'retry in progress', ago: 6 }],
          desc: 'Build the floating environment panel: changes, remote, branch, progress, subagents, sources. Slide-and-scale in from the top-right.',
          evidence: { logs: ['[16:51:08] claimed by Kepler\n[16:51:09] worktree eclipse/env-panel ready\n[16:53:30] wrote env-panel.css (+218)\n[16:55:12] heartbeat ok'] },
          comments: [{ who: 'Kepler', ago: 320, text: 'Panel scaffold is up. Wiring the open/close transition next — tracked separately in SB-243.' }] }),
        mkCard({ id: 'SB-239', title: 'Tune the ASCII starfield twinkle timing', lane: 'progress', prio: 2, skills: ['frontend'], owner: 'Arendt',
          startedAgo: 1340, beatAgo: 552, budget: [5.1, 9], retries: [1, 2], workspace: 'eclipse/starfield',
          desc: 'Spread the 24 glyphs across 3.5–8.5s twinkle cycles so the field never pulses in unison.',
          evidence: { logs: ['[16:34:02] claimed by Arendt\n[16:39:50] last heartbeat\n[16:39:50] — worker went quiet —'] } }),
        mkCard({ id: 'SB-236', title: 'Migrate theme tokens to CSS layers', lane: 'progress', prio: 1, skills: ['frontend', 'refactor'], owner: 'Confucius',
          startedAgo: 2460, beatAgo: 40, budget: [12.4, 12], retries: [2, 2], workspace: 'eclipse/css-layers',
          source: { kind: 'manual', label: 'Filed by you' }, createdAgo: 8000, updatedAgo: 40,
          attempts: [{ n: 1, result: 'failed', reason: 'lint failure', ago: 600 }, { n: 2, result: 'failed', reason: 'lint failure (retry 2/2)', ago: 120 }],
          desc: 'Move the three-theme token blocks into @layer so overrides stop fighting specificity. Large surface area.',
          violations: ['Edited files outside the assigned worktree (tokens/spacing.css).'],
          evidence: { logs: ['[16:12:40] claimed by Confucius\n[16:48:31] retry 2/2 after lint failure\n[16:53:55] still running — 41m elapsed'] } }),
        // ---- blocked ----
        mkCard({ id: 'SB-243', title: 'Polish the env-panel open / close transition', lane: 'blocked', prio: 1, skills: ['frontend'], parent: 'SB-241',
          desc: 'Slide + scale from the top-right corner with the house easing; honor reduced-motion with a plain fade.' }),
        mkCard({ id: 'SB-245', title: 'Final review and summarize the session', lane: 'blocked', prio: 1, skills: ['review'], parent: 'SB-243',
          desc: 'Read the diff end-to-end, confirm every progress item is checked, and write the wrap-up summary.' }),
        mkCard({ id: 'SB-234', title: 'Rework the subagent colour desaturation', lane: 'blocked', prio: 2, skills: ['frontend'], blockedReason: 'Waiting on design sign-off for the grayscale ramp.',
          desc: 'The forced grayscale on subagent swatches reads slightly muddy in light theme — needs a tuned filter.',
          violations: ['Touched a shared token without an owning card.'] }),
        // ---- done ----
        mkCard({ id: 'SB-241', title: 'Build the active conversation view', lane: 'done', prio: 0, skills: ['frontend'], owner: 'Mencius',
          children: ['SB-241a', 'SB-241b', 'SB-241c'],
          desc: 'Transcript, user bubbles, reasoning blocks, tool blocks and the streaming caret — composed from three child cards.',
          evidence: { proof: true, artifacts: [{ name: 'transcript.diff', sub: '+412 −47', size: '— ' }, { name: 'before-after.png', sub: 'screenshot', size: '880 KB' }], runs: [{ label: 'run · 4f1c-9a', sub: 'verify · passed' }] },
          comments: [{ who: 'Mencius', ago: 5400, text: 'Split into bubbles / reason / tools and merged green. Proof attached.' }] }),
        mkCard({ id: 'SB-240', title: 'Add empty-state suggestion chips', lane: 'done', prio: 1, skills: ['frontend'], owner: 'Descartes',
          desc: 'Four resume / quick-start chips under the composer on the empty state.',
          evidence: { proof: true, runs: [{ label: 'run · 22a7-1c', sub: 'verify · passed' }] } }),
        mkCard({ id: 'SB-238', title: 'Round the composer corners and balance the footer', lane: 'done', prio: 1, skills: ['frontend'], owner: 'Kepler',
          desc: 'Composer to 26px radius; footer band padded evenly top and bottom.',
          evidence: { proof: true, artifacts: [{ name: 'composer.diff', sub: '+96 −31', size: '— ' }] } }),
        mkCard({ id: 'SB-235', title: 'Initial shared-brain layout', lane: 'done', prio: 1, skills: ['frontend'], owner: 'Spinoza',
          desc: 'Sidebar, rounded main pane and the first pass of the composer.' }),
        // ---- triage (unsorted intake) ----
        mkCard({ id: 'SB-255', title: 'Composer drops focus after sending on iPad', lane: 'triage', prio: 1, skills: ['bug', 'frontend'],
          source: { kind: 'session', label: 'From session · iPad QA' }, session: { id: 'chat-91d2', title: 'iPad QA pass', turns: 12 },
          createdAgo: 540, updatedAgo: 540,
          desc: 'Reported mid-session: after send, the composer loses focus so the next message needs a tap. Needs triage — confirm, set priority, route.' }),
        mkCard({ id: 'SB-254', title: 'Investigate 4K moon frame spikes flagged by a run', lane: 'triage', prio: 2, skills: ['perf'],
          source: { kind: 'run', label: 'From run · perf-7c2' }, createdAgo: 900, updatedAgo: 760,
          evidence: { artifacts: [{ name: 'perf-7c2.cpuprofile', sub: 'attached by run', size: '2.1 MB' }] },
          desc: 'A verify run attached a CPU profile showing frame spikes on 4K. Decide whether this is a real regression or noise, then route or close.' }),
        // ---- to do (accepted, not yet ready) ----
        mkCard({ id: 'SB-253', title: 'Write the keyboard-shortcuts overlay spec', lane: 'todo', prio: 1, skills: ['docs', 'frontend'], parent: 'SB-251',
          createdAgo: 1800, updatedAgo: 600, desc: 'Spec the ⌘/ overlay so SB-251 can be decomposed and claimed. Define the trigger, the grouping and the dismiss behaviour.' }),
        mkCard({ id: 'SB-258', title: 'Audit focus order across the settings stack', lane: 'todo', prio: 2, skills: ['a11y'],
          createdAgo: 2400, updatedAgo: 2400, desc: 'Tab order skips the theme switcher. Map every focus stop before fixing.' }),
        // ---- scheduled (deferred to a time / window) ----
        mkCard({ id: 'SB-256', title: 'Nightly: regenerate the icon sprite sheet', lane: 'scheduled', prio: 2, skills: ['infra'], scheduledFor: 'Tonight 02:00',
          createdAgo: 6000, updatedAgo: 300, desc: 'Runs unattended after the freeze. Auto-promotes to ready at the scheduled time.' }),
        mkCard({ id: 'SB-257', title: 'Re-run the a11y sweep after the token migration', lane: 'scheduled', prio: 1, skills: ['a11y'], scheduledFor: 'After SB-236', parent: 'SB-236',
          createdAgo: 3000, updatedAgo: 3000, desc: 'Gated on the CSS-layers migration landing; scheduled to fire when SB-236 completes.' }),
        // ---- review (ran, awaiting sign-off) ----
        mkCard({ id: 'SB-244', title: 'Persist the environment panel open state', lane: 'review', prio: 1, skills: ['frontend'], owner: 'Descartes', reviewer: 'you',
          workspace: 'eclipse/env-persist', createdAgo: 4000, updatedAgo: 120,
          source: { kind: 'card', label: 'Claimed from ready' }, session: { id: 'chat-22a7', title: 'env panel persistence', turns: 18 },
          evidence: { proof: false, artifacts: [{ name: 'env-persist.diff', sub: '+58 −12', size: '— ' }], runs: [{ label: 'run · 8be1-2f', sub: 'verify · passed' }] },
          attempts: [{ n: 1, result: 'passed', reason: 'verify green', ago: 300 }],
          desc: 'Descartes wired the panel open state into localStorage. Verify is green — approve to ship or request changes.',
          comments: [{ who: 'Descartes', ago: 300, text: 'Stored under sb-env-open, restored on mount. Diff + verify run attached for review.' }] }),
        mkCard({ id: 'SB-237', title: 'Cache the raytraced moon between frames', lane: 'review', prio: 1, skills: ['perf', 'frontend'], owner: 'Kepler', reviewer: 'you',
          workspace: 'eclipse/moon-cache', createdAgo: 5200, updatedAgo: 240,
          evidence: { proof: false, runs: [{ label: 'run · 1f9c-aa', sub: 'verify · passed' }], logs: ['[17:02:11] frame cache wired\n[17:03:40] retry 1 — cache invalidation off by one\n[17:04:50] fixed + verify ok'] },
          attempts: [{ n: 1, result: 'failed', reason: 'cache invalidation off by one', ago: 1400 }, { n: 2, result: 'passed', reason: 'fixed + verify green', ago: 240 }],
          desc: 'Two attempts: the first failed on a cache-invalidation bug, the second passed. Awaiting review before it ships.' }),
        // ---- archived (off-board, restorable) ----
        mkCard({ id: 'SB-230', title: 'Spike: WebGPU moon renderer', lane: 'done', prio: 2, skills: ['perf'], owner: 'Arendt', archived: true,
          createdAgo: 90000, updatedAgo: 80000, evidence: { proof: true },
          desc: 'Explored a WebGPU path for the moon. Parked — the canvas raytracer is fast enough. Archived for reference.' }),
        mkCard({ id: 'SB-228', title: 'Superseded: hard-coded theme tokens', lane: 'done', prio: 2, skills: ['frontend'], owner: 'Spinoza', archived: true,
          createdAgo: 120000, updatedAgo: 110000, desc: 'Replaced by the CSS-layers migration (SB-236). Archived.' }),
        // children of SB-241 (decomposed, all done)
        mkCard({ id: 'SB-241a', title: 'User bubble + reasoning block', lane: 'done', prio: 1, owner: 'Mencius', parent: 'SB-241', hidden: true, desc: 'Bubble fills and the collapsible "Thought for Ns" block.' }),
        mkCard({ id: 'SB-241b', title: 'Tool / terminal block', lane: 'done', prio: 1, owner: 'Mencius', parent: 'SB-241', hidden: true, desc: 'The #1b1b1b tool block with a quiet head row.' }),
        mkCard({ id: 'SB-241c', title: 'Streaming caret + typing dots', lane: 'done', prio: 2, owner: 'Mencius', parent: 'SB-241', hidden: true, desc: 'steps() caret and the breathing typing indicator.' })
      ]
    },
    'mobile-pwa': {
      name: 'mobile-pwa', branch: 'eclipse/mobile-pwa', throughput: 2,
      cards: [
        mkCard({ id: 'MP-118', title: 'Render the ASCII moon on the empty state', lane: 'backlog', prio: 1, skills: ['frontend'], desc: 'Port the raytraced moon to the mobile home screen at a smaller glyph grid.' }),
        mkCard({ id: 'MP-117', title: 'Install prompt + offline manifest', lane: 'backlog', prio: 2, skills: ['infra'], desc: 'Add the web-app manifest and a tasteful add-to-home prompt.' }),
        mkCard({ id: 'MP-115', title: 'Drawer navigation gestures', lane: 'ready', prio: 1, skills: ['frontend'], specified: true, desc: 'Edge-swipe to open the conversation drawer; spring back under threshold.' }),
        mkCard({ id: 'MP-114', title: 'Mobile composer + voice button', lane: 'progress', prio: 0, skills: ['frontend'], owner: 'Descartes', startedAgo: 420, beatAgo: 9, budget: [3.1, 7], retries: [0, 2], workspace: 'eclipse/mp-composer', desc: 'Bottom-anchored composer with the mic affordance and safe-area padding.', evidence: { logs: ['[16:47:10] claimed by Descartes\n[16:53:40] heartbeat ok'] } }),
        mkCard({ id: 'MP-112', title: 'Settings stack + theme switch', lane: 'blocked', prio: 1, skills: ['frontend'], parent: 'MP-114', desc: 'Pushable settings screens; the three-theme switcher mirrors desktop.' }),
        mkCard({ id: 'MP-110', title: 'Home shell + status bar', lane: 'done', prio: 1, skills: ['frontend'], owner: 'Spinoza', desc: 'The mobile shell, status bar and safe areas.', evidence: { proof: true } })
      ]
    }
  };

  var NOTIFS = [
    { id: 'n1', text: '<b>Kepler</b> sent a heartbeat on <b>SB-242</b>', ago: 6, read: false, card: 'SB-242' },
    { id: 'n2', text: '<b>SB-239</b> has not sent a heartbeat in 9m', ago: 552, read: false, card: 'SB-239' },
    { id: 'n3', text: '<b>Confucius</b> hit retry 2/2 on <b>SB-236</b>', ago: 40, read: false, card: 'SB-236' },
    { id: 'n4', text: '<b>Mencius</b> completed <b>SB-241</b> with proof', ago: 5400, read: true, card: 'SB-241' },
    { id: 'n5', text: 'You commented on <b>SB-242</b>', ago: 320, read: true, card: 'SB-242' }
  ];

  // ============ STATE ============
  var curBoard = (function () {
    try { var b = localStorage.getItem('sb-wb-board'); return BOARDS[b] ? b : 'shared-brain'; } catch (e) { return 'shared-brain'; }
  })();
  var selected = null;       // card id open in drawer
  var wbReturnFocus = null;  // element to restore focus to when the drawer closes
  var editing = false;       // drawer edit mode
  var drawerTab = 'evidence';// active diagnostics tab in drawer
  var autoDispatch = false;
  var freshIds = {};         // ids to flash on next render
  var wbFilter = { q: '', prio: 'all', agent: 'all', hideEmpty: false, archived: false, view: 'board' };

  function board() { return BOARDS[curBoard]; }
  function cardById(id) { for (var k in BOARDS) { var c = BOARDS[k].cards; for (var i = 0; i < c.length; i++) if (c[i].id === id) return c[i]; } return null; }
  function allCards() { return board().cards.filter(function (c) { return !c.hidden; }); }
  function matchesFilter(c) {
    if (wbFilter.archived ? !c.archived : c.archived) return false;
    if (wbFilter.prio !== 'all' && String(c.prio) !== wbFilter.prio) return false;
    if (wbFilter.agent === 'unassigned') { if (c.owner) return false; }
    else if (wbFilter.agent !== 'all' && c.owner !== wbFilter.agent) return false;
    if (wbFilter.q) { var q = wbFilter.q.toLowerCase(); if ((c.title + ' ' + c.id).toLowerCase().indexOf(q) < 0) return false; }
    return true;
  }
  function visibleCards() { return allCards().filter(matchesFilter); }
  function laneCards(lane) { return visibleCards().filter(function (c) { return c.lane === lane; }); }
  function filterActive() { return !!(wbFilter.q || wbFilter.prio !== 'all' || wbFilter.agent !== 'all'); }
  function isStale(c) { return c.lane === 'progress' && c.lastBeatTs && (now() - c.lastBeatTs) / 1000 > STALE; }
  function overBudget(c) { return c.budget && c.budget[0] >= c.budget[1]; }
  function depParent(c) { return c.parent ? cardById(c.parent) : null; }

  // ---- status model (icon + label — never colour alone) ----
  function lastAttempt(c) { var at = c.attempts || []; return at.length ? at[at.length - 1] : null; }
  function hasFailed(c) { return (c.attempts || []).some(function (a) { return a.result === 'failed'; }); }
  function failing(c) { var a = lastAttempt(c); return !!(a && a.result === 'failed'); }
  function statusMeta(c) {
    if (isStale(c)) return { icon: I.clock, label: 'Stale', tone: 'warn' };
    if (c.lane === 'progress' && overBudget(c)) return { icon: I.xfail, label: 'Over budget', tone: 'warn' };
    switch (c.lane) {
      case 'triage':    return { icon: I.inbox,  label: 'Triage', tone: 'muted' };
      case 'backlog':   return { icon: I.flag,   label: c.specified ? 'Specified' : 'Needs spec', tone: 'muted' };
      case 'todo':      return { icon: I.circle, label: 'To do', tone: 'muted' };
      case 'scheduled': return { icon: I.cal,    label: 'Scheduled', tone: 'sched' };
      case 'ready':     return { icon: I.play,   label: 'Ready', tone: 'ready' };
      case 'progress':  return { icon: I.cycle,  label: 'Running', tone: 'live' };
      case 'review':    return { icon: I.eye,    label: 'Review', tone: 'review' };
      case 'blocked':   return { icon: I.block,  label: 'Blocked', tone: 'warn' };
      case 'done':      return { icon: I.check,  label: c.archived ? 'Archived' : 'Done', tone: 'done' };
    }
    return { icon: I.dot, label: c.lane, tone: 'muted' };
  }
  function laneName(id) { for (var i = 0; i < LANES.length; i++) if (LANES[i].id === id) return LANES[i].name; return ''; }
  // On the board, a chip that merely restates the lane it sits in is noise —
  // suppress it there (pass dedupe). Informative chips (Stale, Over budget,
  // Needs spec, Archived…) always render; list view always shows the column.
  function statusChip(c, dedupe) {
    var s = statusMeta(c);
    if (dedupe && s.label === laneName(c.lane)) return '';
    return '<span class="wb-status s-' + s.tone + '">' + svg(s.icon, 2) + '<span>' + esc(s.label) + '</span></span>';
  }

  // ---- one priority formatter (flat brightness atom — never a pill) ----
  var PRIO_WORD = { 0: 'high', 1: 'med', 2: 'low' };
  function prioHTML(c) {
    var p = c.prio;
    if (p == null) return '';
    return '<span class="wb-prio p' + p + '">P' + p + '<i class="prio-w"> \u00b7 ' + PRIO_WORD[p] + '</i></span>';
  }

  // ---- card top flag: at most one; suppressed when the status chip already warns ----
  function cardFlag(c) {
    if (statusMeta(c).tone === 'warn') return '';
    if (failing(c)) return '<span class="wb-flag fail" title="Last attempt failed">' + svg(I.xfail, 2) + '</span>';
    if (c.violations.length) return '<span class="wb-flag violation" title="Protocol violation">' + svg(I.shield, 2) + '</span>';
    return '';
  }

  // ---- one assignee cell (unclaimed / avatar+name / stale) ----
  function assigneeCell(c) {
    if (!c.owner) return '<span class="wb-assignee unclaimed"><span class="wb-avatar none">?</span><span class="as-name">unclaimed</span></span>';
    var st = isStale(c);
    return '<span class="wb-assignee' + (st ? ' stale' : '') + '">' + avatar(c.owner) +
      '<span class="as-name">' + esc(c.owner) + '</span>' +
      (st ? '<span class="as-flag">stale</span>' : '') + '</span>';
  }

  // ---- live-process texture (worktree ref · tail-f log · ASCII meter) ----
  function repeatCh(ch, n) { var s = ''; for (var i = 0; i < n; i++) s += ch; return s; }
  function budgetMeter(c) {
    if (!c.budget) return '';
    var over = overBudget(c);
    var pct = Math.min(100, c.budget[0] / c.budget[1] * 100);
    var bar = '<span class="wb-bar"><i class="' + (over ? 'over' : '') + '" style="width:' + pct.toFixed(0) + '%"></i></span>';
    var val = c.budget[0].toFixed(1) + '/' + c.budget[1] + 'm' + (over ? ' over' : '');
    return '<div class="wb-meter">' + bar +
      '<span class="val' + (over ? ' over' : '') + '">' + val + '</span></div>';
  }
  function worktreeRef(c) {
    if (!c.workspace) return '';
    return '<div class="wb-worktree">' + svg(I.branch, 2) + '<span>' + esc(c.workspace) + '</span></div>';
  }
  function logLines(c) {
    var logs = (c.evidence && c.evidence.logs) || [], lines = [];
    logs.forEach(function (L) { String(L).split('\n').forEach(function (x) { x = x.trim(); if (x) lines.push(x); }); });
    return lines;
  }
  function lastLogAction(c) {
    var lines = logLines(c); if (!lines.length) return '';
    for (var i = lines.length - 1; i >= 0; i--) { if (!/heartbeat ok$/.test(lines[i])) return lines[i]; }
    return lines[lines.length - 1];
  }
  function fmtLog(raw) {
    var s = esc(raw);
    s = s.replace(/^(\[\d\d:\d\d:\d\d\])/, '<span class="lt-ts">$1</span>');
    s = s.replace(/(\+\d+(?:\s*[\u2212-]\s*\d+)?)/g, '<span class="lt-diff">$1</span>');
    s = s.replace(/(\u2014 worker went quiet \u2014|still running[^<]*)/, '<span class="lt-quiet">$1</span>');
    return s;
  }
  function logtailHTML(c) {
    var raw = lastLogAction(c); if (!raw) return '';
    return '<div class="wb-logtail">' + fmtLog(raw) + '</div>';
  }

  // ============ RENDER: SHELL ============
  function renderShell() {
    root.innerHTML =
      '<div class="wb-header" id="wbHeader"></div>' +
      '<div class="wb-board-wrap"><div class="wb-board" id="wbBoard"></div><div class="wb-edge-fade left"></div><div class="wb-edge-fade"></div></div>' +
      '<div class="wb-board-menu" id="wbBoardMenu"></div>' +
      '<div class="wb-pop" id="wbPop"></div>' +
      '<div class="wb-preflight" id="wbPreflight"></div>' +
      '<div class="wb-notif" id="wbNotif"></div>' +
      '<div class="wb-scrim" id="wbScrim"></div>' +
      '<div class="wb-drawer" id="wbDrawer"></div>' +
      '<div class="wb-toast" id="wbToast"></div>';
    document.getElementById('wbScrim').addEventListener('click', closeDrawer);
    var bd = document.getElementById('wbBoard');
    if (bd) bd.addEventListener('scroll', updateEdgeFade);
  }

  // clamp an anchored popover inside the view (12px inset)
  function clampPop(p) {
    p.style.maxWidth = (root.clientWidth - 24) + 'px';
    var left = parseFloat(p.style.left) || 0;
    var over = left + p.offsetWidth - (root.clientWidth - 12);
    if (over > 0) p.style.left = Math.max(12, left - over) + 'px';
  }

  function updateEdgeFade() {
    var el = document.getElementById('wbBoard');
    var wrap = el && el.parentNode;
    if (!wrap || !wrap.classList || !wrap.classList.contains('wb-board-wrap')) return;
    var horiz = wbFilter.view !== 'list';
    var more = horiz && (el.scrollWidth - el.clientWidth - el.scrollLeft > 6);
    wrap.classList.toggle('more-right', more);
    wrap.classList.toggle('more-left', horiz && el.scrollLeft > 6);
  }

  // ============ RENDER: HEADER ============
  function renderHeader() {
    var b = board();
    var all = allCards();
    var inFlight = all.filter(function (c) { return c.lane === 'progress'; }).length;
    var blocked = all.filter(function (c) { return c.lane === 'blocked'; }).length;
    var alive = all.filter(function (c) { return c.lane === 'progress' && !isStale(c); }).length;
    var unread = NOTIFS.filter(function (n) { return !n.read; }).length;
    var h = document.getElementById('wbHeader');

    var statusBits = '';
    if (inFlight) statusBits += (alive ? '<span class="live-dot"></span>' : '<span class="idle-dot"></span>') + '<span>' + inFlight + ' in flight</span>';
    if (blocked) statusBits += (statusBits ? '<span class="sep">\u00b7</span>' : '') + '<span class="wb-blk">' + blocked + ' blocked</span>';

    var prioLabel = wbFilter.prio === 'all' ? 'All priorities' : ('P' + wbFilter.prio);
    var agentLabel = wbFilter.agent === 'all' ? 'All agents' : (wbFilter.agent === 'unassigned' ? 'Unassigned' : wbFilter.agent);
    var fchev = '<svg class="fchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + I.chev + '"/></svg>';
    var qVal = esc(wbFilter.q).replace(/"/g, '&quot;');

    h.innerHTML =
      '<div class="wb-titlebar">' +
        '<div class="wb-titlebar-left">' +
          '<h1 class="wb-page-h1">Workboard</h1>' +
          '<p class="wb-page-sub">Agent work queue and session handoff</p>' +
        '</div>' +
        '<div class="wb-titlebar-right">' +
          (statusBits ? '<div class="wb-meta-line">' + statusBits + '</div>' : '') +
          '<div class="wb-switch" id="wbSwitch">' + svg(I.folder) +
            '<div class="wb-title"><span class="wb-board-name">' + esc(b.name) + '</span>' +
            '<span class="wb-board-branch">' + esc(b.branch) + '</span></div>' +
            '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + I.chev + '"/></svg>' +
          '</div>' +
          '<div class="wb-tbtn icon wb-bell' + (unread ? ' has-unread' : '') + '" id="wbBell" title="Notifications">' + svg(I.bell, 2) + '<span class="nd"></span></div>' +
        '</div>' +
      '</div>' +
      '<div class="wb-commandbar">' +
        '<div class="wb-cmd-left">' +
          '<div class="wb-search">' + svg(I.search, 2) +
            '<input id="wbSearch" type="text" placeholder="Search cards" value="' + qVal + '" autocomplete="off" spellcheck="false" />' +
          '</div>' +
          '<button type="button" class="wb-filter' + (wbFilter.prio !== 'all' ? ' active-filter' : '') + '" id="wbPrio">' + esc(prioLabel) + fchev + '</button>' +
          '<button type="button" class="wb-filter' + (wbFilter.agent !== 'all' ? ' active-filter' : '') + '" id="wbAgent">' + esc(agentLabel) + fchev + '</button>' +
          (filterActive() ? '<button type="button" class="wb-clear" id="wbClear">' + svg(I.close, 2) + 'Clear</button>' : '') +
        '</div>' +
        '<div class="wb-cmd-right">' +
          '<div class="wb-seg" id="wbView">' +
            '<span class="wb-seg-pill" aria-hidden="true"></span>' +
            ['board', 'list', 'dense'].map(function (v) {
              return '<button type="button" class="wb-seg-btn' + (wbFilter.view === v ? ' on' : '') + '" data-view="' + v + '" title="' + v + ' view">' + svg({ board: I.cols, list: I.rows, dense: I.grid }[v], 2) + '</button>';
            }).join('') +
          '</div>' +
          '<div class="wb-check' + (wbFilter.archived ? ' on' : '') + '" id="wbArchived"><span class="box">' + svg(I.arch, 2) + '</span><span>Archived</span></div>' +
          '<div class="wb-check' + (wbFilter.hideEmpty ? ' on' : '') + '" id="wbHideEmpty"><span class="box">' + svg(I.check, 2.4) + '</span><span>Hide empty</span></div>' +
          '<span class="wb-cmd-div"></span>' +
          '<button type="button" class="wb-icon-btn" id="wbRefresh" title="Refresh board">' + svg(I.cycle, 2) + '</button>' +
          '<div class="wb-dispatch' + (autoDispatch ? ' auto' : '') + '" id="wbDispatch" title="Run a dispatcher pass">' +
            '<span class="disp-ic">' + svg(I.cycle, 2) + '</span>' +
            '<span class="disp-prompt">&gt;_</span>' +
            '<span>Dispatch ready work</span>' +
            '<span class="auto-pill" id="wbAuto" title="Toggle auto-dispatch"><span class="auto-dot"></span>Auto</span>' +
          '</div>' +
          '<div class="wb-newbtn" id="wbNew">' + svg(I.plus, 2) + '<span>New card</span></div>' +
        '</div>' +
      '</div>';

    document.getElementById('wbSwitch').addEventListener('click', toggleBoardMenu);
    document.getElementById('wbDispatch').addEventListener('click', function (e) {
      if (e.target.closest('#wbAuto')) { toggleAuto(); return; }
      openDispatchPreflight();
    });
    document.getElementById('wbBell').addEventListener('click', toggleNotif);
    document.getElementById('wbNew').addEventListener('click', function () { openNewCard('backlog'); });
    document.getElementById('wbRefresh').addEventListener('click', function () {
      if (this.classList.contains('spinning')) return;
      var btn = this; btn.classList.add('spinning');
      setTimeout(function () { btn.classList.remove('spinning'); }, 720);
      renderBoard();
    });
    var si = document.getElementById('wbSearch');
    si.addEventListener('input', function () { wbFilter.q = si.value; renderBoard(); });
    document.getElementById('wbPrio').addEventListener('click', function () {
      openFilterPop(this, PRIO_OPTIONS, wbFilter.prio, function (v) { wbFilter.prio = v; renderHeader(); renderBoard(); });
    });
    document.getElementById('wbAgent').addEventListener('click', function () {
      openFilterPop(this, agentFilterOptions(), wbFilter.agent, function (v) { wbFilter.agent = v; renderHeader(); renderBoard(); });
    });
    document.getElementById('wbHideEmpty').addEventListener('click', function () {
      wbFilter.hideEmpty = !wbFilter.hideEmpty;
      this.classList.toggle('on', wbFilter.hideEmpty);
      renderBoard();
    });
    var vw = document.getElementById('wbView');
    if (vw) vw.querySelectorAll('[data-view]').forEach(function (vb) {
      vb.addEventListener('click', function () {
        if (vb.classList.contains('on')) return;
        wbFilter.view = vb.getAttribute('data-view');
        // move the .on ink + slide the pill in place (no header rebuild, so it animates)
        vw.querySelectorAll('.wb-seg-btn').forEach(function (b) { b.classList.toggle('on', b === vb); });
        placeSegPill(true);
        renderBoard();
      });
    });
    placeSegPill(false);
    document.getElementById('wbArchived').addEventListener('click', function () {
      wbFilter.archived = !wbFilter.archived;
      this.classList.toggle('on', wbFilter.archived);
      renderBoard();
    });
    var clr = document.getElementById('wbClear');
    if (clr) clr.addEventListener('click', function () {
      wbFilter.q = ''; wbFilter.prio = 'all'; wbFilter.agent = 'all';
      renderHeader(); renderBoard();
    });
  }

  // ============ RENDER: BOARD ============
  // Sliding seg-pill (Brief 07): the .on ink is a single pill that travels to the
  // active view button with squash-and-stretch on spring-M, instead of the fill
  // snapping between buttons. Positioned in layout px against the .wb-seg box.
  function placeSegPill(animate) {
    var seg = document.getElementById('wbView');
    if (!seg) return;
    var pill = seg.querySelector('.wb-seg-pill');
    var on = seg.querySelector('.wb-seg-btn.on');
    if (!pill || !on) return;
    if (!on.offsetWidth) { requestAnimationFrame(function () { placeSegPill(false); }); return; }
    pill.style.top = on.offsetTop + 'px';
    pill.style.height = on.offsetHeight + 'px';
    pill.style.width = on.offsetWidth + 'px';
    var x = on.offsetLeft;
    if (!animate) {
      pill.style.transition = 'none';
      pill.style.transform = 'translateX(' + x + 'px)';
      void pill.offsetWidth;
      pill.style.transition = '';
      return;
    }
    pill.style.transform = 'translateX(' + x + 'px) scaleY(0.82)';
    setTimeout(function () { pill.style.transform = 'translateX(' + x + 'px)'; }, 140);
  }

  function renderBoard() {
    var el = document.getElementById('wbBoard');
    el.classList.toggle('dense', wbFilter.view === 'dense');
    el.classList.toggle('listview', wbFilter.view === 'list');
    syncArchivedNote();
    if (wbFilter.view === 'list') { renderListView(el); freshIds = {}; updateEdgeFade(); return; }
    if (wbFilter.archived && visibleCards().length === 0) {
      el.innerHTML = '<div class="wb-board-blank">No archived cards yet \u2014 dismissed and archived work collects here.</div>';
      freshIds = {}; updateEdgeFade(); return;
    }
    el.innerHTML = LANES.filter(function (lane) {
      return !(wbFilter.hideEmpty && laneCards(lane.id).length === 0);
    }).map(function (lane) {
      var cards = laneCards(lane.id);
      var inner = cards.length
        ? cards.map(cardHTML).join('')
        : '<div class="wb-lane-empty"><span class="le-glyphs" aria-hidden="true">· ˖ ·</span>' + emptyText(lane.id) + '</div>';
      return '<div class="wb-lane" data-lane="' + lane.id + '">' +
        '<div class="wb-lane-head">' +
          '<span class="wb-lane-ic">' + svg(laneIcon(lane.id), 2) + '</span>' +
          (lane.id === 'progress' ? '<span class="wb-lane-dot"></span>' : '') +
          '<span class="wb-lane-name">' + lane.name + '</span>' +
          '<span class="wb-lane-count">' + cards.length + '</span>' +
          (['triage', 'backlog', 'todo', 'ready'].indexOf(lane.id) >= 0
            ? '<span class="wb-lane-add" data-add="' + lane.id + '" title="Add card">' + svg(I.plus, 2) + '</span>' : '') +
        '</div>' +
        '<div class="wb-lane-cards" data-lane="' + lane.id + '">' + inner + '</div>' +
      '</div>';
    }).join('');
    if (!el.innerHTML) el.innerHTML = '<div class="wb-board-blank">No cards match your filters</div>';

    el.querySelectorAll('.wb-card').forEach(function (c) {
      c.addEventListener('click', function (e) {
        if (Date.now() < dragClickGuard) return;   // click fired by a drag's pointerup
        if (e.target.closest('[data-claim]')) return;
        openDrawer(c.getAttribute('data-id'));
      });
    });
    el.querySelectorAll('[data-claim]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); claim(b.getAttribute('data-claim')); });
    });
    el.querySelectorAll('[data-add]').forEach(function (a) {
      a.addEventListener('click', function () { openNewCard(a.getAttribute('data-add')); });
    });
    bindDnD(el);
    wireLaneFades(el);
    freshIds = {};
    updateEdgeFade();
  }

  // scroll-fade masks on overflowing lanes (top/bottom, updated on scroll)
  function wireLaneFades(el) {
    el.querySelectorAll('.wb-lane-cards').forEach(function (lc) {
      function sync() {
        var canScroll = lc.scrollHeight - lc.clientHeight > 6;
        lc.classList.toggle('fade-top', canScroll && lc.scrollTop > 6);
        lc.classList.toggle('fade-btm', canScroll && lc.scrollHeight - lc.clientHeight - lc.scrollTop > 6);
      }
      lc.addEventListener('scroll', sync);
      sync();
    });
  }

  function syncArchivedNote() {
    var el = document.getElementById('wbBoard');
    var wrap = el && el.parentNode;
    if (!wrap || !wrap.classList.contains('wb-board-wrap')) return;
    var note = wrap.querySelector('.wb-archived-note');
    if (wbFilter.archived) {
      if (!note) {
        note = document.createElement('div');
        note.className = 'wb-archived-note';
        note.innerHTML = svg(I.arch, 2) + '<span>Showing archived cards across all lanes</span><span class="spring"></span><span class="an-clear">Exit archived</span>';
        wrap.insertBefore(note, el);
        note.querySelector('.an-clear').addEventListener('click', function () {
          wbFilter.archived = false;
          var ac = document.getElementById('wbArchived'); if (ac) ac.classList.remove('on');
          renderHeader(); renderBoard();
        });
      }
    } else if (note) {
      note.remove();
    }
  }

  function emptyText(lane) {
    return { triage: 'Inbox clear', backlog: 'Nothing queued', todo: 'No accepted work', scheduled: 'Nothing scheduled', ready: 'No cards ready to claim', progress: 'No work in flight', review: 'Nothing awaiting review', blocked: 'Nothing blocked', done: 'Nothing shipped yet' }[lane];
  }
  function laneIcon(id) {
    return { triage: I.inbox, backlog: I.flag, todo: I.circle, scheduled: I.cal, ready: I.play, progress: I.cycle, review: I.eye, blocked: I.block, done: I.check }[id] || I.dot;
  }

  // ---- list view (lane sections — header band + flat rows in one container) ----
  var listCollapsed = {};
  function listRowHTML(c) {
    var s = statusMeta(c), sel = (c.id === selected) ? ' sel' : '';
    return '<div class="wb-list-row' + sel + '" data-id="' + c.id + '" tabindex="0">' +
      '<span class="lr-status s-' + s.tone + '">' + svg(s.icon, 2) + '<span>' + esc(s.label) + '</span></span>' +
      '<span class="lr-id">' + c.id + '</span>' +
      '<span class="lr-prio">' + prioHTML(c) + '</span>' +
      '<span class="lr-name">' +
        (failing(c) ? svg(I.xfail, 2).replace('<svg', '<svg class="lr-failic"') : '') +
        esc(c.title) + '</span>' +
      '<span class="lr-labels">' + c.skills.slice(0, 2).map(function (x) { return '<span class="wb-tag">' + esc(x) + '</span>'; }).join('') + '</span>' +
      '<span class="lr-assignee">' + assigneeCell(c) + '</span>' +
      '<button class="lr-dots" aria-label="Open ' + c.id + '">' + svg(I.dots, 2.6) + '</button>' +
      '</div>';
  }
  function renderListView(el) {
    var html = LANES.filter(function (lane) { return !(wbFilter.hideEmpty && laneCards(lane.id).length === 0); }).map(function (lane) {
      var cards = laneCards(lane.id);
      var rows = cards.length ? cards.map(listRowHTML).join('') : '<div class="wb-lane-empty"><span class="le-ic">' + svg(laneIcon(lane.id), 2) + '</span>' + emptyText(lane.id) + '</div>';
      return '<div class="wb-list-sec' + (listCollapsed[lane.id] ? ' collapsed' : '') + '" data-lane="' + lane.id + '">' +
        '<button class="wb-list-head" aria-expanded="' + !listCollapsed[lane.id] + '"><span class="wb-lane-ic">' + svg(laneIcon(lane.id), 2) + '</span>' +
        '<span class="wb-lane-name">' + lane.name + '</span><span class="wb-lane-count">' + cards.length + '</span>' +
        '<span class="wb-lane-chev">' + svg(I.chev, 2) + '</span></button>' +
        '<div class="wb-list-rows">' + rows + '</div></div>';
    }).join('');
    el.innerHTML = html || '<div class="wb-board-blank">No cards match your filters</div>';
    el.querySelectorAll('.wb-list-row').forEach(function (r) {
      r.addEventListener('click', function () { openDrawer(r.getAttribute('data-id')); });
      r.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(r.getAttribute('data-id')); } });
    });
    el.querySelectorAll('.wb-list-head').forEach(function (h) {
      h.addEventListener('click', function () {
        var sec = h.closest('.wb-list-sec'), lane = sec.getAttribute('data-lane');
        listCollapsed[lane] = !listCollapsed[lane];
        sec.classList.toggle('collapsed', !!listCollapsed[lane]);
        h.setAttribute('aria-expanded', !listCollapsed[lane]);
      });
    });
  }
  // toggle the selected-row highlight without a full re-render (drawer open/close)
  function markListSelection() {
    root.querySelectorAll('.wb-list-row.sel').forEach(function (r) { r.classList.remove('sel'); });
    if (selected) { var r = root.querySelector('.wb-list-row[data-id="' + selected + '"]'); if (r) r.classList.add('sel'); }
  }

  function cardHTML(c) {
    var stale = isStale(c), over = overBudget(c), parent = depParent(c);
    var cls = 'wb-card';
    if (c.lane === 'done') cls += ' done-card';
    if (c.lane === 'blocked' || stale) cls += ' dim';
    if (stale) cls += ' stale';
    if (freshIds[c.id]) cls += ' flash entering';

    var top = '<div class="wb-card-top"><span class="wb-id">' + c.id + '</span>' +
      prioHTML(c) +
      '<span class="spring"></span>' +
      cardFlag(c) +
      statusChip(c, true) +
      '</div>';

    var title = '<div class="wb-card-title">' + esc(c.title) + '</div>';

    var tags = c.skills.length ? '<div class="wb-tags">' + c.skills.map(function (s) {
      return '<span class="wb-tag skill">' + esc(s) + '</span>';
    }).join('') + '</div>' : '';

    // meta row: dependency + children + evidence count
    var meta = [];
    if (parent) {
      var pdone = parent.lane === 'done';
      meta.push('<span class="wb-meta-chip">' + svg(I.branch, 2) +
        (pdone ? 'after ' + parent.id : 'needs ' + parent.id) + '</span>');
    }
    if (c.children.length) meta.push('<span class="wb-meta-chip">' + svg(I.split, 2) + c.children.length + '</span>');
    var evN = evCount(c);
    if (evN) meta.push('<span class="wb-meta-chip">' + svg(I.file, 2) + evN + '</span>');
    // chips collapse on running cards — the live-process lines carry it
    var metaRow = (meta.length && c.lane !== 'progress') ? '<div class="wb-card-meta">' + meta.join('') + '</div>' : '';

    // live-process body (in progress): worktree ref · tail-f log · ASCII runtime meter
    var proc = (c.lane === 'progress') ? (worktreeRef(c) + logtailHTML(c)) : '';
    var budget = (c.lane === 'progress') ? budgetMeter(c) : '';

    // footer
    var foot;
    if (c.lane === 'progress') {
      var elapsed = c.startedTs ? (now() - c.startedTs) / 1000 : 0;
      foot = '<div class="wb-card-foot">' + avatar(c.owner) + '<span class="wb-owner-name">' + c.owner + '</span>' +
        '<span class="wb-hb">' +
          (stale ? '<span class="wb-stale-tag">stale · ' + fmtAgo((now() - c.lastBeatTs) / 1000) + '</span>' : '') +
          '<span class="wb-hb-dot"></span>' +
          '<span class="wb-hb-time" data-elapsed="' + c.id + '">' + fmtMMSS(elapsed) + '</span>' +
        '</span></div>';
    } else if (c.lane === 'done') {
      foot = '<div class="wb-card-foot">' + avatar(c.owner) + '<span class="wb-owner-name">' + (c.owner || '\u2014') + '</span>' +
        '<span class="wb-done-tag">' + svg(I.check, 2.2) + 'shipped</span></div>';
    } else if (c.lane === 'ready') {
      foot = '<div class="wb-card-foot">' +
        (c.suggestAgent ? '<span class="wb-suggest">suggest ' + c.suggestAgent + '</span>' : '') +
        '<button type="button" class="wb-claim-btn" data-claim="' + c.id + '">' + svg(I.user, 2) + 'Claim</button></div>';
    } else if (c.lane === 'blocked') {
      foot = parent ? '<div class="wb-card-foot"><span class="wb-meta-chip">' + svg(I.block, 2) + 'needs ' + parent.id + '</span></div>' : '';
    } else if (c.lane === 'review') {
      foot = '<div class="wb-card-foot">' + avatar(c.owner) + '<span class="wb-owner-name">' + (c.owner || '\u2014') + '</span>' +
        '<span class="wb-need">' + ((c.attempts && c.attempts.length) ? (c.attempts.length + ' attempt' + (c.attempts.length === 1 ? '' : 's')) : 'ran') + '</span></div>';
    } else if (c.lane === 'scheduled') {
      foot = '<div class="wb-card-foot"><span class="wb-meta-chip">' + svg(I.cal, 2) + esc(c.scheduledFor || 'scheduled') + '</span></div>';
    } else if (c.lane === 'triage') {
      foot = c.source ? '<div class="wb-card-foot"><span class="wb-unclaimed">' + esc(c.source.label) + '</span></div>' : '';
    } else if (c.lane === 'todo') {
      foot = c.parent ? '<div class="wb-card-foot"><span class="wb-unclaimed">for ' + c.parent + '</span></div>' : '';
    } else { // backlog
      foot = c.suggestSkill ? '<div class="wb-card-foot"><span class="wb-suggest">' + svg(I.spark, 2) + c.suggestSkill + '</span></div>' : '';
    }

    return '<div class="' + cls + '" data-id="' + c.id + '">' + top + title + tags + metaRow + proc + budget + foot + '</div>';
  }

  function evCount(c) {
    var e = c.evidence || {}, n = 0;
    if (e.proof) n++;
    n += (e.artifacts || []).length + (e.runs || []).length + (e.logs || []).length;
    return n;
  }

  // ============ LIVE TICK ============
  function tick() {
    allCards().forEach(function (c) {
      if (c.lane !== 'progress') return;
      // simulate a steady heartbeat for healthy workers
      if (!isStale(c) && (now() - c.lastBeatTs) / 1000 > 11) c.lastBeatTs = now();
      if (c.startedTs) root.querySelectorAll('[data-elapsed="' + c.id + '"]').forEach(function (el) { el.textContent = fmtMMSS((now() - c.startedTs) / 1000); });
    });
    // drawer live fields
    if (selected) {
      var c = cardById(selected);
      if (c && c.lane === 'progress') {
        var be = root.querySelector('[data-beat]');
        if (be && c.lastBeatTs) be.textContent = fmtAgo((now() - c.lastBeatTs) / 1000) + ' ago';
        var ee = root.querySelector('[data-elapsed-d]');
        if (ee && c.startedTs) ee.textContent = fmtMMSS((now() - c.startedTs) / 1000);
      }
    }
  }

  // ============ BOARD MENU ============
  function toggleBoardMenu() {
    var m = document.getElementById('wbBoardMenu');
    if (m.classList.contains('open')) { m.classList.remove('open'); return; }
    m.innerHTML = Object.keys(BOARDS).map(function (k) {
      var b = BOARDS[k];
      var active = k === curBoard;
      var total = b.cards.filter(function (c) { return !c.hidden; }).length;
      return '<div class="wb-board-opt' + (active ? ' active' : '') + '" data-board="' + k + '">' +
        svg(I.folder, 2) +
        '<div class="bo-main"><span class="bo-name">' + esc(b.name) + '</span><span class="bo-meta">' + esc(b.branch) + '</span></div>' +
        '<span class="bo-count">' + total + '</span></div>';
    }).join('') +
      '<div class="wb-board-sep"></div>' +
      '<div class="wb-board-opt new-board" id="wbNewBoard">' + svg(I.plus, 2) + '<div class="bo-main"><span class="bo-name">New board…</span></div></div>';
    m.querySelectorAll('[data-board]').forEach(function (o) {
      o.addEventListener('click', function () { switchBoard(o.getAttribute('data-board')); m.classList.remove('open'); });
    });
    m.querySelector('#wbNewBoard').addEventListener('click', function () {
      toast([['+', 'new board'], ['scaffold a namespace from the composer', null]], 'New board');
      m.classList.remove('open');
    });
    var sw = document.getElementById('wbSwitch');
    if (sw) {
      var rrb = root.getBoundingClientRect(), arb = sw.getBoundingClientRect();
      m.style.left = 'auto';
      m.style.right = (rrb.right - arb.right) + 'px';
      m.style.top = (arb.bottom - rrb.top + 6) + 'px';
      m.style.transformOrigin = 'top right';
    }
    closeNotif();
    m.classList.add('open');
  }
  function switchBoard(k) {
    if (!BOARDS[k]) return;
    curBoard = k;
    try { localStorage.setItem('sb-wb-board', k); } catch (e) {}
    closeDrawer(); renderHeader(); renderBoard();
  }

  // ============ FILTER POPOVERS ============
  var PRIO_OPTIONS = [
    { v: 'all', label: 'All priorities' },
    { v: '0', label: 'P0 \u00b7 high' },
    { v: '1', label: 'P1 \u00b7 medium' },
    { v: '2', label: 'P2 \u00b7 low' }
  ];
  function agentFilterOptions() {
    var seen = {}, order = [];
    allCards().forEach(function (c) { if (c.owner && !seen[c.owner]) { seen[c.owner] = 1; order.push(c.owner); } });
    var opts = [{ v: 'all', label: 'All agents' }];
    order.forEach(function (a) { opts.push({ v: a, label: a }); });
    opts.push({ v: 'unassigned', label: 'Unassigned' });
    return opts;
  }
  function closePop() { var p = document.getElementById('wbPop'); if (p) p.classList.remove('open'); }
  function openFilterPop(anchor, opts, current, onPick) {
    var p = document.getElementById('wbPop');
    if (p.classList.contains('open') && p.getAttribute('data-for') === anchor.id) { closePop(); return; }
    p.setAttribute('data-for', anchor.id);
    p.innerHTML = opts.map(function (o) {
      return '<div class="wb-pop-opt' + (o.v === current ? ' active' : '') + '" data-v="' + esc(o.v) + '">' +
        '<span class="po-label">' + esc(o.label) + '</span>' +
        (o.v === current ? '<span class="po-check">' + svg(I.check, 2.2) + '</span>' : '') + '</div>';
    }).join('');
    var rr = root.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    p.style.left = (ar.left - rr.left) + 'px';
    p.style.top = (ar.bottom - rr.top + 6) + 'px';
    clampPop(p);
    p.querySelectorAll('[data-v]').forEach(function (el) {
      el.addEventListener('click', function () { onPick(el.getAttribute('data-v')); closePop(); });
    });
    document.getElementById('wbBoardMenu').classList.remove('open'); closeNotif();
    p.classList.add('open');
  }

  // ============ NOTIFICATIONS ============
  function toggleNotif() {
    var n = document.getElementById('wbNotif');
    if (n.classList.contains('open')) { closeNotif(); return; }
    renderNotif();
    document.getElementById('wbBoardMenu').classList.remove('open');
    n.classList.add('open');
  }
  function closeNotif() { document.getElementById('wbNotif').classList.remove('open'); }
  function renderNotif() {
    var n = document.getElementById('wbNotif');
    var items = NOTIFS.slice().sort(function (a, b) { return a.ago - b.ago; });
    n.innerHTML =
      '<div class="wb-notif-head"><span class="nt">Notifications</span><span class="nclear" id="wbNClear">Mark all read</span></div>' +
      '<div class="wb-notif-list">' + (items.length ? items.map(function (it) {
        return '<div class="wb-notif-item ' + (it.read ? 'read' : 'unread') + '" data-notif="' + it.id + '" data-card="' + (it.card || '') + '">' +
          '<span class="ni-dot"></span><div class="ni-main"><div class="ni-text">' + it.text + '</div>' +
          '<div class="ni-when">' + fmtAgo(it.ago) + ' ago</div></div></div>';
      }).join('') : '<div class="wb-notif-empty">You\'re all caught up</div>') + '</div>';
    n.querySelector('#wbNClear').addEventListener('click', function () {
      NOTIFS.forEach(function (x) { x.read = true; });
      renderNotif(); renderHeader();
    });
    n.querySelectorAll('[data-notif]').forEach(function (it) {
      it.addEventListener('click', function () {
        var id = it.getAttribute('data-notif');
        var rec = NOTIFS.find(function (x) { return x.id === id; });
        if (rec) rec.read = true;
        var card = it.getAttribute('data-card');
        closeNotif(); renderHeader();
        if (card && cardById(card)) openDrawer(card);
      });
    });
  }
  function pushNotif(text, card) {
    NOTIFS.unshift({ id: 'n' + (Date.now()), text: text, ago: 0, read: false, card: card || null });
  }

  // ============ DRAWER → HERO EXPAND (Brief 07) ============
  // The detail is a centered panel the clicked card MORPHS into (FLIP:
  // measure card + panel rects, bridge with a transform, release on
  // --spring-l). Close collapses back onto the card on --calm at ~60%
  // duration. Reduced motion (either system) skips the morph entirely.
  var heroClosing = false;
  function heroSrc(id) {
    return id ? root.querySelector('.wb-card[data-id="' + id + '"], .wb-list-row[data-id="' + id + '"]') : null;
  }
  function heroReduced() {
    return document.documentElement.getAttribute('data-motion') === 'reduce'
      || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  // ancestor scale (the app shell runs at 0.88): rect deltas are in visual px,
  // transforms apply in local px — divide deltas by this factor
  function heroScaleK(d) {
    var w = d.offsetWidth;
    return w ? (d.getBoundingClientRect().width / w) : 1;
  }
  function heroBridge(d, from, to, k) {
    return 'translate(' + ((from.left - to.left) / k).toFixed(2) + 'px,' + ((from.top - to.top) / k).toFixed(2) + 'px) ' +
           'scale(' + (from.width / to.width).toFixed(4) + ',' + (from.height / to.height).toFixed(4) + ')';
  }
  function openDrawer(id) {
    var c = cardById(id); if (!c) return;
    var d = document.getElementById('wbDrawer');
    var already = d.classList.contains('open') && !heroClosing;
    if (!already) wbReturnFocus = document.activeElement;
    selected = id;
    editing = false;
    heroClosing = false;
    renderDrawer(c);
    markListSelection();
    document.getElementById('wbScrim').classList.add('open');
    root.classList.add('wb-hero-dim');
    d.classList.remove('hero-out');
    d.classList.add('open');
    d.style.opacity = '';
    if (already) {
      d.style.transition = 'none'; d.style.transform = 'none';
      d.classList.add('hero-in');
    } else {
      var src = heroSrc(id);
      d.style.transition = 'none'; d.style.transform = 'none';
      if (src && !heroReduced()) {
        var to = d.getBoundingClientRect(), from = src.getBoundingClientRect();
        d.style.transform = heroBridge(d, from, to, heroScaleK(d));
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          d.style.transition = 'transform var(--dur-l, 420ms) var(--spring-l, ease)';
          d.style.transform = 'none';
        }); });
      }
      requestAnimationFrame(function () { d.classList.add('hero-in'); });
    }
    closeNotif();
    requestAnimationFrame(function () {
      var cl = document.getElementById('wbDrawerClose');
      if (cl) { try { cl.focus(); } catch (e) {} }
    });
  }
  function closeDrawer() {
    var d = document.getElementById('wbDrawer');
    var wasOpen = d.classList.contains('open');
    var id = selected;
    selected = null; editing = false;
    document.getElementById('wbScrim').classList.remove('open');
    root.classList.remove('wb-hero-dim');
    markListSelection();
    if (wbReturnFocus && document.contains(wbReturnFocus)) { try { wbReturnFocus.focus(); } catch (e) {} }
    wbReturnFocus = null;
    if (!wasOpen || heroClosing) return;
    var src = heroSrc(id);
    if (src && !heroReduced()) {
      heroClosing = true;
      d.classList.remove('hero-in');
      d.classList.add('hero-out');
      var to = d.getBoundingClientRect(), from = src.getBoundingClientRect();
      d.style.transition = 'transform 250ms var(--calm, ease), opacity 160ms var(--tint, ease) 110ms';
      d.style.transform = heroBridge(d, from, to, heroScaleK(d));
      d.style.opacity = '0';
      setTimeout(function () {
        heroClosing = false;
        if (selected) return;   // re-opened mid-collapse — openDrawer owns the state now
        d.classList.remove('open', 'hero-in', 'hero-out');
        d.style.transition = 'none'; d.style.transform = 'none'; d.style.opacity = '';
      }, 280);
    } else {
      d.classList.remove('open', 'hero-in', 'hero-out');
      d.style.transition = 'none'; d.style.transform = 'none'; d.style.opacity = '';
    }
  }

  function renderDrawer(c) {
    var d = document.getElementById('wbDrawer');
    if (editing) { renderDrawerEdit(c, d); return; }
    var laneName = LANES.find(function (l) { return l.id === c.lane; }).name;
    var stale = isStale(c), parent = depParent(c);

    // ownership block
    var own = '';
    if (c.lane === 'progress') {
      own = '<div class="wb-own">' + avatar(c.owner) +
        '<div class="wb-own-info"><span class="wb-own-name">' + c.owner + '</span>' +
        '<span class="wb-own-sub">' + (stale
          ? 'last heartbeat <span data-beat>' + fmtAgo((now() - c.lastBeatTs) / 1000) + ' ago</span> · stale'
          : 'heartbeat <span class="alive" data-beat>' + fmtAgo((now() - c.lastBeatTs) / 1000) + ' ago</span> · <span data-elapsed-d>' + fmtMMSS((now() - c.startedTs) / 1000) + '</span> elapsed') +
        '</span></div>' +
        '<div class="wb-own-actions"><span class="wb-action" data-act="reassign">' + svg(I.cycle, 2) + 'Reassign</span>' +
        '<span class="wb-action" data-act="release">Release</span></div></div>';
    } else if (c.lane === 'done') {
      own = '<div class="wb-own">' + avatar(c.owner) + '<div class="wb-own-info"><span class="wb-own-name">' + (c.owner || 'Unassigned') + '</span><span class="wb-own-sub">completed · verified</span></div></div>';
    } else if (c.lane === 'ready') {
      own = '<div class="wb-own"><span class="wb-avatar none">?</span><div class="wb-own-info"><span class="wb-own-name">Unclaimed</span><span class="wb-own-sub">' + (c.suggestAgent ? 'suggested · ' + c.suggestAgent : 'open to any agent') + '</span></div><div class="wb-own-actions"><span class="wb-action go" data-act="claim">' + svg(I.user, 2) + 'Claim</span></div></div>';
    }

    // routing kv grid
    var kv = '<div class="wb-rows">';
    kv += kvCell(I.shield, 'Priority', 'P' + c.prio + (c.prio === 0 ? ' · highest' : ''));
    kv += kvCell(I.spark, 'Skills', c.skills.length ? c.skills.join(', ') : (c.suggestSkill ? c.suggestSkill + ' (suggested)' : '—'));
    if (c.workspace) kv += kvCell(I.folder, 'Worktree', '<span class="mono">' + esc(c.workspace) + '</span>');
    if (c.retries) kv += kvCell(I.cycle, 'Retries', c.retries[0] + ' / ' + c.retries[1]);
    if (c.budget && c.lane === 'progress') kv += kvCell(I.clock, 'Runtime', c.budget[0].toFixed(1) + ' / ' + c.budget[1] + 'm');
    kv += '</div>';

    // dependencies / decomposition
    var depSec = '';
    var kids = c.children.map(cardById).filter(Boolean);
    if (parent || kids.length || c.lane === 'backlog' || c.lane === 'ready') {
      var rows = '';
      if (parent) rows += depRow(parent, 'parent');
      kids.forEach(function (k) { rows += depRow(k, 'child'); });
      var note = '';
      if (parent && parent.lane !== 'done') note = '<div class="wb-dep-note">Stays ' + (c.lane === 'blocked' ? 'blocked' : 'gated') + ' until ' + parent.id + ' completes.</div>';
      else if (parent && parent.lane === 'done' && c.lane === 'blocked') note = '<div class="wb-dep-note">' + parent.id + ' is complete — this card is ready to promote.</div>';
      var allKidsDone = kids.length && kids.every(function (k) { return k.lane === 'done'; });
      if (allKidsDone) note = '<div class="wb-dep-note">All ' + kids.length + ' child cards are complete.</div>';
      if (rows || note) depSec = sec('Dependencies', '<div class="wb-deps">' + rows + '</div>' + note);
    }

    // evidence
    var evSec = renderEvidence(c);

    // violations
    var vSec = '';
    if (c.violations.length) {
      vSec = sec('Protocol violations', c.violations.map(function (v) {
        return '<div class="wb-ev violation">' + svg(I.shield, 2) + '<div class="ev-main"><span class="ev-name">' + esc(v) + '</span><span class="ev-sub">flagged by the dispatcher</span></div></div>';
      }).join(''));
    }

    d.innerHTML =
      '<div class="wb-drawer-head"><span class="wb-id">' + c.id + '</span>' +
        '<span class="wb-status-badge" data-lane="' + c.lane + '"><span class="sb-dot"></span>' + laneName + '</span>' +
        '<span class="spring"></span>' +
        '<span class="wb-action wb-edit-btn" data-act="edit">' + svg(I.file, 2) + 'Edit</span>' +
        '<span class="wb-drawer-close" id="wbDrawerClose">' + svg(I.close, 2) + '</span></div>' +
      '<div class="wb-drawer-body">' +
        '<div class="wb-drawer-title">' + esc(c.title) + '</div>' +
        '<div class="wb-drawer-desc">' + esc(c.desc || '') + '</div>' +
        own +
        sec('Routing', kv) +
        renderHandoff(c) +
        depSec + vSec +
        renderTabs(c) +
      '</div>' +
      '<div class="wb-drawer-foot">' + footActions(c) + '</div>';

    // wire
    d.querySelector('#wbDrawerClose').addEventListener('click', closeDrawer);
    d.querySelectorAll('[data-act]').forEach(function (a) {
      a.addEventListener('click', function () { doAct(a.getAttribute('data-act'), c.id); });
    });
    d.querySelectorAll('[data-open]').forEach(function (o) {
      o.addEventListener('click', function () { openDrawer(o.getAttribute('data-open')); });
    });
    d.querySelectorAll('[data-tab]').forEach(function (t) {
      t.addEventListener('click', function () { drawerTab = t.getAttribute('data-tab'); renderDrawer(c); });
    });
    d.querySelectorAll('[data-open-session]').forEach(function (s) {
      s.addEventListener('click', function (e) { e.stopPropagation(); openSession(s.getAttribute('data-open-session')); });
    });
    var ci = d.querySelector('#wbCommentInput'), cs = d.querySelector('#wbCommentSend');
    if (ci) {
      ci.addEventListener('input', function () {
        ci.style.height = 'auto'; ci.style.height = Math.min(ci.scrollHeight, 90) + 'px';
        cs.classList.toggle('ready', ci.value.trim().length > 0);
      });
      ci.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(c.id, ci.value); } });
      cs.addEventListener('click', function () { sendComment(c.id, ci.value); });
    }
  }

  function kvCell(icon, k, v) {
    return '<div class="wb-row">' + svg(icon, 2) + '<span class="rk">' + k + '</span><span class="rv' + (/mono/.test(v) ? ' mono' : '') + '">' + v + '</span></div>';
  }
  function sec(label, body) { return '<div class="wb-sec"><div class="wb-eyebrow">' + label + '</div>' + body + '</div>'; }
  function depRow(c, role) {
    return '<div class="wb-dep" data-lane="' + c.lane + '" data-open="' + c.id + '">' +
      '<span class="dep-dot"></span><span class="dep-id">' + c.id + '</span>' +
      '<span class="dep-title">' + esc(c.title) + '</span>' +
      '<span class="dep-state">' + (role === 'parent' ? '↑ ' : '') + c.lane + '</span></div>';
  }
  function linkify(t) { return t.replace(/\b(SB-\d+[a-c]?|MP-\d+)\b/g, '<code>$1</code>'); }
  function attr(s) { return esc(s).replace(/"/g, '&quot;'); }
  function openSession(id) { toast([[svgInline(I.link), null], ['handing off to session ' + id, null]], 'Session'); }

  // ---- session & handoff ----
  function renderHandoff(c) {
    var b = board(), ctx = [];
    ctx.push('repo ' + b.name + ' @ ' + b.branch);
    if (c.workspace) ctx.push('worktree ' + c.workspace);
    ctx.push((c.lane === 'triage' || (c.lane === 'backlog' && !c.specified)) ? 'rough notes \u2014 needs a spec' : 'card spec + notes');
    if (c.parent) ctx.push('parent ' + c.parent + ' for context');
    if (c.children && c.children.length) ctx.push(c.children.length + ' child cards');
    var artN = (c.evidence && (c.evidence.artifacts || []).length) || 0;
    if (artN) ctx.push(artN + ' attachment' + (artN === 1 ? '' : 's'));
    var session = c.session
      ? '<div class="wb-session"><span class="ss-ic">' + svg(I.link, 2) + '</span><div class="ss-main"><span class="ss-title">' + esc(c.session.title) + '</span><span class="ss-sub">' + esc(c.session.id) + ' \u00b7 ' + c.session.turns + ' turns</span></div><span class="wb-action ss-open" data-open-session="' + esc(c.session.id) + '">Open \u2197</span></div>'
      : '<div class="wb-dep-note">No session yet \u2014 a fresh chat is created and handed the context below when an agent claims this card.</div>';
    var preview = '<div class="wb-handoff"><span class="hc-label">' + svg(I.send, 2) + 'Agent receives</span><div class="hc-list">' + ctx.map(function (x) { return '<span class="hc-item">' + esc(x) + '</span>'; }).join('') + '</div></div>';
    return sec('Session &amp; handoff', session + preview);
  }

  // ---- diagnostics tabs ----
  function evidenceRows(c) {
    var e = c.evidence || {}, rows = '';
    if (e.proof) rows += '<div class="wb-ev proof">' + svg(I.shield, 2) + '<div class="ev-main"><span class="ev-name">Proof of completion</span><span class="ev-sub">verified \u00b7 green build</span></div></div>';
    (e.artifacts || []).forEach(function (a) {
      rows += '<div class="wb-ev">' + svg(I.file, 2) + '<div class="ev-main"><span class="ev-name">' + esc(a.name) + '</span><span class="ev-sub">' + esc(a.sub) + '</span></div><span class="ev-size">' + esc(a.size) + '</span></div>';
    });
    (e.runs || []).forEach(function (r) {
      rows += '<div class="wb-ev run">' + svg(I.link, 2) + '<div class="ev-main"><span class="ev-name">' + esc(r.label) + '</span><span class="ev-sub">' + esc(r.sub) + '</span></div></div>';
    });
    return rows || '<div class="wb-dep-note">No evidence attached yet. Workers attach proof, artifacts and runs as they go.</div>';
  }
  function logsBody(c) {
    var lines = logLines(c);
    if (!lines.length) return '<div class="wb-dep-note">No logs yet.</div>';
    return '<div class="wb-logblock">' + lines.map(function (l) { return '<div class="wb-logline">' + fmtLog(l) + '</div>'; }).join('') + '</div>';
  }
  function attemptsBody(c) {
    var at = c.attempts || [];
    if (!at.length) return '<div class="wb-dep-note">No attempts recorded \u2014 this card has not run yet.</div>';
    return at.map(function (a) {
      var ic = a.result === 'failed' ? I.xfail : (a.result === 'passed' ? I.check : I.cycle);
      return '<div class="wb-attempt ' + a.result + '">' + svg(ic, 2) + '<div class="at-main"><span class="at-name">Attempt ' + a.n + ' \u00b7 ' + a.result + '</span><span class="at-sub">' + esc(a.reason || '') + '</span></div><span class="at-ago">' + fmtAgo(a.ago) + ' ago</span></div>';
    }).join('');
  }
  function activityEvents(c) {
    var ev = [];
    if (c.createdAgo != null) ev.push({ ago: c.createdAgo, text: 'Card created', ic: I.plus });
    (c.attempts || []).forEach(function (a) { ev.push({ ago: a.ago, text: 'Attempt ' + a.n + ' ' + a.result + (a.reason ? ' \u2014 ' + a.reason : ''), ic: a.result === 'failed' ? I.xfail : (a.result === 'passed' ? I.check : I.cycle) }); });
    (c.comments || []).forEach(function (cm) { ev.push({ ago: cm.ago, text: (cm.who === 'you' ? 'You' : cm.who) + ' commented', ic: I.send }); });
    if (c.lane === 'review') ev.push({ ago: c.updatedAgo != null ? c.updatedAgo : 0, text: 'Opened for review', ic: I.eye });
    if (c.lane === 'done') ev.push({ ago: c.updatedAgo != null ? c.updatedAgo : 0, text: 'Shipped \u00b7 merged green', ic: I.check });
    ev.sort(function (a, b) { return a.ago - b.ago; });
    return ev;
  }
  function activityBody(c) {
    var ev = activityEvents(c);
    if (!ev.length) return '<div class="wb-dep-note">No activity yet.</div>';
    return '<div class="wb-timeline">' + ev.map(function (e) {
      return '<div class="wb-tl-row"><span class="tl-ic">' + svg(e.ic, 2) + '</span><span class="tl-text">' + esc(e.text) + '</span><span class="tl-ago">' + fmtAgo(e.ago) + ' ago</span></div>';
    }).join('') + '</div>';
  }
  function commentsBody(c) {
    var comm = (c.comments || []).map(function (cm) {
      var human = cm.who === 'you';
      return '<div class="wb-comment ' + (human ? 'human' : '') + '">' +
        (human ? '<span class="wb-avatar">Y</span>' : avatar(cm.who)) +
        '<div class="wb-comment-main"><div class="wb-comment-head"><span class="wb-comment-who">' + (human ? 'You' : cm.who) + '</span><span class="wb-comment-when">' + fmtAgo(cm.ago) + ' ago</span></div>' +
        '<div class="wb-comment-text">' + linkify(esc(cm.text)) + '</div></div></div>';
    }).join('');
    return '<div class="wb-comments">' + (comm || '<div class="wb-dep-note">No comments yet.</div>') + '</div>' +
      '<div class="wb-comment-box"><textarea id="wbCommentInput" rows="1" placeholder="Comment, or @mention an agent…"></textarea>' +
      '<button type="button" class="wb-comment-send" id="wbCommentSend">' + svg(I.send, 2) + '</button></div>';
  }
  function tabBody(c, tab) {
    if (tab === 'logs') return logsBody(c);
    if (tab === 'attempts') return attemptsBody(c);
    if (tab === 'activity') return activityBody(c);
    if (tab === 'comments') return commentsBody(c);
    return '<div class="wb-evidence">' + evidenceRows(c) + '</div>';
  }
  function renderTabs(c) {
    var evN = (c.evidence ? ((c.evidence.proof ? 1 : 0) + (c.evidence.artifacts || []).length + (c.evidence.runs || []).length) : 0);
    var tabs = [
      { id: 'evidence', label: 'Evidence', n: evN },
      { id: 'logs', label: 'Logs', n: logLines(c).length },
      { id: 'attempts', label: 'Attempts', n: (c.attempts || []).length },
      { id: 'activity', label: 'Activity', n: activityEvents(c).length },
      { id: 'comments', label: 'Comments', n: (c.comments || []).length }
    ];
    if (!tabs.some(function (t) { return t.id === drawerTab; })) drawerTab = 'evidence';
    var bar = '<div class="wb-tabs">' + tabs.map(function (t) {
      return '<button type="button" class="wb-tab' + (drawerTab === t.id ? ' on' : '') + '" data-tab="' + t.id + '">' + t.label + (t.n ? '<span class="tab-n">' + t.n + '</span>' : '') + '</button>';
    }).join('') + '</div>';
    return '<div class="wb-sec wb-tabsec">' + bar + '<div class="wb-tab-body">' + tabBody(c, drawerTab) + '</div></div>';
  }

  // ---- editable details ----
  function renderDrawerEdit(c, d) {
    d = d || document.getElementById('wbDrawer');
    d.innerHTML =
      '<div class="wb-drawer-head"><span class="wb-id">' + c.id + '</span>' +
        '<span class="wb-status-badge" data-lane="' + c.lane + '"><span class="sb-dot"></span>Editing</span>' +
        '<span class="spring"></span>' +
        '<span class="wb-drawer-close" id="wbDrawerClose">' + svg(I.close, 2) + '</span></div>' +
      '<div class="wb-drawer-body wb-edit">' +
        '<label class="wb-field"><span class="wb-flabel">Title</span><input class="wb-input" id="edTitle" value="' + attr(c.title) + '"></label>' +
        '<label class="wb-field"><span class="wb-flabel">Notes</span><textarea class="wb-input wb-ta" id="edDesc" rows="4">' + esc(c.desc || '') + '</textarea></label>' +
        '<div class="wb-field"><span class="wb-flabel">Status</span><div class="wb-pick wrap" id="edLane">' + LANES.map(function (l) { return '<button type="button" class="wb-pick-opt' + (l.id === c.lane ? ' on' : '') + '" data-lane="' + l.id + '">' + l.name + '</button>'; }).join('') + '</div></div>' +
        '<div class="wb-field"><span class="wb-flabel">Priority</span><div class="wb-pick" id="edPrio">' + [0, 1, 2].map(function (p) { return '<button type="button" class="wb-pick-opt' + (c.prio === p ? ' on' : '') + '" data-p="' + p + '">P' + p + '</button>'; }).join('') + '</div></div>' +
        '<div class="wb-field"><span class="wb-flabel">Owner / agent</span><div class="wb-pick wrap" id="edOwner">' + [''].concat(Object.keys(AGENTS)).map(function (a) { return '<button type="button" class="wb-pick-opt' + ((c.owner || '') === a ? ' on' : '') + '" data-owner="' + a + '">' + (a || 'Unassigned') + '</button>'; }).join('') + '</div></div>' +
        '<div class="wb-field"><span class="wb-flabel">Labels</span><div class="wb-chips" id="edLabels">' + (c.skills || []).map(function (s) { return '<span class="wb-chip" data-label="' + attr(s) + '">' + esc(s) + '<button type="button" class="chip-x">' + svg(I.close, 2) + '</button></span>'; }).join('') + '<input class="wb-chip-input" id="edLabelInput" placeholder="add label…"></div></div>' +
        '<label class="wb-field"><span class="wb-flabel">Schedule</span><input class="wb-input" id="edSched" value="' + attr(c.scheduledFor || '') + '" placeholder="e.g. Tomorrow 09:00"></label>' +
        '<label class="wb-field"><span class="wb-flabel">Source / context</span><input class="wb-input" id="edSource" value="' + attr(c.source ? c.source.label : '') + '" placeholder="where this came from"></label>' +
      '</div>' +
      '<div class="wb-drawer-foot">' +
        '<span class="wb-action' + (c.archived ? ' go' : ' danger') + '" id="edArchive">' + svg(I.arch, 2) + (c.archived ? 'Unarchive' : 'Archive') + '</span>' +
        '<span class="spring"></span>' +
        '<span class="wb-action" id="edCancel">Cancel</span>' +
        '<span class="wb-action go" id="edSave">' + svg(I.check, 2) + 'Save</span>' +
      '</div>';
    ['#edLane', '#edPrio', '#edOwner'].forEach(function (sel) {
      d.querySelectorAll(sel + ' .wb-pick-opt').forEach(function (b) {
        b.addEventListener('click', function () {
          d.querySelectorAll(sel + ' .wb-pick-opt').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
        });
      });
    });
    d.querySelectorAll('#edLabels .chip-x').forEach(function (x) { x.addEventListener('click', function () { x.closest('.wb-chip').remove(); }); });
    var li = d.querySelector('#edLabelInput');
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault(); var v = li.value.trim(); if (!v) return;
        var chip = document.createElement('span'); chip.className = 'wb-chip'; chip.setAttribute('data-label', v);
        chip.innerHTML = esc(v) + '<button type="button" class="chip-x">' + svg(I.close, 2) + '</button>';
        chip.querySelector('.chip-x').addEventListener('click', function () { chip.remove(); });
        li.parentNode.insertBefore(chip, li); li.value = '';
      }
    });
    d.querySelector('#wbDrawerClose').addEventListener('click', function () { editing = false; openDrawer(c.id); });
    d.querySelector('#edCancel').addEventListener('click', function () { editing = false; openDrawer(c.id); });
    d.querySelector('#edArchive').addEventListener('click', function () { c.archived = !c.archived; editing = false; rerenderAll(); if (c.archived && !wbFilter.archived) closeDrawer(); else openDrawer(c.id); });
    d.querySelector('#edSave').addEventListener('click', function () { saveEdit(c, d); });
  }
  function saveEdit(c, d) {
    var newLane = d.querySelector('#edLane .wb-pick-opt.on').getAttribute('data-lane');
    var t = d.querySelector('#edTitle').value.trim(); if (t) c.title = t;
    c.desc = d.querySelector('#edDesc').value;
    c.prio = parseInt(d.querySelector('#edPrio .wb-pick-opt.on').getAttribute('data-p'), 10);
    var ow = d.querySelector('#edOwner .wb-pick-opt.on').getAttribute('data-owner');
    c.owner = ow || null;
    c.skills = [].map.call(d.querySelectorAll('#edLabels .wb-chip'), function (ch) { return ch.getAttribute('data-label'); });
    var sched = d.querySelector('#edSched').value.trim(); if (sched) c.scheduledFor = sched;
    var src = d.querySelector('#edSource').value.trim();
    c.source = src ? { kind: (c.source && c.source.kind) || 'manual', label: src } : null;
    c.updatedAgo = 0;
    editing = false;
    if (newLane !== c.lane) transitionTo(c, newLane);
    rerenderAll(); openDrawer(c.id);
    toast([[svgInline(I.check), null], ['saved ' + c.id, null]], 'Card updated');
  }

  function renderEvidence(c) {
    var e = c.evidence || {}, rows = '';
    if (e.proof) rows += '<div class="wb-ev proof">' + svg(I.shield, 2) + '<div class="ev-main"><span class="ev-name">Proof of completion</span><span class="ev-sub">verified · green build</span></div></div>';
    (e.artifacts || []).forEach(function (a) {
      rows += '<div class="wb-ev">' + svg(I.file, 2) + '<div class="ev-main"><span class="ev-name">' + esc(a.name) + '</span><span class="ev-sub">' + esc(a.sub) + '</span></div><span class="ev-size">' + esc(a.size) + '</span></div>';
    });
    (e.runs || []).forEach(function (r) {
      rows += '<div class="wb-ev run">' + svg(I.link, 2) + '<div class="ev-main"><span class="ev-name">' + esc(r.label) + '</span><span class="ev-sub">' + esc(r.sub) + '</span></div>' + svg(I.chev, 2.2).replace('<svg', '<svg style="width:13px;height:13px;color:var(--txt-section)"') + '</div>';
    });
    (e.logs || []).forEach(function (l) {
      rows += '<div class="wb-log">' + l.replace(/\[(\d\d:\d\d:\d\d)\]/g, '<span class="lt">[$1]</span>').replace(/(heartbeat ok|ready|passed)/g, '<span class="ok">$1</span>') + '</div>';
    });
    if (!rows) rows = '<div class="wb-dep-note">No evidence attached yet. Workers attach proof, artifacts and logs as they run.</div>';
    return sec('Evidence', '<div class="wb-evidence">' + rows + '</div>');
  }

  function footActions(c) {
    var a = [];
    if (c.archived) {
      a.push(actBtn('unarchive', I.arch, 'Restore', 'go'));
    } else if (c.lane === 'triage') {
      a.push(actBtn('move:backlog', I.check, 'Accept', 'go'));
      a.push(actBtn('move:scheduled', I.cal, 'Schedule'));
      a.push(actBtn('decompose', I.split, 'Decompose'));
      a.push(actBtn('dismiss', I.close, 'Dismiss', '', true));
    } else if (c.lane === 'backlog') {
      if (!c.specified) a.push(actBtn('specify', I.check, 'Specify', 'go'));
      else a.push(actBtn('move:ready', I.check, 'Mark ready', 'go'));
      a.push(actBtn('move:todo', I.circle, 'To do'));
      a.push(actBtn('decompose', I.split, 'Decompose'));
    } else if (c.lane === 'todo') {
      a.push(actBtn('move:ready', I.check, 'Mark ready', 'go'));
      a.push(actBtn('move:scheduled', I.cal, 'Schedule'));
      a.push(actBtn('block', I.block, 'Block'));
    } else if (c.lane === 'scheduled') {
      a.push(actBtn('move:ready', I.play, 'Make ready now', 'go'));
      a.push(actBtn('reschedule', I.cal, 'Reschedule'));
    } else if (c.lane === 'ready') {
      a.push(actBtn('claim', I.user, 'Claim', 'go'));
      a.push(actBtn('move:scheduled', I.cal, 'Schedule'));
      a.push(actBtn('decompose', I.split, 'Decompose'));
      a.push(actBtn('block', I.block, 'Block'));
    } else if (c.lane === 'progress') {
      a.push(actBtn('move:review', I.eye, 'Send to review', 'go'));
      a.push(actBtn('complete', I.check, 'Complete'));
      a.push(actBtn('block', I.block, 'Block'));
    } else if (c.lane === 'review') {
      a.push(actBtn('complete', I.check, 'Approve \u2192 Done', 'go complete'));
      a.push(actBtn('changes', I.block, 'Request changes'));
      a.push(actBtn('move:progress', I.cycle, 'Re-run'));
    } else if (c.lane === 'blocked') {
      var parent = depParent(c);
      if (!parent || parent.lane === 'done') a.push(actBtn('promote', I.cycle, 'Promote to ready', 'go'));
      a.push(actBtn('unblock', I.block, 'Unblock'));
    } else if (c.lane === 'done') {
      a.push(actBtn('archive', I.arch, 'Archive', '', true));
    }
    a.push('<span class="spring"></span>');
    a.push(actBtn('watch', I.eye, 'Watch', 'foot-aux'));
    return a.join('');
  }
  function actBtn(act, icon, label, cls, danger) {
    return '<span class="wb-action ' + (cls || '') + (danger ? ' danger' : '') + '" data-act="' + act + '">' + svg(icon, 2) + label + '</span>';
  }

  // ============ ACTIONS ============
  function moveCard(c, lane, flash) {
    c.lane = lane;
    if (flash) freshIds[c.id] = true;
  }
  function nextWindow() { return ['In 1h', 'Tonight 02:00', 'Tomorrow 09:00', 'Next window'][Math.floor(Math.random() * 4)]; }

  // ============ DRAG & DROP ============
  // Cards drag between lanes (and reorder within a lane). A drop into a new
  // lane performs that lane's natural transition so the board stays consistent
  // — drop into "in progress" claims an agent, into "done" ships with proof, etc.
  var dragId = null, dropMarker = null;
  // Pointer-event drag (no native HTML5 DnD — that gave throttled/sticky
  // updates, a blurry composited drag layer, and a stuck duplicate ghost
  // whenever the board rerendered before dragend fired). The source card
  // stays in place, faded; a fixed clone follows the pointer, moved once
  // per animation frame.
  var dragArm = null;                          // pressed, not yet past threshold
  var dragFollow = null, dragSourceEl = null, dropLaneEl = null;
  var dragOff = { x: 0, y: 0 }, dragPos = { x: 0, y: 0 }, dragRAF = 0;
  var dragClickGuard = 0;                      // swallow the click fired right after a drop

  function startDrag(card, e) {
    dragId = card.getAttribute('data-id');
    if (!dragId) return;
    var rect = card.getBoundingClientRect();
    // The board may be zoomed to fit (.app is transform: scale(<1)) so rect is
    // the SCALED size while offsetWidth is the true layout size. The clone is
    // laid out at true width, then shrunk with zoom — zoom re-lays-out at the
    // smaller size so text stays crisp (transform:scale rasterizes, then blurs).
    var scale = card.offsetWidth ? rect.width / card.offsetWidth : 1;
    dragOff.x = e.clientX - rect.left;
    dragOff.y = e.clientY - rect.top;
    var clone = card.cloneNode(true);
    clone.classList.remove('flash', 'entering');
    clone.classList.add('wb-drag-ghost');
    clone.style.width = card.offsetWidth + 'px';
    if (Math.abs(scale - 1) > 0.001) clone.style.zoom = scale;
    var follow = document.createElement('div');
    follow.className = 'wb-drag-ghost-wrap';
    follow.appendChild(clone);
    follow.style.transform = 'translate3d(' + Math.round(rect.left) + 'px,' + Math.round(rect.top) + 'px,0)';
    document.body.appendChild(follow);
    dragFollow = follow;
    dragSourceEl = card;
    card.classList.add('wb-dragging');
    document.body.classList.add('wb-drag-active');
    try { card.setPointerCapture(e.pointerId); } catch (err) {}
    try { window.getSelection().removeAllRanges(); } catch (err) {}
  }

  function dragTick() {
    dragRAF = 0;
    if (!dragId || !dragFollow) return;
    dragFollow.style.transform = 'translate3d(' + Math.round(dragPos.x - dragOff.x) + 'px,' + Math.round(dragPos.y - dragOff.y) + 'px,0)';
    var over = document.elementFromPoint(dragPos.x, dragPos.y);
    var laneEl = over ? over.closest('.wb-lane-cards') : null;
    if (!laneEl && over) {
      var lane = over.closest('.wb-lane');
      if (lane) laneEl = lane.querySelector('.wb-lane-cards');
    }
    if (laneEl !== dropLaneEl) {
      root.querySelectorAll('.wb-lane.drop-target').forEach(function (l) { l.classList.remove('drop-target'); });
      if (laneEl) laneEl.closest('.wb-lane').classList.add('drop-target');
      dropLaneEl = laneEl;
    }
    if (laneEl) {
      var after = dragAfter(laneEl, dragPos.y), m = dndMarker();
      // only touch the DOM when the slot actually changes — reinserting the
      // marker every frame causes layout jitter under the pointer
      if (after ? (m.nextSibling !== after) : (m.parentNode !== laneEl || m.nextSibling !== null)) {
        if (after) laneEl.insertBefore(m, after); else laneEl.appendChild(m);
      }
    } else if (dropMarker && dropMarker.parentNode) {
      dropMarker.parentNode.removeChild(dropMarker);
    }
  }

  function onDragMove(e) {
    if (!dragArm || e.pointerId !== dragArm.pointerId) return;
    if (!dragId) {
      if (Math.abs(e.clientX - dragArm.x) + Math.abs(e.clientY - dragArm.y) < 6) return;
      startDrag(dragArm.card, e);
      if (!dragId) { unbindDragListeners(); return; }
    }
    dragPos.x = e.clientX; dragPos.y = e.clientY;
    if (!dragRAF) dragRAF = requestAnimationFrame(dragTick);
  }

  function onDragUp(e) {
    if (!dragArm || e.pointerId !== dragArm.pointerId) return;
    if (!dragId) { unbindDragListeners(); return; }
    dragClickGuard = Date.now() + 400;
    var laneEl = dropLaneEl;
    var id = dragId;
    var targetLane = laneEl ? laneEl.getAttribute('data-lane') : null;
    var after = laneEl ? dragAfter(laneEl, e.clientY) : null;
    var beforeId = after ? after.getAttribute('data-id') : null;
    endDrag();
    if (targetLane) performDrop(id, targetLane, beforeId);
  }

  function onDragCancel(e) {
    if (!dragArm || e.pointerId !== dragArm.pointerId) return;
    if (dragId) dragClickGuard = Date.now() + 400;
    endDrag();
  }

  function endDrag() {
    if (dragRAF) { cancelAnimationFrame(dragRAF); dragRAF = 0; }
    if (dragFollow && dragFollow.parentNode) dragFollow.parentNode.removeChild(dragFollow);
    dragFollow = null;
    if (dragSourceEl) { dragSourceEl.classList.remove('wb-dragging'); dragSourceEl = null; }
    document.body.classList.remove('wb-drag-active');
    dndClear(); dragId = null; dropLaneEl = null;
    unbindDragListeners();
  }

  function unbindDragListeners() {
    dragArm = null;
    window.removeEventListener('pointermove', onDragMove, true);
    window.removeEventListener('pointerup', onDragUp, true);
    window.removeEventListener('pointercancel', onDragCancel, true);
  }

  function dndMarker() {
    if (!dropMarker) { dropMarker = document.createElement('div'); dropMarker.className = 'wb-drop-marker'; }
    return dropMarker;
  }
  function dndClear() {
    if (dropMarker && dropMarker.parentNode) dropMarker.parentNode.removeChild(dropMarker);
    root.querySelectorAll('.wb-lane.drop-target').forEach(function (l) { l.classList.remove('drop-target'); });
  }
  function dragAfter(container, y) {
    var els = [].slice.call(container.querySelectorAll('.wb-card:not(.wb-dragging)'));
    var best = { off: -Infinity, el: null };
    els.forEach(function (child) {
      var box = child.getBoundingClientRect();
      var off = y - box.top - box.height / 2;
      if (off < 0 && off > best.off) best = { off: off, el: child };
    });
    return best.el;
  }
  function bindDnD(el) {
    el.querySelectorAll('.wb-card').forEach(function (card) {
      card.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        if (e.target.closest('[data-claim]')) return;
        if (dragArm || dragId) return;
        e.preventDefault();   // stops text-selection drags; click still fires
        dragArm = { card: card, x: e.clientX, y: e.clientY, pointerId: e.pointerId };
        window.addEventListener('pointermove', onDragMove, true);
        window.addEventListener('pointerup', onDragUp, true);
        window.addEventListener('pointercancel', onDragCancel, true);
      });
    });
  }

  function performDrop(id, targetLane, beforeId) {
    var c = cardById(id); if (!c || beforeId === id) return;
    if (c.lane !== targetLane) transitionTo(c, targetLane);
    reposition(c, targetLane, beforeId);
    freshIds[c.id] = true;
    rerenderAll();
    if (selected && cardById(selected)) renderDrawer(cardById(selected));
  }

  function reposition(c, targetLane, beforeId) {
    var arr = board().cards;
    var ci = arr.indexOf(c); if (ci >= 0) arr.splice(ci, 1);
    if (beforeId) {
      var bi = -1;
      for (var j = 0; j < arr.length; j++) { if (arr[j].id === beforeId) { bi = j; break; } }
      if (bi >= 0) { arr.splice(bi, 0, c); return; }
    }
    var lastIdx = -1;
    for (var i = 0; i < arr.length; i++) if (arr[i].lane === targetLane && !arr[i].hidden) lastIdx = i;
    if (lastIdx >= 0) arr.splice(lastIdx + 1, 0, c); else arr.push(c);
  }

  function transitionTo(c, lane) {
    var from = c.lane;
    if (from === lane) return;
    if (from === 'done' && board().throughput > 0) board().throughput--;
    c.lane = lane;
    if (lane === 'progress') {
      if (!c.owner) c.owner = c.suggestAgent || pickIdleAgent();
      c.startedTs = now(); c.lastBeatTs = now();
      c.budget = [0.2, 8];
      if (!c.retries) c.retries = [0, 2];
      if (!c.workspace) c.workspace = 'eclipse/' + c.id.toLowerCase();
      c.blockedReason = null;
    } else if (lane === 'ready') {
      c.owner = null; c.startedTs = null; c.lastBeatTs = null;
      c.specified = true; c.blockedReason = null;
    } else if (lane === 'backlog') {
      c.owner = null; c.startedTs = null; c.lastBeatTs = null; c.blockedReason = null;
    } else if (lane === 'triage') {
      c.owner = null; c.startedTs = null; c.lastBeatTs = null; c.blockedReason = null;
    } else if (lane === 'todo') {
      c.owner = null; c.startedTs = null; c.lastBeatTs = null; c.blockedReason = null;
    } else if (lane === 'scheduled') {
      c.owner = null; c.startedTs = null; c.lastBeatTs = null; c.blockedReason = null;
      if (!c.scheduledFor) c.scheduledFor = nextWindow();
    } else if (lane === 'review') {
      c.startedTs = null; c.lastBeatTs = null; c.blockedReason = null;
      if (!c.reviewer) c.reviewer = 'you';
    } else if (lane === 'blocked') {
      if (!c.blockedReason) c.blockedReason = 'Blocked manually.';
    } else if (lane === 'done') {
      c.evidence = c.evidence || {};
      if (!c.evidence.proof) c.evidence.proof = true;
      board().throughput++;
      promoteDependents(c);
    }
    var ln = LANES.find(function (l) { return l.id === lane; });
    pushNotif('<b>' + c.id + '</b> moved to <b>' + (ln ? ln.name : lane) + '</b>', c.id);
  }
  function doAct(act, id) {
    var c = cardById(id); if (!c) return;
    if (act.indexOf('move:') === 0) {
      transitionTo(c, act.slice(5)); freshIds[c.id] = true;
      rerenderAll(); if (selected) openDrawer(id); return;
    }
    switch (act) {
      case 'claim': claim(id); return;
      case 'release':
        moveCard(c, 'ready', true); c.owner = null; c.startedTs = null; c.lastBeatTs = null;
        pushNotif('<b>' + c.id + '</b> was released back to ready', c.id);
        rerenderAll(); openDrawer(id); return;
      case 'reassign':
        var names = Object.keys(AGENTS), i = names.indexOf(c.owner);
        c.owner = names[(i + 1) % names.length]; c.lastBeatTs = now();
        pushNotif('<b>' + c.id + '</b> reassigned to <b>' + c.owner + '</b>', c.id);
        renderHeader(); renderBoard(); openDrawer(id); return;
      case 'complete':
        moveCard(c, 'done', true);
        c.evidence = c.evidence || {}; c.evidence.proof = true;
        c.comments.unshift({ who: c.owner || 'Mencius', ago: 0, text: 'Merged green. Proof of completion attached.' });
        board().throughput++;
        pushNotif('<b>' + (c.owner || 'agent') + '</b> completed <b>' + c.id + '</b> with proof', c.id);
        promoteDependents(c);
        rerenderAll(); openDrawer(id); return;
      case 'block':
        moveCard(c, 'blocked', false); c.blockedReason = 'Blocked manually.';
        pushNotif('<b>' + c.id + '</b> was blocked', c.id);
        rerenderAll(); openDrawer(id); return;
      case 'unblock':
        moveCard(c, c.owner ? 'progress' : 'ready', true); c.blockedReason = null;
        if (c.lane === 'progress') c.lastBeatTs = now();
        rerenderAll(); openDrawer(id); return;
      case 'promote':
        moveCard(c, 'ready', true);
        pushNotif('<b>' + c.id + '</b> promoted to ready', c.id);
        rerenderAll(); openDrawer(id); return;
      case 'specify':
        c.specified = true; moveCard(c, 'ready', true);
        rerenderAll(); openDrawer(id); return;
      case 'decompose': decompose(c); return;
      case 'archive':
        c.archived = true; closeDrawer(); rerenderAll();
        toast([[svgInline(I.arch), null], ['archived ' + c.id, null]], 'Archived'); return;
      case 'unarchive':
        c.archived = false; pushNotif('<b>' + c.id + '</b> restored from archive', c.id);
        rerenderAll(); openDrawer(id); return;
      case 'dismiss':
        c.archived = true; closeDrawer(); rerenderAll();
        toast([[svgInline(I.close), null], ['dismissed ' + c.id + ' to archive', null]], 'Triage'); return;
      case 'reschedule':
        c.scheduledFor = nextWindow();
        pushNotif('<b>' + c.id + '</b> rescheduled \u00b7 ' + c.scheduledFor, c.id);
        rerenderAll(); openDrawer(id); return;
      case 'changes':
        moveCard(c, 'blocked', false); c.blockedReason = 'Changes requested in review.';
        c.comments.unshift({ who: 'you', ago: 0, text: 'Requested changes in review.' });
        pushNotif('<b>' + c.id + '</b> sent back for changes', c.id);
        rerenderAll(); openDrawer(id); return;
      case 'edit':
        editing = true; renderDrawer(c); return;
      case 'watch':
        toast([[svgInline(I.eye), null], ['watching ' + c.id, null]], 'Subscribed'); return;
    }
  }

  function claim(id) {
    var c = cardById(id); if (!c || c.lane !== 'ready') return;
    c.owner = c.suggestAgent || pickIdleAgent();
    moveCard(c, 'progress', true);
    c.startedTs = now(); c.lastBeatTs = now();
    if (!c.budget) c.budget = [0.2, 8];
    if (!c.retries) c.retries = [0, 2];
    if (!c.workspace) c.workspace = 'eclipse/' + c.id.toLowerCase();
    c.evidence = c.evidence || {};
    c.evidence.logs = ['[now] claimed by ' + c.owner + '\n[now] worktree ' + c.workspace + ' ready\n[now] heartbeat ok'];
    pushNotif('<b>' + c.owner + '</b> claimed <b>' + c.id + '</b>', c.id);
    rerenderAll();
    if (selected === id) openDrawer(id);
  }
  function pickIdleAgent() {
    var busy = {}; board().cards.forEach(function (c) { if (c.lane === 'progress' && c.owner) busy[c.owner] = 1; });
    var free = Object.keys(AGENTS).filter(function (a) { return !busy[a]; });
    return free[Math.floor(Math.random() * free.length)] || 'Kepler';
  }

  function promoteDependents(done) {
    board().cards.forEach(function (c) {
      if (c.lane === 'blocked' && c.parent === done.id) { moveCard(c, 'ready', true); pushNotif('<b>' + c.id + '</b> unblocked by <b>' + done.id + '</b>', c.id); }
    });
  }

  function decompose(c) {
    var n = curBoard === 'shared-brain' ? 'SB-' : 'MP-';
    var k1 = mkCard({ id: n + (nextId++), title: c.title.replace(/^Add (a |an )?/i, '') + ' — core', lane: 'backlog', prio: c.prio, skills: c.skills.slice(), parent: c.id, specified: true, desc: 'Child of ' + c.id + '. Core implementation slice.' });
    var k2 = mkCard({ id: n + (nextId++), title: c.title.replace(/^Add (a |an )?/i, '') + ' — polish & tests', lane: 'backlog', prio: 2, skills: c.skills.slice(), parent: c.id, specified: true, desc: 'Child of ' + c.id + '. Edge cases, reduced-motion and tests.' });
    board().cards.push(k1, k2);
    c.children = (c.children || []).concat([k1.id, k2.id]);
    c.comments.unshift({ who: 'you', ago: 0, text: 'Decomposed into ' + k1.id + ' and ' + k2.id + '.' });
    freshIds[k1.id] = freshIds[k2.id] = true;
    pushNotif('<b>' + c.id + '</b> decomposed into 2 cards', c.id);
    rerenderAll(); openDrawer(c.id);
    toast([[svgInline(I.split), null], ['split ' + c.id + ' into 2 child cards', null]], 'Decomposed');
  }

  function sendComment(id, text) {
    text = (text || '').trim(); if (!text) return;
    var c = cardById(id); if (!c) return;
    c.comments.push({ who: 'you', ago: 0, text: text });
    drawerTab = 'comments';
    openDrawer(id);
    var body = document.querySelector('.wb-drawer-body'); if (body) body.scrollTop = body.scrollHeight;
  }

  function openNewCard(lane) {
    closeDrawer();
    document.getElementById('wbBoardMenu').classList.remove('open'); closeNotif();
    var laneCardsEl = document.querySelector('.wb-lane-cards[data-lane="' + lane + '"]');
    if (!laneCardsEl) return;
    if (laneCardsEl.querySelector('.wb-newcard')) { laneCardsEl.querySelector('textarea').focus(); return; }
    var prio = 1;
    var form = document.createElement('div');
    form.className = 'wb-newcard';
    form.innerHTML =
      '<textarea rows="2" placeholder="Describe the work…"></textarea>' +
      '<div class="wb-newcard-row"><div class="wb-prio-seg">' +
        ['0', '1', '2'].map(function (p) { return '<span class="pseg' + (p === '1' ? ' on' : '') + '" data-p="' + p + '">P' + p + '</span>'; }).join('') +
      '</div><span class="spring"></span>' +
      '<span class="wb-mini-btn ghost" data-x>Cancel</span><span class="wb-mini-btn go" data-go>Create</span></div>';
    laneCardsEl.insertBefore(form, laneCardsEl.firstChild);
    var ta = form.querySelector('textarea'); ta.focus();
    form.querySelectorAll('[data-p]').forEach(function (p) {
      p.addEventListener('click', function () {
        form.querySelectorAll('[data-p]').forEach(function (x) { x.classList.remove('on'); });
        p.classList.add('on'); prio = parseInt(p.getAttribute('data-p'), 10);
      });
    });
    form.querySelector('[data-x]').addEventListener('click', function () { renderBoard(); });
    function create() {
      var t = ta.value.trim(); if (!t) { renderBoard(); return; }
      var pfx = curBoard === 'shared-brain' ? 'SB-' : 'MP-';
      var card = mkCard({ id: pfx + (nextId++), title: t, lane: lane, prio: prio, skills: [], specified: lane === 'ready' });
      board().cards.push(card); freshIds[card.id] = true;
      pushNotif('You created <b>' + card.id + '</b>', card.id);
      rerenderAll();
    }
    form.querySelector('[data-go]').addEventListener('click', create);
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); create(); } if (e.key === 'Escape') renderBoard(); });
  }

  // ============ DISPATCHER ============
  function toggleAuto() {
    autoDispatch = !autoDispatch;
    document.getElementById('wbDispatch').classList.toggle('auto', autoDispatch);
    if (autoDispatch) { toast([[svgInline(I.cycle), null], ['auto-dispatch on · passing every 30s', null]], 'Auto'); scheduleAuto(); }
  }
  var autoTimer = null;
  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (!autoDispatch) return;
    autoTimer = setTimeout(function () { runDispatch(); scheduleAuto(); }, 30000);
  }

  function dispatchPlan() {
    var plan = { reclaim: [], block: [], promote: [], claim: [], queued: [] };
    var busy = {};
    allCards().forEach(function (c) {
      if (c.lane === 'progress' && c.owner && !isStale(c) && !overBudget(c)) busy[c.owner] = 1;
    });
    allCards().forEach(function (c) {
      if (c.archived) return;
      if (c.lane === 'progress' && overBudget(c)) plan.block.push(c);
      else if (c.lane === 'progress' && isStale(c)) plan.reclaim.push(c);
      else if (c.lane === 'blocked' && c.parent) { var p = cardById(c.parent); if (p && p.lane === 'done') plan.promote.push(c); }
    });
    var capacity = Object.keys(AGENTS).filter(function (a) { return !busy[a]; }).length;
    allCards().filter(function (c) { return c.lane === 'ready' && !c.archived; })
      .sort(function (a, b) { return a.prio - b.prio; })
      .forEach(function (c, i) { (i < capacity ? plan.claim : plan.queued).push(c); });
    return plan;
  }
  function openDispatchPreflight() {
    var p = document.getElementById('wbPreflight');
    if (p.classList.contains('open')) { p.classList.remove('open'); return; }
    var plan = dispatchPlan();
    var rows = [
      ['Dispatch to agents', plan.claim, I.play],
      ['Promote (deps cleared)', plan.promote, I.cycle],
      ['Reclaim (stale claim)', plan.reclaim, I.clock],
      ['Auto-block (over budget)', plan.block, I.block]
    ].filter(function (r) { return r[1].length; });
    var total = plan.claim.length + plan.promote.length + plan.reclaim.length + plan.block.length;
    var body = total ? rows.map(function (r) {
      return '<div class="pf-row">' + svg(r[2], 2) + '<span class="pf-n">' + r[1].length + '</span><span class="pf-l">' + r[0] + '</span><span class="pf-ids">' + r[1].slice(0, 3).map(function (c) { return c.id; }).join('  ') + (r[1].length > 3 ? '  +' + (r[1].length - 3) : '') + '</span></div>';
    }).join('') : '<div class="pf-empty">' + svg(I.check, 2) + 'Nothing to do \u2014 every lane is balanced.</div>';
    var queued = plan.queued.length ? '<div class="pf-queue">' + svg(I.clock, 2) + plan.queued.length + ' ready card' + (plan.queued.length === 1 ? '' : 's') + ' will stay queued \u2014 no idle agents.</div>' : '';
    p.innerHTML = '<div class="pf-head">' + svg(I.cycle, 2) + 'Dispatcher preflight</div><div class="pf-body">' + body + '</div>' + queued +
      '<div class="pf-foot"><span class="wb-action" id="pfCancel">Cancel</span><span class="wb-action go" id="pfRun">' + svg(I.cycle, 2) + (total ? 'Run pass' : 'Run anyway') + '</span></div>';
    var disp = document.getElementById('wbDispatch'), rr = root.getBoundingClientRect(), ar = disp.getBoundingClientRect();
    p.style.left = (ar.left - rr.left) + 'px';
    p.style.top = (ar.bottom - rr.top + 8) + 'px';
    clampPop(p);
    p.querySelector('#pfCancel').addEventListener('click', function () { p.classList.remove('open'); });
    p.querySelector('#pfRun').addEventListener('click', function () { p.classList.remove('open'); runDispatch(); });
    document.getElementById('wbBoardMenu').classList.remove('open'); closeNotif(); closePop();
    p.classList.add('open');
  }
  function runDispatch() {
    var disp = document.getElementById('wbDispatch');
    if (disp.classList.contains('running')) return;
    disp.classList.add('running');
    var plan = dispatchPlan();
    plan.block.forEach(function (c) {
      moveCard(c, 'blocked', true); c.blockedReason = 'Runtime budget exceeded \u2014 auto-blocked.';
      pushNotif('Dispatcher blocked <b>' + c.id + '</b> (runtime budget)', c.id);
    });
    plan.reclaim.forEach(function (c) {
      var prev = c.owner; moveCard(c, 'ready', true); c.owner = null; c.startedTs = null; c.lastBeatTs = null;
      pushNotif('Dispatcher reclaimed <b>' + c.id + '</b> from <b>' + prev + '</b>', c.id);
    });
    plan.promote.forEach(function (c) {
      moveCard(c, 'ready', true); pushNotif('Dispatcher promoted <b>' + c.id + '</b>', c.id);
    });
    plan.claim.forEach(function (c) {
      var ag = pickIdleAgent(); c.owner = ag; moveCard(c, 'progress', true);
      c.startedTs = now(); c.lastBeatTs = now();
      if (!c.budget) c.budget = [0.2, 8];
      if (!c.retries) c.retries = [0, 2];
      if (!c.workspace) c.workspace = 'eclipse/' + c.id.toLowerCase();
      if (!c.session) c.session = { id: 'chat-' + Math.random().toString(16).slice(2, 6), title: c.title.slice(0, 28), turns: 1 };
      c.evidence = c.evidence || {};
      c.evidence.logs = (c.evidence.logs || []).concat(['[now] dispatched to ' + ag + '\n[now] worktree ' + c.workspace + ' ready\n[now] heartbeat ok']);
      pushNotif('Dispatcher dispatched <b>' + c.id + '</b> to <b>' + ag + '</b>', c.id);
    });
    setTimeout(function () {
      disp.classList.remove('running');
      rerenderAll();
      if (selected) { var s = cardById(selected); if (s) openDrawer(selected); else closeDrawer(); }
      var segs = [];
      if (plan.claim.length) segs.push([plan.claim.length, 'dispatched']);
      if (plan.promote.length) segs.push([plan.promote.length, 'promoted']);
      if (plan.reclaim.length) segs.push([plan.reclaim.length, 'reclaimed']);
      if (plan.block.length) segs.push([plan.block.length, 'blocked']);
      if (plan.queued.length) segs.push([plan.queued.length, 'queued']);
      if (!segs.length) toast([[svgInline(I.check), null], ['everything\u2019s on track \u2014 no changes', null]], 'Dispatcher pass');
      else toast(segs, 'Dispatcher pass');
    }, 780);
  }

  // ============ TOAST ============
  var toastTimer = null;
  function toast(segs, label) {
    var t = document.getElementById('wbToast');
    var inner = '<span class="tz-ic">' + svg(I.cycle, 2) + '</span><span class="tz-seg"><b>' + esc(label) + '</b></span>';
    segs.forEach(function (s) {
      inner += '<span class="tz-div"></span>';
      if (s[1] == null) inner += '<span class="tz-seg">' + s[0] + '</span>';
      else inner += '<span class="tz-seg"><b>' + s[0] + '</b> ' + esc(s[1]) + '</span>';
    });
    t.innerHTML = inner;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3400);
  }
  function svgInline(d) { return svg(d, 2).replace('<svg', '<svg style="width:14px;height:14px;color:var(--txt-dim);vertical-align:-2px"'); }

  // ============ ORCHESTRATION ============
  function rerenderAll() { renderHeader(); renderBoard(); }

  // ============ KEYBOARD OPERABILITY (audit) ============
  // The board is built from click-only <div>/<span> controls. Make them focusable
  // and Enter/Space-activatable; native <button>s (filters, view seg, tabs, claim,
  // comment send) already work and are excluded. Focus visibility = the moonlight
  // halo in CSS. Escape is already wired below.
  var WB_KEY = '.wb-card,.wb-list-row,.wb-switch,.wb-bell,.wb-check,.wb-dispatch,' +
    '.wb-newbtn,.wb-action,.wb-board-opt,.wb-pop-opt,.wb-notif-item,.wb-dep,' +
    '.wb-ev.run,.wb-lane-add,.wb-drawer-close,.an-clear,.nclear,.pseg,.wb-mini-btn';
  function wbStamp(el) {
    if (!el || el.nodeType !== 1 || !el.matches || !el.matches(WB_KEY)) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (el.tagName !== 'BUTTON' && !el.hasAttribute('role')) el.setAttribute('role', 'button');
  }
  function wbStampAll(scope) {
    if (!scope || scope.nodeType !== 1) return;
    wbStamp(scope);
    if (scope.querySelectorAll) scope.querySelectorAll(WB_KEY).forEach(wbStamp);
  }
  // ---- data bridge — mobile surface (Workboard Mobile.html) ----
  // One seed-data + status model, two renderers. The mobile page loads this
  // module without #workboardView, takes WB_CORE, and stops here.
  window.WB_CORE = {
    LANES: LANES, BOARDS: BOARDS, NOTIFS: NOTIFS, AGENTS: AGENTS, ICONS: I, STALE: STALE,
    svg: svg, esc: esc, avatar: avatar, plural: plural, fmtAgo: fmtAgo, fmtMMSS: fmtMMSS, now: now,
    statusMeta: statusMeta, statusChip: statusChip, prioHTML: prioHTML,
    isStale: isStale, overBudget: overBudget, lastAttempt: lastAttempt,
    laneName: laneName, cardById: cardById, depParent: depParent,
    // mobile v2 bridge — full card anatomy + live-process texture, so the
    // pocket renderer shares one status model AND one card vocabulary.
    laneIcon: laneIcon, emptyText: emptyText, failing: failing, cardFlag: cardFlag,
    assigneeCell: assigneeCell, budgetMeter: budgetMeter, worktreeRef: worktreeRef,
    logtailHTML: logtailHTML, logLines: logLines, fmtLog: fmtLog,
    evCount: evCount, linkify: linkify
  };
  if (!root) return;

  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var added = muts[i].addedNodes;
      for (var j = 0; j < added.length; j++) wbStampAll(added[j]);
    }
  }).observe(root, { childList: true, subtree: true });
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var t = e.target;
    if (!t || t.nodeType !== 1) return;
    var tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
    if (!t.matches(WB_KEY)) return;
    e.preventDefault();
    t.click();
  });

  // close popovers on outside click / escape
  document.addEventListener('click', function (e) {
    if (!root.classList.contains('mounted')) return;
    if (!e.target.closest('#wbBoardMenu') && !e.target.closest('#wbSwitch')) document.getElementById('wbBoardMenu').classList.remove('open');
    if (!e.target.closest('#wbNotif') && !e.target.closest('#wbBell')) closeNotif();
    if (!e.target.closest('#wbPop') && !e.target.closest('.wb-filter')) closePop();
    if (!e.target.closest('#wbPreflight') && !e.target.closest('#wbDispatch')) document.getElementById('wbPreflight').classList.remove('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var pf = document.getElementById('wbPreflight');
      if (pf && pf.classList.contains('open')) { pf.classList.remove('open'); return; }
      var p = document.getElementById('wbPop');
      if (p && p.classList.contains('open')) { closePop(); return; }
      var m = document.getElementById('wbBoardMenu');
      if (m && m.classList.contains('open')) { m.classList.remove('open'); return; }
      var n = document.getElementById('wbNotif');
      if (n && n.classList.contains('open')) { closeNotif(); return; }
      if (selected) closeDrawer();
    }
  });

  // ============ MOUNT (hosted; standalone-capable) ============
  // Hosted (EclipseOS.html): the app shell has a .main pane and a
  // .nv-workboard sidebar item — defer mount until first entry and expose a
  // host API the shell view-router drives (the shell owns the home ⇄ workboard
  // switch, persisted as 'sb-view').
  // Standalone fallback: if ever dropped into a page with no shell host, the
  // view is the page and mounts immediately. (The old standalone Workboard.html
  // was removed once the shell embedded the board — this branch keeps the module
  // reusable for any future host.)
  var hostMain = document.querySelector('.main');
  var hostNav = document.querySelector('.nv-workboard');
  function mount() {
    if (root.classList.contains('mounted')) return;
    renderShell(); renderHeader(); renderBoard();
    root.classList.add('mounted');
    window.addEventListener('resize', function () { placeSegPill(false); });
  }
  if (hostMain && hostNav) {
    // Hosted in the app shell — expose a host API for the shell's view
    // router (components/chrome/view-router.js) rather than self-wiring the
    // sidebar. The router owns which view is shown, persistence, and restore.
    window.__wbHost = {
      mount: mount,
      enter: function () {
        mount();
        hostMain.classList.add('show-workboard');
        requestAnimationFrame(updateEdgeFade);
      },
      exit: function () {
        hostMain.classList.remove('show-workboard');
        // Only tear down overlays if the board has actually mounted — the
        // router may call exit() before the board's first entry.
        if (root.classList.contains('mounted')) { closeDrawer(); closeNotif(); }
      }
    };
  } else {
    mount();
  }
  window.addEventListener('resize', updateEdgeFade);
  setInterval(tick, 1000);
})();
