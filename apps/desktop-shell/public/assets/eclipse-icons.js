/* ============================================================
   Eclipse OS — Icon Set v2 · "Soft Line"  · SINGLE SOURCE OF TRUTH
   ------------------------------------------------------------
   Construction system (see ICON-GUIDE.md):
   · 24×24 grid, artwork fills ~3→21, optically centred on (12,12)
   · stroke 2.0 default · 1.9 for dense multi-stroke glyphs
     · 2.2 for chevrons/carets/arrow-glyph buttons · 2.4+ micro checks
   · round caps + round joins, always
   · soft geometry: outer frames rx 3–4.8, wide bodies rx 2.4–3,
     device frames rx ~3, keys/pips rx 1.5–2
   · LIMITED SOLID FILLS (currentColor, stroke="none") only where
     they add clarity: status/indicator dots, keyboard pips,
     "more" dots, image-sun, home-button, checklist pip
   · monochrome: stroke/fill = currentColor. Never bake a color.
   Consumers: assets/icons.html (browsable grid) renders from this
   file; app surfaces inline the same path strings verbatim
   (rule zero: copy, don't redraw).
   ============================================================ */
(function () {
  'use strict';

  var ICONS = {
    /* ---- navigation & panels ---- */
    'panel-left':   { sw: 2, group: 'Panels', label: 'Toggle sidebar', inner: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="4.6"/><path d="M9.6 4.4v15.2"/>' },
    'panel-right':  { sw: 2, group: 'Panels', label: 'Toggle side panel', inner: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="4.6"/><path d="M14.4 4.4v15.2"/>' },
    'panel-bottom': { sw: 2, group: 'Panels', label: 'Toggle bottom panel', inner: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="4.6"/><path d="M3.4 14.8h17.2"/>' },
    'undo':         { sw: 2, group: 'Navigation', label: 'Go back', inner: '<path d="M9.5 4.6 4.4 8.8l5.1 4.2"/><path d="M4.4 8.8h9.1a6.1 6.1 0 0 1 0 12.2H8.4"/>' },
    'redo':         { sw: 2, group: 'Navigation', label: 'Go forward', inner: '<path d="M14.5 4.6 19.6 8.8l-5.1 4.2"/><path d="M19.6 8.8h-9.1a6.1 6.1 0 0 0 0 12.2h5.1"/>' },
    'arrow-left':   { sw: 2.1, group: 'Navigation', label: 'Back (with tail)', inner: '<path d="M13.6 5.2 6.8 12l6.8 6.8"/><path d="M7.2 12H20.2"/>' },
    'arrow-right':  { sw: 2.1, group: 'Navigation', label: 'Forward (with tail)', inner: '<path d="M4.2 12h15"/><path d="m13.4 6.2 5.8 5.8-5.8 5.8"/>' },
    'chevron-down': { sw: 2.2, group: 'Navigation', label: 'Chevron down', inner: '<path d="M7 9.3 12 14.2l5-4.9"/>' },
    'chevron-right':{ sw: 2.2, group: 'Navigation', label: 'Chevron right', inner: '<path d="M9 6l6 6-6 6"/>' },
    'chevron-left': { sw: 2.2, group: 'Navigation', label: 'Chevron left', inner: '<path d="M15 6 9 12l-6 6"/>' },

    /* ---- core actions ---- */
    'compose':      { sw: 2, group: 'Actions', label: 'New chat', inner: '<path d="M12 4.9H7.1a2.9 2.9 0 0 0-2.9 2.9v9.1a2.9 2.9 0 0 0 2.9 2.9h9.1a2.9 2.9 0 0 0 2.9-2.9V12"/><path d="M17.8 4.2a2.12 2.12 0 0 1 3 3l-7.9 7.9-4.1 1.1 1.1-4.1 7.9-7.9Z"/>' },
    'search':       { sw: 2, group: 'Actions', label: 'Search', inner: '<circle cx="11.2" cy="11.2" r="7"/><path d="m16.4 16.4 4.2 4.2"/>' },
    'plus':         { sw: 2.1, group: 'Actions', label: 'Add', inner: '<path d="M12 4.2v15.6"/><path d="M4.2 12h15.6"/>' },
    'close':        { sw: 2.1, group: 'Actions', label: 'Close', inner: '<path d="M6.4 6.4 17.6 17.6"/><path d="M17.6 6.4 6.4 17.6"/>' },
    'check':        { sw: 2.4, group: 'Actions', label: 'Check', inner: '<path d="M5 12.5 10 17.5 19 6.5"/>' },
    'upload':       { sw: 2, group: 'Actions', label: 'Push changes', inner: '<path d="M12 4.4v11.2"/><path d="M6.8 9.6 12 4.4l5.2 5.2"/><path d="M5 19.6h14"/>' },
    'upload-tray':  { sw: 2, group: 'Actions', label: 'Upload files', inner: '<path d="M12 15V4.4"/><path d="M7.6 8.8 12 4.4l4.4 4.4"/><path d="M4.6 15.4v2.6a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-2.6"/>' },
    'send-up':      { sw: 2.2, group: 'Actions', label: 'Send message', inner: '<path d="M12 19.4V5.2"/><path d="M5.8 11.4 12 5.2l6.2 6.2"/>' },
    'reload':       { sw: 2, group: 'Actions', label: 'Reload / retry', inner: '<path d="M19.7 12a7.7 7.7 0 1 1-2.2-5.3"/><path d="M19.8 4.3v3.9h-3.9"/>' },
    'dispatch':     { sw: 2, group: 'Actions', label: 'Dispatch / sync', inner: '<path d="M4.4 12a7.6 7.6 0 0 1 13-5.4L19.9 9"/><path d="M20 4.4V9h-4.6"/><path d="M19.6 12a7.6 7.6 0 0 1-13 5.4L4.1 15"/><path d="M4 19.6V15h4.6"/>' },
    'dots':         { sw: 2, group: 'Actions', label: 'More', inner: '<circle cx="5.2" cy="12" r="1.55" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.55" fill="currentColor" stroke="none"/><circle cx="18.8" cy="12" r="1.55" fill="currentColor" stroke="none"/>' },
    'menu':         { sw: 2.2, group: 'Actions', label: 'Menu', inner: '<path d="M4.4 8.2h15.2"/><path d="M4.4 14.6h9.6"/>' },
    'stop':         { sw: 2, group: 'Actions', label: 'Stop (filled)', inner: '<rect x="7.5" y="7.5" width="9" height="9" rx="2.6" fill="currentColor" stroke="none"/>' },
    'prompt':       { sw: 2.2, group: 'Actions', label: 'Run command', inner: '<path d="m5.4 7.2 4.4 4.8-4.4 4.8"/><path d="M12.8 17h6.2"/>' },
    'pencil':       { sw: 2, group: 'Actions', label: 'Edit', inner: '<path d="m4.5 19.5 1-4L16 5a2.12 2.12 0 0 1 3 3L8.5 18.5l-4 1Z"/>' },

    /* ---- app areas ---- */
    'board':        { sw: 2, group: 'App areas', label: 'Workboard', inner: '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="3.4"/><path d="M9.2 4.4v15.2"/><path d="M14.8 4.4v15.2"/>' },
    'board-cols':   { sw: 2, group: 'App areas', label: 'Board view', inner: '<rect x="4.8" y="4.4" width="4.6" height="15.2" rx="1.8"/><rect x="14.6" y="4.4" width="4.6" height="15.2" rx="1.8"/>' },
    'rows':         { sw: 2, group: 'App areas', label: 'List view', inner: '<path d="M4.4 6.4h15.2"/><path d="M4.4 12h15.2"/><path d="M4.4 17.6h15.2"/>' },
    'clock':        { sw: 2, group: 'App areas', label: 'Automations', inner: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.6V12l3.2 1.9"/>' },
    'plug':         { sw: 2, group: 'App areas', label: 'Plugins', inner: '<path d="M9 3.6v3.9"/><path d="M15 3.6v3.9"/><path d="M7 7.5h10v3.8a5 5 0 0 1-10 0V7.5Z"/><path d="M12 16.3v4.1"/>' },
    'tasks':        { sw: 2, group: 'App areas', label: 'Environment / checklist', inner: '<path d="M9.8 6.4h10.4"/><path d="M9.8 12h10.4"/><path d="M9.8 17.6h10.4"/><path d="m3.8 6.2 1.2 1.2 2.1-2.4"/><path d="m3.8 11.8 1.2 1.2 2.1-2.4"/><circle cx="5.4" cy="17.6" r="1.5" fill="currentColor" stroke="none"/>' },

    /* ---- files & folders ---- */
    'file':         { sw: 2, group: 'Files', label: 'File / doc', inner: '<path d="M13.6 3.6H7.5a2.3 2.3 0 0 0-2.3 2.3v12.2a2.3 2.3 0 0 0 2.3 2.3h9a2.3 2.3 0 0 0 2.3-2.3V8.8l-5.2-5.2Z"/><path d="M13.6 3.6v5.2h5.2"/>' },
    'folder':       { sw: 2, group: 'Files', label: 'Folder', inner: '<path d="M3.2 8.2a2.6 2.6 0 0 1 2.6-2.6h3.5l2.2 2.3h6.7a2.6 2.6 0 0 1 2.6 2.6v5.5a2.6 2.6 0 0 1-2.6 2.6H5.8a2.6 2.6 0 0 1-2.6-2.6V8.2Z"/>' },
    'folder-plus':  { sw: 2, group: 'Files', label: 'New project', inner: '<path d="M3.2 8.2a2.6 2.6 0 0 1 2.6-2.6h3.5l2.2 2.3h6.7a2.6 2.6 0 0 1 2.6 2.6v5.5a2.6 2.6 0 0 1-2.6 2.6H5.8a2.6 2.6 0 0 1-2.6-2.6V8.2Z"/><path d="M12 10.6v4.2"/><path d="M9.9 12.7h4.2"/>' },
    'folder-files': { sw: 2, group: 'Files', label: 'Project folder', inner: '<path d="M3.2 8.2a2.6 2.6 0 0 1 2.6-2.6h3.5l2.2 2.3h6.7a2.6 2.6 0 0 1 2.6 2.6v5.5a2.6 2.6 0 0 1-2.6 2.6H5.8a2.6 2.6 0 0 1-2.6-2.6V8.2Z"/><path d="M8.2 14.2h3.4"/><path d="M14.4 14.2h1.6"/>' },
    'archive':      { sw: 2, group: 'Files', label: 'Archived', inner: '<rect x="3.2" y="4.6" width="17.6" height="4.8" rx="2"/><path d="M5.2 9.4v8a2.4 2.4 0 0 0 2.4 2.4h8.8a2.4 2.4 0 0 0 2.4-2.4v-8"/><path d="M9.8 13.4h4.4"/>' },
    'image':        { sw: 2, group: 'Files', label: 'Screenshot / image', inner: '<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="3.2"/><circle cx="8.9" cy="9.9" r="1.5" fill="currentColor" stroke="none"/><path d="m4.6 17.4 4.3-4.1 3.1 2.7 2.7-2.4 4.7 4.3"/>' },

    /* ---- git & code ---- */
    'branch':       { sw: 1.9, group: 'Git', label: 'Branch / Git', inner: '<circle cx="6.1" cy="7.4" r="2.4"/><circle cx="17.9" cy="16.6" r="2.4"/><circle cx="6.1" cy="16.6" r="2.4"/><path d="M6.1 9.8v4.4"/><path d="M8.5 7.4h3.2a3.5 3.5 0 0 1 3.5 3.5v.3a3.3 3.3 0 0 0 2.8 3.3"/>' },
    'commit':       { sw: 2, group: 'Git', label: 'Commit', inner: '<circle cx="5.6" cy="12" r="2.6"/><circle cx="18.4" cy="12" r="2.6"/><path d="M8.2 12h7.6"/>' },
    'commit-lines': { sw: 2, group: 'Git', label: 'Commit history', inner: '<circle cx="12" cy="12" r="3.6"/><path d="M3.4 12h5"/><path d="M15.6 12h5"/>' },
    'diff':         { sw: 1.9, group: 'Git', label: 'Diffs', inner: '<circle cx="7" cy="6.4" r="2.4"/><path d="M7 8.8v6"/><circle cx="7" cy="17.2" r="2.4"/><circle cx="17" cy="6.4" r="2.4"/><path d="M17 8.8v2.9a3.3 3.3 0 0 1-3.3 3.3h-3.5"/><path d="m12.4 12.4-2.6 2.6 2.6 2.6"/>' },
    'nodes':        { sw: 1.9, group: 'Git', label: 'Repository', inner: '<circle cx="6.2" cy="6.4" r="2.4"/><circle cx="6.2" cy="17.6" r="2.4"/><circle cx="17.8" cy="9" r="2.4"/><path d="M6.2 8.8v6.4"/><path d="M17.8 11.4a5.6 5.6 0 0 1-5.6 5.6H8.6"/>' },
    'worktrees':    { sw: 1.9, group: 'Git', label: 'Worktrees', inner: '<circle cx="6.2" cy="6" r="2.4"/><circle cx="6.2" cy="18" r="2.4"/><circle cx="17.8" cy="9" r="2.4"/><path d="M6.2 8.4v7.2"/><path d="M6.2 12.6h6.3a3.3 3.3 0 0 0 3.3-3.3"/>' },
    'terminal':     { sw: 2, group: 'Git', label: 'Terminal', inner: '<rect x="3" y="4.8" width="18" height="14.4" rx="3"/><path d="m7 9.6 2.8 2.4L7 14.4"/><path d="M12.4 14.6h4.6"/>' },
    'tests':        { sw: 2, group: 'Git', label: 'Tests pass', inner: '<rect x="4" y="4" width="16" height="16" rx="3.6"/><path d="m8.4 12.3 2.4 2.4 4.8-5.2"/>' },
    'subagent':     { sw: 1.9, group: 'Git', label: 'Subagent', inner: '<circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.2 11 15.8 7.1"/><path d="m8.2 13 7.6 3.9"/>' },

    /* ---- world & devices ---- */
    'globe':        { sw: 1.9, group: 'Devices', label: 'Connections / web', inner: '<circle cx="12" cy="12" r="8.8"/><path d="M3.2 12h17.6"/><path d="M12 3.2c2.4 2.5 3.6 5.4 3.6 8.8s-1.2 6.3-3.6 8.8c-2.4-2.5-3.6-5.4-3.6-8.8s1.2-6.3 3.6-8.8z"/>' },
    'browser-win':  { sw: 1.9, group: 'Devices', label: 'Browser window', inner: '<rect x="3.2" y="4.6" width="17.6" height="14.8" rx="3"/><path d="M3.2 9.2h17.6"/><circle cx="6.5" cy="6.9" r="1.05" fill="currentColor" stroke="none"/><circle cx="9.5" cy="6.9" r="1.05" fill="currentColor" stroke="none"/>' },
    'drive':        { sw: 2, group: 'Devices', label: 'Local drive', inner: '<rect x="3.2" y="7.8" width="17.6" height="8.4" rx="2.8"/><path d="M6.6 12h6.6"/><circle cx="17.1" cy="12" r="1.3" fill="currentColor" stroke="none"/>' },
    'phone':        { sw: 2, group: 'Devices', label: 'Open on mobile', inner: '<rect x="6" y="3.2" width="12" height="17.6" rx="3.1"/><circle cx="12" cy="17.1" r="1.3" fill="currentColor" stroke="none"/>' },
    'monitor':      { sw: 2, group: 'Devices', label: 'This computer', inner: '<rect x="3" y="4.4" width="18" height="12.6" rx="2.8"/><path d="M8.4 20.4h7.2"/><path d="M12 17.2v3.2"/>' },
    'server-stack': { sw: 2, group: 'Devices', label: 'MCP servers', inner: '<rect x="3.2" y="3.8" width="17.6" height="6.8" rx="2.6"/><rect x="3.2" y="13.4" width="17.6" height="6.8" rx="2.6"/><circle cx="7" cy="7.2" r="1.3" fill="currentColor" stroke="none"/><circle cx="7" cy="16.8" r="1.3" fill="currentColor" stroke="none"/>' },
    'env-window':   { sw: 1.9, group: 'Devices', label: 'Environments', inner: '<rect x="3.2" y="4.4" width="17.6" height="15.2" rx="3"/><path d="M3.2 9.2h17.6"/><path d="m7.2 13 2.4 2-2.4 2"/><path d="M12.6 17h4"/>' },
    'lock':         { sw: 2, group: 'Devices', label: 'Secure', inner: '<rect x="5.6" y="10.4" width="12.8" height="9" rx="2.8"/><path d="M8.6 10.4V8.2a3.4 3.4 0 0 1 6.8 0v2.2"/>' },

    /* ---- settings & account ---- */
    'gear':         { sw: 2, group: 'Settings', label: 'Settings', inner: '<path d="m12 2.9 1.8 1.5 2.3-.4 1 2.2 2.2.7-.2 2.4 1.6 1.7-1.6 1.7.2 2.4-2.2.7-1 2.2-2.3-.4-1.8 1.5-1.8-1.5-2.3.4-1-2.2-2.2-.7.2-2.4L3.3 12l1.6-1.7-.2-2.4 2.2-.7 1-2.2 2.3.4L12 2.9Z"/><circle cx="12" cy="12" r="3"/>' },
    'person':       { sw: 2, group: 'Settings', label: 'Profile', inner: '<circle cx="12" cy="8.2" r="4"/><path d="M4.6 19.8a7.4 7.4 0 0 1 14.8 0"/>' },
    'sun':          { sw: 1.9, group: 'Settings', label: 'Appearance', inner: '<circle cx="12" cy="12" r="4.4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7"/>' },
    'sliders':      { sw: 1.9, group: 'Settings', label: 'Configuration', inner: '<path d="M3.6 8.2h4.8"/><circle cx="11.2" cy="8.2" r="2.6"/><path d="M13.8 8.2h6.6"/><path d="M3.6 15.8h6.6"/><circle cx="12.8" cy="15.8" r="2.6"/><path d="M15.4 15.8h5"/>' },
    'sparkles':     { sw: 1.9, group: 'Settings', label: 'Personalization', inner: '<path d="M11.4 3.4 13.2 8l4.6 1.8-4.6 1.8-1.8 4.6-1.8-4.6L5 9.8l4.6-1.8 1.8-4.6Z"/><path d="m18.2 14.4.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z"/>' },
    'keyboard':     { sw: 1.9, group: 'Settings', label: 'Keyboard shortcuts', inner: '<rect x="2.8" y="6" width="18.4" height="12" rx="3"/><circle cx="6.9" cy="9.9" r="1.05" fill="currentColor" stroke="none"/><circle cx="10.3" cy="9.9" r="1.05" fill="currentColor" stroke="none"/><circle cx="13.7" cy="9.9" r="1.05" fill="currentColor" stroke="none"/><circle cx="17.1" cy="9.9" r="1.05" fill="currentColor" stroke="none"/><path d="M8.2 14.2h7.6"/>' },
    'gauge':        { sw: 2, group: 'Settings', label: 'Usage & billing', inner: '<path d="M3.6 16.6a8.8 8.8 0 1 1 16.8 0"/><path d="m12 13.4 3.6-2.5"/><circle cx="12" cy="13.4" r="1.5" fill="currentColor" stroke="none"/>' },
    'link-broken':  { sw: 2, group: 'Settings', label: 'Appshots', inner: '<path d="m9.6 14.4 4.8-4.8"/><path d="m11.6 6.6 1.4-1.4a4.1 4.1 0 0 1 5.8 5.8l-1.4 1.4"/><path d="m12.4 17.4-1.4 1.4a4.1 4.1 0 0 1-5.8-5.8l1.4-1.4"/>' },
    'cursor':       { sw: 2, group: 'Settings', label: 'Computer use', inner: '<path d="M5 4 11 19.6l2.2-6.4 6.4-2.2L5 4Z"/>' },
    'cursor-spark': { sw: 2, group: 'Settings', label: 'Computer use (spark)', inner: '<path d="M4.8 4.6 10.2 18.8l2-5.8 5.8-2L4.8 4.6Z"/><path d="m18.3 3.9.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z"/>' },
    'hooks':        { sw: 2, group: 'Settings', label: 'Hooks', inner: '<circle cx="12" cy="5.8" r="2.5"/><path d="M12 8.3v8.7a3.7 3.7 0 0 0 7.4 0v-1.6"/><path d="M12 17a3.7 3.7 0 0 1-7.4 0v-1.6"/>' },
    'hand':         { sw: 2, group: 'Settings', label: 'Gestures', inner: '<path d="M7 4.5v9.5l-2-1.6-1.4 1.5L8 19l6-1 1.6-5-4-1.2-1.6-1V4.5a1.5 1.5 0 0 0-3 0Z"/>' },
    'shield-check': { sw: 2, group: 'Settings', label: 'Full access', inner: '<path d="M12 3 19.6 5.9v5.3c0 4.7-2.9 8-7.6 9.8-4.7-1.8-7.6-5.1-7.6-9.8V5.9L12 3Z"/><path d="m8.4 12.3 2.5 2.5 4.7-5.2"/>' },

    /* ---- communication & media ---- */
    'voice':        { sw: 2.2, group: 'Media', label: 'Voice', inner: '<path d="M4 10.2v3.6"/><path d="M8 7v10"/><path d="M12 9v6"/><path d="M16 5.6v12.8"/><path d="M20 10.2v3.6"/>' },
    'mic':          { sw: 2, group: 'Media', label: 'Dictate', inner: '<rect x="8.8" y="3.2" width="6.4" height="11" rx="3.2"/><path d="M5.2 11.4a6.8 6.8 0 0 0 13.6 0"/><path d="M12 18.2V21"/>' },
    'circle':       { sw: 2, group: 'Media', label: 'Temporary chat', inner: '<circle cx="12" cy="12" r="8.6"/>' },

    /* ---- status ---- */
    'alert':        { sw: 2, group: 'Status', label: 'Alert', inner: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.6v4.9"/><circle cx="12" cy="16.3" r="1.4" fill="currentColor" stroke="none"/>' },
    'pin':          { sw: 2, group: 'Status', label: 'Pinned', inner: '<path d="M9.2 3.8h5.6l-.9 4.9 3 3v2.2H7.1v-2.2l3-3-.9-4.9Z"/><path d="M12 13.9v6.3"/>' },
    'github':       { sw: 0, group: 'Status', label: 'GitHub (brand mark — fixed)', inner: '<path d="M12 2.6a9.4 9.4 0 0 0-3 18.3c.5.1.6-.2.6-.5v-1.7c-2.6.6-3.2-1.2-3.2-1.2-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.8.8.1-.6.3-1.1.6-1.3-2.1-.2-4.2-1-4.2-4.6 0-1 .4-1.9 1-2.5-.1-.3-.4-1.2.1-2.6 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 4.8 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.3.1 2.6.6.6 1 1.5 1 2.5 0 3.6-2.1 4.4-4.2 4.6.3.3.6.9.6 1.8v2.7c0 .3.2.6.6.5A9.4 9.4 0 0 0 12 2.6Z"/>', fill: 'currentColor' }
  };

  function svg(name, extra) {
    var ic = ICONS[name];
    if (!ic) return '';
    var attrs = ic.fill
      ? 'viewBox="0 0 24 24" fill="' + ic.fill + '" stroke="none"'
      : 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + ic.sw + '" stroke-linecap="round" stroke-linejoin="round"';
    return '<svg ' + (extra ? extra + ' ' : '') + attrs + '>' + ic.inner + '</svg>';
  }

  window.ECLIPSE_ICONS = { version: 2, icons: ICONS, svg: svg };
})();
