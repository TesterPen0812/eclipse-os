// Eclipse OS desktop shell - G9 compatibility shim.
//
// The ported static baseline behavior (G5) has been extracted into typed modules
// under `../state` (rootChrome, composer, conversation, envPanel, sidebar,
// ambient, the orchestrator desktopBehavior, and the still-imperative
// moonRenderer). This file remains only so the original import path keeps working
// for `main.tsx` (initRootChrome) and any other consumer; new code should import
// from `../state/*` directly. DOM ids, classes, timings, localStorage keys, and
// custom event names are unchanged by the move.

export { initRootChrome } from '../state/rootChrome';
export { initDesktopBehavior } from '../state/desktopBehavior';
