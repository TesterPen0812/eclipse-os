// Eclipse OS desktop shell - behavior orchestrator (G9).
//
// Wires the extracted typed behavior modules against the mounted baseline DOM,
// reproducing the single bind / single animation-loop semantics of the frozen
// static authority. Composer and conversation reference each other through a small
// holder so neither imports the other's binding eagerly (both are created before
// any user interaction fires).

import { requireById } from './dom';
import { initComposer } from './composer';
import { createConversation } from './conversation';
import { initEnvPanel } from './envPanel';
import { initSidebar } from './sidebar';
import { initAmbient } from './ambient';
import { initMoonRenderer } from './moonRenderer';

let started = false;

/**
 * Bind composer / conversation / sidebar / environment-panel / ambient behavior
 * and start the ASCII moon field. Call once, after the baseline markup (with its
 * original ids) is mounted. Guarded against double-binding.
 */
export function initDesktopBehavior(): void {
  if (started) return;
  started = true;

  // composer needs the send handler; the conversation needs the composer's
  // grow/focus hooks. Bind through `send` so the cycle resolves at call time.
  let send: () => void = () => {};
  const composer = initComposer(() => send());
  const conversation = createConversation(composer);
  send = conversation.doSend;

  const envPanel = initEnvPanel();

  // New chat resets to the home / empty state. The source did this in one
  // handler; here the env-panel and conversation each own their half. The net
  // set of class/state mutations is identical.
  requireById('newChat').addEventListener('click', function () {
    envPanel.reset();
    conversation.reset();
  });

  initSidebar();
  initAmbient();
  initMoonRenderer();
}
