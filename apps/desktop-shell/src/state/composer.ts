// Eclipse OS desktop shell - composer behavior (G9 extraction).
//
// Typed extraction of the editable-composer block from the frozen authority
// (source lines 1765-1788, plus suggestion chips and the rotating placeholder
// hints). Owns the input textarea: auto-grow, focus state, send-ready toggle,
// Enter-to-send, suggestion-chip fill/focus/caret, and the 4200ms placeholder
// rotation. The actual send is delegated to `onSend` so the conversation owns
// transcript state. Returns grow/focus hooks the conversation reuses.

import { requireById, queryAll } from './dom';

export interface ComposerApi {
  /** Resize the textarea to fit and toggle the send button's ready state. */
  autogrow(): void;
  /** Focus the composer textarea. */
  focusField(): void;
}

export function initComposer(onSend: () => void): ComposerApi {
  // editable composer: auto-grow + focus state + send-ready state
  const field = requireById<HTMLTextAreaElement>('inputField');
  const box = requireById('composerCard');
  const send = requireById('sendBtn');

  function autogrow(): void {
    field.style.height = 'auto';
    field.style.height = Math.min(field.scrollHeight, 200) + 'px';
    send.classList.toggle('ready', field.value.trim().length > 0);
  }
  function focusField(): void {
    field.focus();
  }

  field.addEventListener('input', autogrow);
  field.addEventListener('focus', function () {
    box.classList.add('focused');
  });
  field.addEventListener('blur', function () {
    box.classList.remove('focused');
  });
  field.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  });
  send.addEventListener('click', onSend);

  // suggestion links populate the composer and focus it
  queryAll<HTMLElement>('#suggestions .qlink').forEach(function (chip) {
    chip.addEventListener('click', function () {
      field.value = chip.getAttribute('data-prompt') || '';
      autogrow();
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    });
  });

  // ===== fable refresh: rotating composer hints =====
  const hints = [
    'Do anything',
    'Fix the failing test, then rerun CI',
    'Refactor the composer into components',
    'Find where this stack trace comes from',
    'Draft a commit message for my changes',
  ];
  let hintIdx = 0;
  setInterval(function () {
    if (document.activeElement === field || field.value) return;
    hintIdx = (hintIdx + 1) % hints.length;
    field.setAttribute('placeholder', hints[hintIdx]);
  }, 4200);

  return { autogrow, focusField };
}
