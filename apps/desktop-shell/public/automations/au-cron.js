/* ============================================================
   ECLIPSE OS — AUTOMATIONS · cron engine + seed data
   A real 5-field cron parser (lists, ranges, steps, names),
   next-fire computation for cron / interval / one-shot
   schedules, a humanizer, and terse time formatting.
   DOM-free — exported on window.AU_CRON for automations.js.
   ============================================================ */
(function () {
  "use strict";

  var DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  function resolveName(tok, names) {
    if (/^\d+$/.test(tok)) return parseInt(tok, 10);
    if (!names) return NaN;
    var i = names.indexOf(tok.slice(0, 3).toLowerCase());
    return i === -1 ? NaN : (names === MON ? i + 1 : i);
  }

  /* one field → { any, set:{v:true}, src } or null on error */
  function parseField(str, min, max, names) {
    str = String(str).trim().toLowerCase();
    if (!str) return null;
    if (str === '*') return { any: true, src: str };
    var set = {}, parts = str.split(',');
    for (var p = 0; p < parts.length; p++) {
      var part = parts[p], step = 1, base = part;
      var slash = part.indexOf('/');
      if (slash !== -1) {
        base = part.slice(0, slash);
        step = parseInt(part.slice(slash + 1), 10);
        if (!(step >= 1)) return null;
      }
      var lo, hi;
      if (base === '*') { lo = min; hi = max; }
      else if (base.indexOf('-') > 0) {
        var ends = base.split('-');
        if (ends.length !== 2) return null;
        lo = resolveName(ends[0], names); hi = resolveName(ends[1], names);
      } else {
        lo = resolveName(base, names);
        hi = (slash !== -1) ? max : lo;   /* "5/2" = from 5 by 2 */
      }
      if (isNaN(lo) || isNaN(hi)) return null;
      if (names === DOW) { if (lo === 7) lo = 0; if (hi === 7) hi = 0; }
      if (lo > hi) { if (names === DOW && hi === 0) hi = lo; else return null; }
      if (lo < min || hi > max) return null;
      for (var v = lo; v <= hi; v += step) set[v] = true;
    }
    return { any: false, set: set, src: str };
  }

  function parseCron(expr) {
    var f = String(expr).trim().split(/\s+/);
    if (f.length !== 5) return null;
    var c = {
      min:  parseField(f[0], 0, 59),
      hour: parseField(f[1], 0, 23),
      dom:  parseField(f[2], 1, 31),
      mon:  parseField(f[3], 1, 12, MON),
      dow:  parseField(f[4], 0, 7, DOW),
      raw:  f
    };
    return (c.min && c.hour && c.dom && c.mon && c.dow) ? c : null;
  }

  function has(field, v) { return field.any || !!field.set[v]; }

  /* vixie-cron day rule: if BOTH dom and dow are restricted, match either */
  function dayMatches(c, d) {
    var domOk = has(c.dom, d.getDate());
    var dowOk = has(c.dow, d.getDay());
    if (!c.dom.any && !c.dow.any) return domOk || dowOk;
    return domOk && dowOk;
  }

  function nextCron(c, fromTs) {
    var d = new Date(fromTs);
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);
    for (var i = 0; i < 100000; i++) {
      if (!has(c.mon, d.getMonth() + 1)) { d = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0); continue; }
      if (!dayMatches(c, d))             { d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0); continue; }
      if (!has(c.hour, d.getHours()))    { d.setMinutes(0); d.setHours(d.getHours() + 1); continue; }
      if (!has(c.min, d.getMinutes()))   { d.setMinutes(d.getMinutes() + 1); continue; }
      return d.getTime();
    }
    return null;
  }

  /* schedule: {type:'cron', expr} | {type:'every', ms, anchor} | {type:'at', ts} */
  function nextFire(schedule, fromTs) {
    if (!schedule) return null;
    if (schedule.type === 'cron') {
      var c = schedule._c || (schedule._c = parseCron(schedule.expr));
      return c ? nextCron(c, fromTs) : null;
    }
    if (schedule.type === 'every') {
      var n = Math.floor((fromTs - schedule.anchor) / schedule.ms) + 1;
      if (n < 1) n = 1;
      return schedule.anchor + n * schedule.ms;
    }
    if (schedule.type === 'at') return schedule.ts > fromTs ? schedule.ts : null;
    return null;
  }

  /* all fires in (from, to] — capped, for the horizon rail */
  function firesBetween(schedule, from, to, cap) {
    var out = [], t = from;
    cap = cap || 200;
    while (out.length < cap) {
      t = nextFire(schedule, t);
      if (t == null || t > to) break;
      out.push(t);
    }
    return out;
  }

  /* ---------- humanizer ---------- */
  function setVals(field) {
    if (field.any) return null;
    var out = [];
    for (var k in field.set) out.push(parseInt(k, 10));
    return out.sort(function (a, b) { return a - b; });
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function sameSet(vals, ref) {
    if (!vals || vals.length !== ref.length) return false;
    for (var i = 0; i < ref.length; i++) if (vals[i] !== ref[i]) return false;
    return true;
  }
  function dowPhrase(vals) {
    if (sameSet(vals, [1, 2, 3, 4, 5])) return 'weekdays';
    if (sameSet(vals, [0, 6])) return 'weekends';
    return vals.map(function (v) { return DOW[v]; }).join(', ');
  }
  function stepOf(src) {
    var m = /^\*\/(\d+)$/.exec(src || '');
    return m ? parseInt(m[1], 10) : null;
  }

  function describeCron(expr) {
    var c = parseCron(expr);
    if (!c) return null;
    var mins = setVals(c.min), hours = setVals(c.hour);
    var doms = setVals(c.dom), dows = setVals(c.dow);
    var minStep = stepOf(c.min.src), hourStep = stepOf(c.hour.src);

    /* every minute / every n min */
    if (c.hour.any && c.dom.any && c.mon.any && c.dow.any) {
      if (c.min.any) return 'every minute';
      if (minStep) return 'every ' + minStep + ' min';
    }
    /* hourly cadence */
    if (mins && mins.length === 1 && c.dom.any && c.mon.any && c.dow.any) {
      if (c.hour.any) return 'hourly at :' + pad2(mins[0]);
      if (hourStep) return 'every ' + hourStep + 'h at :' + pad2(mins[0]);
    }
    /* fixed time-of-day */
    if (mins && mins.length === 1 && hours && hours.length === 1 && c.mon.any) {
      var time = pad2(hours[0]) + ':' + pad2(mins[0]);
      if (c.dom.any && !c.dow.any && dows) return dowPhrase(dows) + ' at ' + time;
      if (!c.dom.any && c.dow.any && doms && doms.length === 1)
        return 'monthly on the ' + doms[0] + ordinal(doms[0]) + ' at ' + time;
      if (c.dom.any && c.dow.any) return 'daily at ' + time;
    }
    return null; /* caller falls back to raw expr */
  }
  function ordinal(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return 'th';
    return ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  }

  function fmtEvery(ms) {
    var m = Math.round(ms / 60000);
    if (m < 60) return 'every ' + m + 'm';
    if (m % 60 === 0) return 'every ' + (m / 60) + 'h';
    return 'every ' + Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  }

  function describe(schedule) {
    if (!schedule) return '';
    if (schedule.type === 'every') return fmtEvery(schedule.ms);
    if (schedule.type === 'at') return 'once · ' + fmtAbs(schedule.ts, true);
    var d = describeCron(schedule.expr);
    return d || ('cron · ' + schedule.expr);
  }

  /* the mono "expression" cell text per schedule type */
  function exprText(schedule) {
    if (!schedule) return '';
    if (schedule.type === 'cron') return schedule.expr;
    if (schedule.type === 'every') return fmtEvery(schedule.ms);
    return 'at ' + fmtAbs(schedule.ts, true);
  }

  /* ---------- terse time formatting ---------- */
  function fmtClock(ts, secs) {
    var d = new Date(ts);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + (secs ? ':' + pad2(d.getSeconds()) : '');
  }
  /* "09:00" today · "tmrw 09:00" · "fri 18:00" (≤6d) · "jul 15 09:00" */
  function fmtAbs(ts, forceDate) {
    var d = new Date(ts), now = new Date();
    var t = fmtClock(ts);
    var d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var day = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - d0) / 86400000);
    if (!forceDate) {
      if (day === 0) return t;
      if (day === 1) return 'tmrw ' + t;
      if (day > 1 && day < 7) return DOW[d.getDay()] + ' ' + t;
    }
    return MON[d.getMonth()] + ' ' + d.getDate() + ' ' + t;
  }
  /* countdown: "42s" · "12m 33s" · "4h 02m" · "2d 4h" */
  function fmtCountdown(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ' + pad2(s % 60) + 's';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ' + pad2(m % 60) + 'm';
    var d = Math.floor(h / 24);
    return d + 'd ' + (h % 24) + 'h';
  }
  function fmtAgo(ms) {
    var s = Math.floor(ms / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }
  function fmtDur(ms) {
    var s = Math.round(ms / 1000);
    if (s < 60) return s + 's';
    return Math.floor(s / 60) + 'm ' + pad2(s % 60) + 's';
  }
  function fmtMMSS(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(s / 60) + ':' + pad2(s % 60);
  }

  /* ============ SEED DATA ============ */
  var NOW = Date.now();
  var MIN = 60000, HOUR = 3600000, DAY = 86400000;

  function run(agoMs, ok, durMs, lines) {
    return { ts: NOW - agoMs, ok: ok, dur: durMs, lines: lines || [] };
  }

  /* Demo jobs — kept for reference, NOT loaded by default.
     The live JOBS array starts empty; push DEMO_JOBS into it to preview. */
  var DEMO_JOBS = [
    {
      id: 'morning-digest', name: 'Morning digest',
      prompt: 'Summarize overnight commits, CI runs and anything new on the workboard. Post the digest to the main chat before standup.',
      schedule: { type: 'cron', expr: '0 9 * * 1-5' },
      session: 'isolated', delivery: 'announce', model: 'default', timeoutMin: 10,
      enabled: true,
      runs: [
        run(3 * HOUR + 41 * MIN, true, 43000, [
          'reading git log --since=18h on shared-brain … 14 commits',
          'ci: 6 runs, all green · workboard: 2 cards moved to review',
          'drafting digest … 312 words',
          'posted to main chat · ok'
        ]),
        run(DAY + 3 * HOUR + 41 * MIN, true, 39000),
        run(2 * DAY + 3 * HOUR + 41 * MIN, true, 51000),
        run(3 * DAY + 3 * HOUR + 41 * MIN, true, 44000),
        run(4 * DAY + 3 * HOUR + 41 * MIN, false, 12000, [
          'reading git log --since=18h … ok',
          'fetch ci runs: HTTP 502 from ci.internal — retried ×3',
          'aborted: ci unreachable'
        ]),
        run(7 * DAY + 3 * HOUR + 41 * MIN, true, 40000),
        run(8 * DAY + 3 * HOUR + 41 * MIN, true, 46000),
        run(9 * DAY + 3 * HOUR + 41 * MIN, true, 38000)
      ]
    },
    {
      id: 'ci-watch', name: 'CI health check',
      prompt: 'Check the latest CI run on main. If red, raise it in the main session with the failing job and the last green commit.',
      schedule: { type: 'every', ms: 30 * MIN, anchor: NOW - 30 * MIN + 75000 },
      session: 'main', delivery: 'silent', model: 'default', timeoutMin: 5,
      enabled: true,
      runs: [
        run(29 * MIN, true, 4200, ['gh run list --branch main --limit 1 … completed · success', 'main is green · no event raised']),
        run(59 * MIN, true, 3900),
        run(89 * MIN, true, 4600),
        run(119 * MIN, true, 4100),
        run(149 * MIN, true, 3800),
        run(179 * MIN, true, 4400),
        run(209 * MIN, true, 4000),
        run(239 * MIN, true, 4300),
        run(269 * MIN, true, 3700),
        run(299 * MIN, true, 4500)
      ]
    },
    {
      id: 'mem-compact', name: 'Memory compaction',
      prompt: 'Compact session memory: fold the day\u2019s context into MEMORY.md and prune threads that have gone quiet.',
      schedule: { type: 'every', ms: 2 * HOUR, anchor: NOW - 2 * HOUR + 47 * MIN },
      session: 'main', delivery: 'silent', model: 'default', timeoutMin: 5,
      enabled: true,
      runs: [
        run(73 * MIN, true, 12000, ['scanning session memory … 41 entries', 'folded 9 into MEMORY.md · pruned 3 dead threads', 'memory footprint −18%']),
        run(193 * MIN, true, 11000),
        run(313 * MIN, true, 14000),
        run(433 * MIN, true, 10000),
        run(553 * MIN, true, 13000)
      ]
    },
    {
      id: 'dep-audit', name: 'Dependency audit',
      prompt: 'Run npm audit and osv-scanner across shared-brain. File a workboard card for anything high severity, with the advisory linked.',
      schedule: { type: 'cron', expr: '0 3 * * 1' },
      session: 'isolated', delivery: 'announce', model: 'opus', timeoutMin: 20,
      enabled: true,
      runs: [
        run(2 * DAY + 9 * HOUR + 41 * MIN, true, 128000, [
          'npm audit --json … 0 high, 2 moderate',
          'osv-scanner ./ … 1 advisory (GHSA-49c2, transitive via ws@8.16)',
          'filed SB-259 “bump ws to 8.17.1” · linked advisory',
          'summary posted to main chat'
        ]),
        run(9 * DAY + 9 * HOUR + 41 * MIN, true, 141000),
        run(16 * DAY + 9 * HOUR + 41 * MIN, true, 117000),
        run(23 * DAY + 9 * HOUR + 41 * MIN, true, 156000)
      ]
    },
    {
      id: 'branch-sweep', name: 'Stale branch sweep',
      prompt: 'List branches with no commits in 30 days. Delete merged ones, and nudge owners of the rest in the main chat.',
      schedule: { type: 'cron', expr: '0 18 * * 5' },
      session: 'isolated', delivery: 'silent', model: 'default', timeoutMin: 10,
      enabled: true, alwaysFails: true,
      runs: [
        run(4 * DAY + 15 * HOUR + 41 * MIN, false, 9000, [
          'git branch -r --no-merged … 11 stale candidates',
          'git push origin --delete bench/pwa-lighthouse',
          'remote: permission denied — branch protection on bench/*',
          'aborted: deploy key lacks delete permission'
        ]),
        run(11 * DAY + 15 * HOUR + 41 * MIN, false, 8000, [
          'git push origin --delete bench/pwa-lighthouse',
          'remote: permission denied — branch protection on bench/*',
          'aborted: deploy key lacks delete permission'
        ]),
        run(18 * DAY + 15 * HOUR + 41 * MIN, true, 34000),
        run(25 * DAY + 15 * HOUR + 41 * MIN, true, 31000)
      ]
    },
    {
      id: 'changelog', name: 'Weekly changelog draft',
      prompt: 'Draft the week\u2019s changelog from merged PRs and done workboard cards. Leave it as a draft PR against docs/changelog.md.',
      schedule: { type: 'cron', expr: '30 16 * * 5' },
      session: 'isolated', delivery: 'announce', model: 'default', timeoutMin: 15,
      enabled: true,
      runs: [
        run(4 * DAY + 17 * HOUR + 11 * MIN, true, 74000, [
          'gh pr list --state merged --limit 40 … 12 this week',
          'workboard: 9 cards done · grouping by area',
          'draft PR #212 opened against docs/changelog.md',
          'summary posted to main chat'
        ]),
        run(11 * DAY + 17 * HOUR + 11 * MIN, true, 69000),
        run(18 * DAY + 17 * HOUR + 11 * MIN, true, 81000)
      ]
    },
    {
      id: 'shot-diff', name: 'Screenshot diff sweep',
      prompt: 'Re-render the six theme screenshots and diff against baselines. Attach any drift to a workboard card.',
      schedule: { type: 'cron', expr: '0 */6 * * *' },
      session: 'isolated', delivery: 'silent', model: 'default', timeoutMin: 15,
      enabled: false,
      runs: [
        run(6 * DAY, true, 96000, ['rendered 6 themes × 4 pages … 24 shots', 'pixelmatch vs baselines: 0 drift', 'nothing to file']),
        run(6 * DAY + 6 * HOUR, true, 92000),
        run(6 * DAY + 12 * HOUR, true, 99000)
      ]
    },
    {
      id: 'key-rotate', name: 'Rotate deploy key',
      prompt: 'Generate a new deploy key for macbook-air-eclipse, update the repo secret, verify a push, then retire the old key.',
      schedule: { type: 'at', ts: new Date(2026, 6, 15, 9, 0).getTime() },
      session: 'isolated', delivery: 'announce', model: 'default', timeoutMin: 10,
      enabled: true,
      runs: []
    }
  ];

  /* live jobs — the three current automations (delete all to see the
     create-first empty state) */
  var JOBS = [
    {
      id: 'daily-brief', name: 'Daily project brief',
      source: 'Heartbeat', desc: 'Add weekday update',
      schedText: 'Weekdays at 8:00',
      prompt: 'Each weekday morning, summarize overnight commits, CI runs and anything new on the workboard. Post the brief to the main chat before standup.',
      schedule: { type: 'cron', expr: '0 8 * * 1-5' },
      session: 'isolated', delivery: 'announce', model: 'default', timeoutMin: 10,
      enabled: true,
      runs: [
        run(3 * HOUR + 12 * MIN, true, 41000, [
          'reading git log --since=18h on shared-brain … 9 commits',
          'ci: 5 runs, all green · workboard: 1 card moved to review',
          'drafting brief … 264 words',
          'posted to main chat · ok'
        ]),
        run(DAY + 3 * HOUR + 12 * MIN, true, 38000),
        run(2 * DAY + 3 * HOUR + 12 * MIN, true, 47000),
        run(3 * DAY + 3 * HOUR + 12 * MIN, true, 43000)
      ]
    },
    {
      id: 'weekly-review', name: 'Weekly review',
      source: 'Workboard', desc: 'Friday digest',
      schedText: 'Every Friday at 9:00',
      prompt: 'Every Friday, compile the week from the workboard: progress, wins, and key insights. Post the digest to the main chat.',
      schedule: { type: 'cron', expr: '0 9 * * 5' },
      session: 'isolated', delivery: 'announce', model: 'default', timeoutMin: 15,
      enabled: true,
      runs: [
        run(6 * DAY + 2 * HOUR, true, 74000, [
          'workboard: 11 cards done this week · grouping by area',
          'gh pr list --state merged --limit 40 … 8 merged',
          'drafting digest … 402 words',
          'posted to main chat · ok'
        ]),
        run(13 * DAY + 2 * HOUR, true, 69000)
      ]
    },
    {
      id: 'project-monitor', name: 'Project monitor',
      source: 'macbook-air-eclipse', desc: 'Stalled task check',
      schedText: 'Every weekday at 5:00',
      prompt: 'Scan the workboard for stalled tasks and overdue work on macbook-air-eclipse. Raise anything stuck for more than two days in the main session.',
      schedule: { type: 'cron', expr: '0 5 * * 1-5' },
      session: 'main', delivery: 'silent', model: 'default', timeoutMin: 5,
      enabled: true,
      runs: [
        run(9 * HOUR + 40 * MIN, true, 5200, [
          'scanning workboard … 14 open cards',
          '1 stalled: SB-241 “PWA manifest” · 3d without movement',
          'raised in main session'
        ]),
        run(DAY + 9 * HOUR + 40 * MIN, true, 4800),
        run(2 * DAY + 9 * HOUR + 40 * MIN, true, 5600)
      ]
    }
  ];

  /* canned live-log lines for simulated runs, per job */
  var LIVE_LINES = {
    'daily-brief': ['reading git log --since=18h on shared-brain …', '7 commits · ci: 3 runs, all green', 'drafting brief … 241 words', 'posted to main chat · ok'],
    'weekly-review': ['workboard: 9 cards done this week …', 'gh pr list --state merged --limit 40 … 6 merged', 'drafting digest … 356 words', 'posted to main chat · ok'],
    'project-monitor': ['scanning workboard … 12 open cards', 'nothing stalled · no event raised'],
    'morning-digest': ['reading git log --since=18h on shared-brain …', '11 commits · ci: 4 runs, all green', 'workboard: SB-248 moved to review', 'drafting digest … 287 words', 'posted to main chat · ok'],
    'ci-watch': ['gh run list --branch main --limit 1 …', 'completed · success · 4m 12s', 'main is green · no event raised'],
    'mem-compact': ['scanning session memory … 38 entries', 'folded 7 into MEMORY.md', 'pruned 2 dead threads · footprint −12%'],
    'dep-audit': ['npm audit --json … 0 high, 1 moderate', 'osv-scanner ./ … clean', 'nothing to file · summary posted'],
    'branch-sweep': ['git branch -r --no-merged … 9 stale candidates', 'git push origin --delete bench/pwa-lighthouse', 'remote: permission denied — branch protection on bench/*', 'aborted: deploy key lacks delete permission'],
    'changelog': ['gh pr list --state merged --limit 40 …', '8 merged this week · grouping by area', 'draft PR opened against docs/changelog.md', 'summary posted to main chat'],
    'shot-diff': ['rendering 6 themes × 4 pages …', 'pixelmatch vs baselines: 0 drift', 'nothing to file'],
    'key-rotate': ['ssh-keygen -t ed25519 -C deploy@macbook-air-eclipse', 'gh secret set DEPLOY_KEY … ok', 'verify push to scratch branch … ok', 'old key retired']
  };

  window.AU_CRON = {
    DOW: DOW, MON: MON,
    parseCron: parseCron, nextFire: nextFire, firesBetween: firesBetween,
    describe: describe, describeCron: describeCron, exprText: exprText, fmtEvery: fmtEvery,
    fmtClock: fmtClock, fmtAbs: fmtAbs, fmtCountdown: fmtCountdown,
    fmtAgo: fmtAgo, fmtDur: fmtDur, fmtMMSS: fmtMMSS, pad2: pad2,
    JOBS: JOBS, DEMO_JOBS: DEMO_JOBS, LIVE_LINES: LIVE_LINES
  };
})();
