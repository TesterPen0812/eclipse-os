import {
  createDefaultAgentRegistry,
  type AgentProviderAdapter,
  type AgentProviderDescriptor,
  type AgentStreamEvent,
} from "@eclipse-os/harness-core";
import {
  EclipseHarnessSettingsStore,
  EclipseLocalThreadStore,
  MemoryKeyValueStorage,
  type EclipseThread,
  type KeyValueStorage,
} from "@eclipse-os/harness-eclipse";

type ScenarioStep =
  | { type: "reason"; secs: number; text: string }
  | {
      type: "tool";
      tool: {
        kind: "terminal";
        run: string;
        done: string;
        result: string;
        status: string;
        perMs: number;
        lines: Array<{ t: string }>;
      };
    }
  | { type: "say"; blocks: Array<{ p: string }> };

interface ArchiveRuntime extends Window {
  __sbStreaming?: boolean;
  addAssistant?: (scenario: ScenarioStep[], moonSnapshot?: unknown) => void;
  addUser?: (text: string) => void;
  autogrow?: () => void;
  chatTitleText?: HTMLElement;
  doSend?: () => void;
  field?: HTMLTextAreaElement;
  main?: HTMLElement;
  setStreaming?: (streaming: boolean) => void;
  snapMoon?: () => unknown;
  stopStream?: () => void;
  __eclipseHarness?: {
    provider: () => AgentProviderDescriptor;
    threads: () => EclipseThread[];
  };
}

const runtime = window as ArchiveRuntime;
const field = runtime.field ?? document.querySelector<HTMLTextAreaElement>("#inputField");
const main = runtime.main ?? document.querySelector<HTMLElement>(".main");
const title = runtime.chatTitleText ?? document.querySelector<HTMLElement>("#chatTitleText");
const modelControl = document.querySelector<HTMLElement>(".model");
const newChat = document.querySelector<HTMLElement>("#newChat");

if (
  field &&
  main &&
  title &&
  runtime.addAssistant &&
  runtime.addUser &&
  runtime.autogrow &&
  runtime.setStreaming
) {
  const composerField = field;
  const mainPane = main;
  const chatTitle = title;
  const storage = browserStorage();
  const settingsStore = new EclipseHarnessSettingsStore(storage);
  const registry = createDefaultAgentRegistry(settingsStore.getSelectedProviderId());
  const threadStore = new EclipseLocalThreadStore(storage);
  const originalStopStream = runtime.stopStream;
  let provider = registry.getSelectedProvider();
  let collecting = false;
  let activeCollection = 0;

  const renderProvider = () => {
    if (!modelControl) return;
    const descriptor = provider.descriptor;
    const number = modelControl.querySelector<HTMLElement>(".num");
    const effort = modelControl.querySelector<HTMLElement>(".eff");
    const state = descriptor.status === "available" ? "Ready" : "Host";

    if (number) number.textContent = descriptor.shortLabel;
    if (effort?.firstChild) effort.firstChild.textContent = `${state} `;
    modelControl.dataset.tip =
      descriptor.status === "available"
        ? `${descriptor.label} is ready`
        : `${descriptor.label} requires a secure host`;
    modelControl.setAttribute("aria-label", `Provider: ${descriptor.label}. ${state}.`);
    modelControl.setAttribute("role", "button");
    modelControl.setAttribute("tabindex", "0");
  };

  const selectNextProvider = () => {
    provider = registry.selectNextProvider();
    settingsStore.setSelectedProviderId(provider.descriptor.id);
    renderProvider();
  };

  modelControl?.addEventListener("click", selectNextProvider);
  modelControl?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectNextProvider();
  });

  newChat?.addEventListener("click", () => {
    threadStore.setActiveThread(undefined);
  });

  runtime.stopStream = () => {
    if (collecting) {
      activeCollection += 1;
      collecting = false;
      runtime.setStreaming?.(false);
      return;
    }
    originalStopStream?.();
  };

  runtime.doSend = () => {
    void sendThroughHarness();
  };

  runtime.__eclipseHarness = {
    provider: () => provider.descriptor,
    threads: () => threadStore.listThreads(),
  };

  renderProvider();

  async function sendThroughHarness() {
    const prompt = composerField.value.trim();
    if (!prompt || collecting || runtime.__sbStreaming) return;
    collecting = true;
    const collection = ++activeCollection;

    const enteringChat = !mainPane.classList.contains("chat");
    const moonSnapshot = enteringChat ? runtime.snapMoon?.() : undefined;
    const selected = provider;
    const thread = activeThreadFor(selected, prompt);
    const priorMessages = [...thread.messages];

    threadStore.appendMessage(thread.id, {
      threadId: thread.id,
      role: "user",
      content: prompt,
      providerId: selected.descriptor.id,
    });

    composerField.value = "";
    runtime.autogrow?.();
    chatTitle.textContent = prompt.length > 46 ? `${prompt.slice(0, 46)}\u2026` : prompt;

    if (enteringChat) {
      mainPane.classList.add("hero-out");
      await delay(210);
      mainPane.classList.add("chat");
    }

    runtime.addUser?.(prompt);
    composerField.focus();
    runtime.setStreaming?.(true);

    const events = await collectEvents(selected, {
      threadId: thread.id,
      messages: priorMessages,
      prompt,
    });

    if (collection !== activeCollection) return;
    collecting = false;
    runtime.setStreaming?.(false);

    const assistantText = events
      .filter((event) => event.type === "message.delta")
      .map((event) => event.text)
      .join("")
      .trim();
    const errorText = events
      .filter((event) => event.type === "error")
      .map((event) => event.message)
      .join(" ")
      .trim();
    const persistedText = assistantText || errorText || "The provider returned no message.";

    threadStore.appendMessage(thread.id, {
      threadId: thread.id,
      role: "assistant",
      content: persistedText,
      providerId: selected.descriptor.id,
    });

    runtime.addAssistant?.(eventsToScenario(events, selected), moonSnapshot);
  }

  function activeThreadFor(selected: AgentProviderAdapter, prompt: string): EclipseThread {
    const active = threadStore.getActiveThread();
    if (active?.providerId === selected.descriptor.id) return active;
    return threadStore.createThread({
      providerId: selected.descriptor.id,
      titleSeed: prompt,
    });
  }
}

