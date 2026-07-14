// Eclipse OS desktop shell - conversation / transcript state (G9 extraction).
//
// Typed extraction of the conversation block from the frozen authority
// (source lines 1790-1858). Owns the transcript: hero -> chat transition
// (210ms hero-out before the chat view takes over), user bubbles, the 850ms
// assistant typing delay, the canned first/follow replies, and the expandable
// reasoning toggle. Composer grow/focus is delegated back via ComposerApi.

import { requireById, requireQuery } from './dom';
import type { ComposerApi } from './composer';
import {
  createDefaultAgentRegistry,
  type AgentProviderDescriptor,
  type AgentStreamEvent,
} from '@eclipse-os/harness-core';
import {
  EclipseHarnessSettingsStore,
  EclipseLocalThreadStore,
  MemoryKeyValueStorage,
  type EclipseThread,
  type KeyValueStorage,
} from '@eclipse-os/harness-eclipse';

export interface ConversationApi {
  /** Send the current composer text into the transcript. */
  doSend(): void;
  /** Reset the transcript + composer to the home / empty state. */
  reset(): void;
}

export function createConversation(composer: ComposerApi): ConversationApi {
  const field = requireById<HTMLTextAreaElement>('inputField');
  const main = requireQuery<HTMLElement>('.main');
  const transcript = requireById('transcript');
  const inner = requireById('transcriptInner');
  const chatTitleText = requireById('chatTitleText');
  const modelPicker = requireQuery<HTMLElement>('.model');
  const modelNumber = requireQuery<HTMLElement>('.model .num');
  const modelEffort = requireQuery<HTMLElement>('.model .eff');
  const storage = createBrowserStorage();
  const threadStore = new EclipseLocalThreadStore(storage);
  const settingsStore = new EclipseHarnessSettingsStore(storage);
  const registry = createDefaultAgentRegistry(settingsStore.getSelectedProviderId());
  settingsStore.setSelectedProviderId(registry.snapshot().selectedProviderId);
  let activeThread: EclipseThread | undefined = threadStore.getActiveThread();
  let streaming = false;

  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttribute(s: string): string {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }
  function scrollDown(): void {
    transcript.scrollTop = transcript.scrollHeight;
  }
  function addUser(text: string): void {
    const el = document.createElement('div');
    el.className = 'msg-user';
    el.innerHTML = '<div class="bubble">' + escapeHtml(text) + '</div>';
    inner.appendChild(el);
    scrollDown();
  }
  function addTyping(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'msg-ai';
    el.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    inner.appendChild(el);
    scrollDown();
    return el;
  }

  function bindReasons(scope: HTMLElement): void {
    scope.querySelectorAll<HTMLElement>('.reason-head').forEach(function (h) {
      h.addEventListener('click', function () {
        const r = h.closest('.reason');
        if (!r) return;
        r.setAttribute('data-open', r.getAttribute('data-open') === 'true' ? 'false' : 'true');
        scrollDown();
      });
    });
  }

  function providerStatusText(provider: AgentProviderDescriptor): string {
    if (provider.status === 'available') return 'Ready';
    if (provider.status === 'needs-auth') return 'Auth';
    if (provider.status === 'needs-secure-host') return 'Host';
    return 'Off';
  }

  function renderProviderPicker(): void {
    const provider = registry.getSelectedProvider().descriptor;
    modelNumber.textContent = provider.shortLabel;
    const chev = modelEffort.querySelector('svg');
    modelEffort.textContent = providerStatusText(provider);
    if (chev) modelEffort.appendChild(chev);
    modelPicker.title = `${provider.label}: ${provider.limitations.join(' ')}`;
    modelPicker.setAttribute('data-provider', provider.id);
    modelPicker.setAttribute('data-provider-status', provider.status);
  }

  function renderThreadRows(): void {
    document.querySelectorAll('.row.chat-row[data-eclipse-thread-id]').forEach((row) => row.remove());
    const chatLabel = document.querySelector('.section-label.chats');
    if (!chatLabel?.parentElement) return;
    let anchor: Element = chatLabel;
    for (const thread of threadStore.listThreads().slice(0, 5)) {
      const row = document.createElement('div');
      row.className = 'row chat-row';
      row.setAttribute('data-eclipse-thread-id', thread.id);
      if (activeThread?.id === thread.id) row.classList.add('active');
      row.innerHTML =
        '<span class="label">' +
        escapeHtml(thread.title) +
        '</span><span class="time">' +
        timeLabel(thread.updatedAt) +
        '</span>';
      row.addEventListener('click', function () {
        loadThread(thread.id);
      });
      anchor.insertAdjacentElement('afterend', row);
      anchor = row;
    }
  }

  function enterChat(title: string, afterEnter: () => void): void {
    const entering = !main.classList.contains('chat');
    if (entering) {
      chatTitleText.textContent = title.length > 46 ? title.slice(0, 46) + '…' : title;
      main.classList.add('hero-out');
      setTimeout(function () {
        main.classList.add('chat');
        afterEnter();
      }, 210);
    } else {
      afterEnter();
    }
  }

  function renderThread(thread: EclipseThread): void {
    inner.innerHTML = '';
    for (const message of thread.messages) {
      if (message.role === 'user') {
        addUser(message.content);
      } else if (message.role === 'assistant') {
        const el = document.createElement('div');
        el.className = 'msg-ai';
        el.innerHTML = '<p>' + escapeHtml(message.content) + '</p>';
        inner.appendChild(el);
      }
    }
    bindReasons(inner);
    scrollDown();
  }

  function loadThread(threadId: string): void {
    const thread = threadStore.listThreads().find((candidate) => candidate.id === threadId);
    if (!thread) return;
    activeThread = thread;
    threadStore.setActiveThread(thread.id);
    chatTitleText.textContent = thread.title;
    main.classList.add('hero-out');
    main.classList.add('chat');
    renderThread(thread);
    renderThreadRows();
    composer.focusField();
  }

  function getOrCreateActiveThread(prompt: string): EclipseThread {
    const providerId = registry.getSelectedProvider().descriptor.id;
    activeThread = threadStore.getOrCreateThread({
      providerId,
      titleSeed: prompt,
    });
    return activeThread;
  }

  function ensureParagraph(container: HTMLElement): HTMLElement {
    let paragraph = container.querySelector<HTMLElement>('[data-agent-message]');
    if (!paragraph) {
      paragraph = document.createElement('p');
      paragraph.setAttribute('data-agent-message', 'true');
      container.appendChild(paragraph);
    }
    return paragraph;
  }

  function ensureReason(container: HTMLElement, messageId: string): HTMLElement {
    let reason = container.querySelector<HTMLElement>('.reason[data-message-id="' + escapeAttribute(messageId) + '"]');
    if (!reason) {
      reason = document.createElement('div');
      reason.className = 'reason';
      reason.setAttribute('data-open', 'false');
      reason.setAttribute('data-message-id', messageId);
      reason.innerHTML =
        '<div class="reason-head"><svg class="rchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>Stream plan</div>' +
        '<div class="reason-body"></div>';
      container.insertBefore(reason, container.firstChild);
      bindReasons(reason);
    }
    return requireInside(reason, '.reason-body');
  }

  function ensureTool(container: HTMLElement, event: Extract<AgentStreamEvent, { type: 'tool.started' | 'tool.output' | 'tool.finished' }>): HTMLElement {
    let tool = container.querySelector<HTMLElement>('.tool[data-tool-call-id="' + escapeAttribute(event.toolCallId) + '"]');
    if (!tool) {
      const label = event.type === 'tool.started' || event.type === 'tool.finished' ? event.tool : 'tool';
      tool = document.createElement('div');
      tool.className = 'tool';
      tool.setAttribute('data-tool-call-id', event.toolCallId);
      tool.innerHTML =
        '<div class="tool-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7l4 5-4 5"/><path d="M13 17h6"/></svg><span class="cmd">' +
        escapeHtml(label) +
        '</span><span class="tool-status">running</span></div><div class="tool-body"></div>';
      container.appendChild(tool);
    }
    return tool;
  }

  async function addAssistant(thread: EclipseThread, prompt: string): Promise<void> {
    const typingEl = addTyping();
    const adapter = registry.getSelectedProvider();
    const provider = adapter.descriptor;
    let assistantText = '';

    try {
      for await (const event of adapter.streamTurn({
        threadId: thread.id,
        messages: thread.messages,
        prompt,
      })) {
        if (typingEl.querySelector('.typing')) typingEl.innerHTML = '';
        if (event.type === 'reasoning.delta') {
          const body = ensureReason(typingEl, event.messageId);
          body.textContent = [body.textContent, event.text].filter(Boolean).join(' ');
        } else if (event.type === 'tool.started') {
          ensureTool(typingEl, event);
        } else if (event.type === 'tool.output') {
          const tool = ensureTool(typingEl, event);
          const body = requireInside(tool, '.tool-body');
          body.textContent = [body.textContent, event.chunk].filter(Boolean).join('\n');
        } else if (event.type === 'tool.finished') {
          const tool = ensureTool(typingEl, event);
          const status = requireInside(tool, '.tool-status');
          status.textContent = event.exitCode === 0 ? 'done' : 'failed';
        } else if (event.type === 'message.delta') {
          assistantText += event.text;
          ensureParagraph(typingEl).textContent = assistantText;
        } else if (event.type === 'error') {
          assistantText = event.message;
          ensureParagraph(typingEl).innerHTML =
            '<strong>' +
            escapeHtml(provider.label) +
            '</strong>: ' +
            escapeHtml(event.message);
        }
        scrollDown();
      }
    } catch (error) {
      assistantText =
        error instanceof Error ? error.message : 'Provider stream failed unexpectedly.';
      typingEl.innerHTML = '<p>' + escapeHtml(assistantText) + '</p>';
      scrollDown();
    }

    if (assistantText) {
      threadStore.appendMessage(thread.id, {
        threadId: thread.id,
        role: 'assistant',
        content: assistantText,
        providerId: provider.id,
      });
      activeThread = threadStore.getActiveThread();
      renderThreadRows();
    }
  }

  function doSend(): void {
    if (streaming) return;
    const text = field.value.trim();
    if (!text) return;
    streaming = true;
    const thread = getOrCreateActiveThread(text);
    threadStore.appendMessage(thread.id, {
      threadId: thread.id,
      role: 'user',
      content: text,
      providerId: registry.getSelectedProvider().descriptor.id,
    });
    activeThread = threadStore.getActiveThread() ?? thread;
    field.value = '';
    composer.autogrow();
    renderThreadRows();
    enterChat(activeThread.title, function () {
      addUser(text);
      composer.focusField();
      void addAssistant(activeThread ?? thread, text).finally(function () {
        streaming = false;
      });
    });
  }

  function reset(): void {
    main.classList.remove('chat');
    main.classList.remove('hero-out');
    inner.innerHTML = '';
    activeThread = undefined;
    threadStore.setActiveThread(undefined);
    field.value = '';
    composer.autogrow();
    chatTitleText.textContent = '';
    renderThreadRows();
  }

  modelPicker.addEventListener('click', function () {
    const next = registry.selectNextProvider();
    settingsStore.setSelectedProviderId(next.descriptor.id);
    renderProviderPicker();
  });

  renderProviderPicker();
  renderThreadRows();
  if (activeThread) {
    chatTitleText.textContent = activeThread.title;
  }

  return { doSend, reset };
}

function createBrowserStorage(): KeyValueStorage {
  try {
    const storage = window.localStorage;
    const probe = '__eclipse_os_storage_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return new MemoryKeyValueStorage();
  }
}

function timeLabel(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return 'now';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function requireInside(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Missing expected transcript node: ${selector}`);
  return el;
}
