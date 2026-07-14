// Eclipse OS desktop shell - environment panel (G9 extraction).
//
// Typed extraction of the environment-panel toggle from the frozen authority
// (source lines 1860-1875). Owns the slide-open panel and its scroll-fade
// affordance. `reset()` is the env-panel half of the "new chat" reset and is
// composed with the conversation reset by the orchestrator.

import { requireById, requireQuery } from './dom';

export interface EnvPanelApi {
  /** Close the panel and clear the toggle's active state. */
  reset(): void;
}

export function initEnvPanel(): EnvPanelApi {
  // environment panel toggle (only meaningful while a chat is active)
  const main = requireQuery<HTMLElement>('.main');
  const envToggle = requireById('envToggle');
  const envPanelEl = requireById('envPanel');
  const envScrollEl = requireQuery<HTMLElement>('.env-scroll', envPanelEl);

  function envFade(): void {
    envPanelEl.classList.toggle(
      'can-scroll',
      envScrollEl.scrollTop + envScrollEl.clientHeight < envScrollEl.scrollHeight - 6,
    );
  }
  envScrollEl.addEventListener('scroll', envFade, { passive: true });
  window.addEventListener('resize', envFade);
  envToggle.addEventListener('click', function () {
    const open = main.classList.toggle('panel-open');
    envToggle.classList.toggle('active', open);
    if (open) requestAnimationFrame(envFade);
  });

  function reset(): void {
    main.classList.remove('panel-open');
    envToggle.classList.remove('active');
  }

  return { reset };
}