async function collectEvents(
  provider: AgentProviderAdapter,
  input: Parameters<AgentProviderAdapter["streamTurn"]>[0],
): Promise<AgentStreamEvent[]> {
  const events: AgentStreamEvent[] = [];
  try {
    for await (const event of provider.streamTurn(input)) events.push(event);
  } catch (error) {
    events.push({
      type: "error",
      severity: "fatal",
      message: error instanceof Error ? error.message : "The provider failed unexpectedly.",
    });
  }
  return events;
}

function eventsToScenario(
  events: AgentStreamEvent[],
  provider: AgentProviderAdapter,
): ScenarioStep[] {
  const steps: ScenarioStep[] = [];
  const reasoning = events
    .filter((event) => event.type === "reasoning.delta")
    .map((event) => event.text)
    .join(" ")
    .trim();
  const toolStart = events.find((event) => event.type === "tool.started");
  const toolLines = events
    .filter((event) => event.type === "tool.output")
    .map((event) => ({ t: event.chunk.trim() }))
    .filter((line) => line.t.length > 0);
  const assistant = events
    .filter((event) => event.type === "message.delta")
    .map((event) => event.text)
    .join("")
    .trim();
  const errors = events
    .filter((event) => event.type === "error")
    .map((event) => event.message)
    .join(" ")
    .trim();

  if (reasoning) steps.push({ type: "reason", secs: 1, text: reasoning });
  if (toolStart?.type === "tool.started") {
    steps.push({
      type: "tool",
      tool: {
        kind: "terminal",
        run: `Running \`${toolStart.tool}\``,
        done: `Ran \`${toolStart.tool}\``,
        result: "Harness event",
        status: `Running ${provider.descriptor.shortLabel}\u2026`,
        perMs: 70,
        lines: toolLines.length > 0 ? toolLines : [{ t: "completed" }],
      },
    });
  }

  steps.push({
    type: "say",
    blocks: [
      {
        p:
          assistant ||
          errors ||
          `${provider.descriptor.label} returned without a displayable response.`,
      },
    ],
  });
  return steps;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function browserStorage(): KeyValueStorage {
  try {
    const storage = window.localStorage;
    const probe = "eclipse-os.storage-probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return new MemoryKeyValueStorage();
  }
}
