// Eclipse OS desktop shell - collapsible + resizable sidebar (G9 extraction).
//
// Typed extraction of the sidebar block from the frozen authority (source lines
// 1877-1939). Owns drag-to-resize (collapsing below COLLAPSE_AT), the toggle
// button, persisted width/collapsed state (sb-sidebar-w / sb-sidebar-collapsed),
// double-click-to-reset, and single-active-item selection. localStorage values
// are stringified explicitly (the browser coerced them implicitly before); the
// stored values are identical.

import { requireById, requireQuery, queryAll } from './dom';

export function initSidebar(): void {
  const appEl = requireQuery<HTMLElement>('.app');
  const sidebarEl = requireQuery<HTMLElement>('.sidebar');
  const resizer = requireById('resizer');
  const sidebarToggle = requireById('sidebarToggle');
  const DEFAULT_W = 242,
    MIN_W = 210,
    MAX_W = 460,
    COLLAPSE_AT = 172;

  function clampW(w: number): number {
    return Math.max(MIN_W, Math.min(MAX_W, w));
  }

  // restore saved state
  const savedW = parseInt(localStorage.getItem('sb-sidebar-w') || '', 10);
  if (savedW) appEl.style.setProperty('--sidebar-w', clampW(savedW) + 'px');
  if (localStorage.getItem('sb-sidebar-collapsed') === '1') appEl.classList.add('sidebar-collapsed');
  if (
    window.matchMedia('(max-width: 700px)').matches &&
    localStorage.getItem('sb-sidebar-collapsed') === null
  ) {
    appEl.classList.add('sidebar-collapsed');
  }

  function setCollapsed(on: boolean): void {
    appEl.classList.toggle('sidebar-collapsed', on);
    localStorage.setItem('sb-sidebar-collapsed', on ? '1' : '0');
  }
  sidebarToggle.addEventListener('click', function () {
    setCollapsed(!appEl.classList.contains('sidebar-collapsed'));
  });

  // drag to resize - collapses if dragged below the minimum
  let startX = 0,
    startW = 0;
  function onMove(e: MouseEvent): void {
    const raw = startW + (e.clientX - startX);
    if (raw < COLLAPSE_AT) {
      if (!appEl.classList.contains('sidebar-collapsed')) appEl.classList.add('sidebar-collapsed');
    } else {
      appEl.classList.remove('sidebar-collapsed');
      appEl.style.setProperty('--sidebar-w', clampW(raw) + 'px');
    }
  }
  function onUp(): void {
    appEl.classList.remove('resizing');
    resizer.classList.remove('active');
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    const collapsed = appEl.classList.contains('sidebar-collapsed');
    localStorage.setItem('sb-sidebar-collapsed', collapsed ? '1' : '0');
    if (!collapsed) localStorage.setItem('sb-sidebar-w', String(parseInt(getComputedStyle(sidebarEl).width, 10)));
  }
  resizer.addEventListener('mousedown', function (e) {
    if (appEl.classList.contains('sidebar-collapsed')) return;
    e.preventDefault();
    startX = e.clientX;
    startW = parseInt(getComputedStyle(sidebarEl).width, 10);
    appEl.classList.add('resizing');
    resizer.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  resizer.addEventListener('dblclick', function () {
    appEl.style.setProperty('--sidebar-w', DEFAULT_W + 'px');
    localStorage.setItem('sb-sidebar-w', String(DEFAULT_W));
  });

  // sidebar selection - single persistent active item
  const selectables = queryAll<HTMLElement>('.row, .nav-item, .conn-head');
  selectables.forEach(function (el) {
    el.addEventListener('click', function () {
      selectables.forEach(function (s) {
        s.classList.remove('active');
      });
      el.classList.add('active');
    });
  });
}
