import type {
  HarnessEvent,
  HarnessRunId,
  HarnessStatus,
  HarnessToolCallId,
} from "./types";

export type AgentProviderKind = "offline" | "openai-responses" | "local-cli";
export type AgentProviderStatus =
  | "available"
  | "needs-auth"
  | "needs-secure-host"
  | "unavailable";
export type AgentMessageRole = "system" | "user" | "assistant" | "tool";

export interface AgentMessage {
  id: string;
  threadId: string;
  role: AgentMessageRole;
  content: string;
  createdAt: string;
  providerId?: string;
  toolCallId?: HarnessToolCallId;
}

export interface AgentProviderAuth {
  kind: "none" | "api-key" | "cli-session" | "secure-host";
  storage: "none" | "environment" | "os-keychain" | "backend" | "cli-session";
  envVar?: string;
  note: string;
}

export interface AgentProviderCapability {
  id: string;
  label: string;
  kind: "chat" | "streaming" | "tools" | "local-execution" | "import";
  enabled: boolean;
  description?: string;
}

export interface AgentProviderDescriptor {
  id: string;
  label: string;
  shortLabel: string;
  kind: AgentProviderKind;
  status: AgentProviderStatus;
  auth: AgentProviderAuth;
  capabilities: AgentProviderCapability[];
  limitations: string[];
  setup?: string;
}

export interface AgentTurnInput {
  threadId: string;
  runId?: HarnessRunId;
  messages: AgentMessage[];
  prompt: string;
  metadata?: Record<string, unknown>;
}

export type AgentStreamEvent =
  | {
      type: "status";
      status: HarnessStatus;
      label: string;
      timestamp?: string;
    }
  | {
      type: "message.delta";
      messageId: string;
      role: "assistant";
      text: string;
      timestamp?: string;
    }
  | {
      type: "reasoning.delta";
      messageId: string;
      text: string;
      visibility?: "collapsed" | "expanded" | "hidden";
      timestamp?: string;
    }
  | {
      type: "tool.started";
      toolCallId: HarnessToolCallId;
      tool: string;
      input?: unknown;
      timestamp?: string;
    }
  | {
      type: "tool.output";
      toolCallId: HarnessToolCallId;
      stream: "stdout" | "stderr" | "system";
      chunk: string;
      timestamp?: string;
    }
  | {
      type: "tool.finished";
      toolCallId: HarnessToolCallId;
      tool: string;
      output?: unknown;
      exitCode?: number;
      timestamp?: string;
    }
  | {
      type: "error";
      severity: "warning" | "recoverable" | "fatal" | "auth";
      message: string;
      details?: unknown;
      timestamp?: string;
    }
  | {
      type: "done";
      messageId: string;
      timestamp?: string;
    };

export interface AgentProviderAdapter {
  readonly descriptor: AgentProviderDescriptor;
  streamTurn(input: AgentTurnInput): AsyncIterable<AgentStreamEvent>;
}

export interface AgentRegistrySnapshot {
  providers: AgentProviderDescriptor[];
  selectedProviderId: string;
}

export class AgentProviderRegistry {
  readonly #providers = new Map<string, AgentProviderAdapter>();
  #selectedProviderId: string;

  constructor(adapters: AgentProviderAdapter[], selectedProviderId?: string) {
    if (adapters.length === 0) {
      throw new Error("AgentProviderRegistry requires at least one adapter.");
    }

    for (const adapter of adapters) {
      this.#providers.set(adapter.descriptor.id, adapter);
    }

    const fallback = adapters.find(
      (adapter) => adapter.descriptor.status === "available",
    ) ?? adapters[0];
    this.#selectedProviderId =
      selectedProviderId && this.#providers.has(selectedProviderId)
        ? selectedProviderId
        : fallback.descriptor.id;
  }

  listProviders(): AgentProviderDescriptor[] {
    return [...this.#providers.values()].map((adapter) => adapter.descriptor);
  }

  getSelectedProvider(): AgentProviderAdapter {
    const adapter = this.#providers.get(this.#selectedProviderId);
    if (!adapter) {
      throw new Error(`Selected provider not registered: ${this.#selectedProviderId}`);
    }
    return adapter;
  }

  selectProvider(providerId: string): AgentProviderAdapter {
    const adapter = this.#providers.get(providerId);
    if (!adapter) {
      throw new Error(`Unknown provider: ${providerId}`);
    }
    this.#selectedProviderId = providerId;
    return adapter;
  }

  selectNextProvider(): AgentProviderAdapter {
    const adapters = [...this.#providers.values()];
    const currentIndex = adapters.findIndex(
      (adapter) => adapter.descriptor.id === this.#selectedProviderId,
    );
    const next = adapters[(currentIndex + 1) % adapters.length];
    this.#selectedProviderId = next.descriptor.id;
    return next;
  }

  snapshot(): AgentRegistrySnapshot {
    return {
      providers: this.listProviders(),
      selectedProviderId: this.#selectedProviderId,
    };
  }
}

export interface OfflineAgentAdapterOptions {
  id?: string;
  delayMs?: number;
}

export class OfflineAgentAdapter implements AgentProviderAdapter {
  readonly descriptor: AgentProviderDescriptor;
  readonly #delayMs: number;

  constructor(options: OfflineAgentAdapterOptions = {}) {
    const id = options.id ?? "offline-mock";
    this.#delayMs = options.delayMs ?? 80;
    this.descriptor = {
      id,
      label: "Offline Mock",
      shortLabel: "Mock",
      kind: "offline",
      status: "available",
      auth: {
        kind: "none",
        storage: "none",
        note: "Runs entirely in the local browser for demos and tests.",
      },
      capabilities: [
        {
          id: "offline.chat",
          label: "Chat",
          kind: "chat",
          enabled: true,
        },
        {
          id: "offline.streaming",
          label: "Streaming events",
          kind: "streaming",
          enabled: true,
        },
        {
          id: "offline.tools",
          label: "Tool event preview",
          kind: "tools",
          enabled: true,
        },
      ],
      limitations: [
        "Does not call a model.",
        "Uses deterministic local responses for portfolio verification.",
      ],
    };
  }

  async *streamTurn(input: AgentTurnInput): AsyncIterable<AgentStreamEvent> {
    const timestamp = new Date().toISOString();
    const messageId = `assistant-${input.threadId}-${Date.now()}`;
    const toolCallId = `tool-${input.threadId}-${Date.now()}`;
    const normalizedPrompt = input.prompt.trim();

    yield {
      type: "status",
      status: "running",
      label: "Starting offline harness run",
      timestamp,
    };
    await delay(this.#delayMs);
    yield {
      type: "reasoning.delta",
      messageId,
      text: "Normalize the user turn, select the offline adapter, and emit the same event shape a live provider would use.",
      visibility: "collapsed",
      timestamp,
    };
    await delay(this.#delayMs);
    yield {
      type: "tool.started",
      toolCallId,
      tool: "thread_context",
      input: {
        threadId: input.threadId,
        priorMessages: input.messages.length,
      },
      timestamp,
    };
    await delay(this.#delayMs);
    yield {
      type: "tool.output",
      toolCallId,
      stream: "stdout",
      chunk: `loaded ${input.messages.length} prior message(s) from local persistence`,
      timestamp,
    };
    await delay(this.#delayMs);
    yield {
      type: "tool.finished",
      toolCallId,
      tool: "thread_context",
      output: { persisted: true },
      exitCode: 0,
      timestamp,
    };
    await delay(this.#delayMs);

    const response =
      `Offline harness path is live. I saved this turn to the local Eclipse OS thread, ` +
      `selected the ${this.descriptor.label} adapter, and streamed tool activity for: "${normalizedPrompt}".`;

    for (const token of chunkText(response, 22)) {
      yield {
        type: "message.delta",
        messageId,
        role: "assistant",
        text: token,
        timestamp,
      };
      await delay(this.#delayMs);
    }

    yield { type: "done", messageId, timestamp };
  }
}

export interface OpenAIResponsesAdapterOptions {
  id?: string;
  model?: string;
  fetch: AgentFetch;
  getApiKey: () => Promise<string | undefined> | string | undefined;
  endpoint?: string;
}

export interface AgentFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  body?: AgentReadableBody | null;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export interface AgentReadableBody {
  getReader(): AgentReadableReader;
}

export interface AgentReadableReader {
  read(): Promise<{ done?: boolean; value?: Uint8Array }>;
}

export type AgentFetch = (
  url: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
  },
) => Promise<AgentFetchResponse>;

export class OpenAIResponsesAdapter implements AgentProviderAdapter {
  readonly descriptor: AgentProviderDescriptor;
  readonly #fetch: AgentFetch;
  readonly #getApiKey: OpenAIResponsesAdapterOptions["getApiKey"];
  readonly #model: string;
  readonly #endpoint: string;

  constructor(options: OpenAIResponsesAdapterOptions) {
    this.#fetch = options.fetch;
    this.#getApiKey = options.getApiKey;
    this.#model = options.model ?? "gpt-4.1";
    this.#endpoint = options.endpoint ?? "https://api.openai.com/v1/responses";
    this.descriptor = {
      id: options.id ?? "openai-responses",
      label: "OpenAI Responses API",
      shortLabel: "OpenAI",
      kind: "openai-responses",
      status: "needs-secure-host",
      auth: {
        kind: "api-key",
        storage: "environment",
        envVar: "OPENAI_API_KEY",
        note: "API keys must be supplied by a secure backend, environment, or keychain boundary.",
      },
      capabilities: [
        {
          id: "openai.responses.chat",
          label: "Responses chat",
          kind: "chat",
          enabled: true,
        },
        {
          id: "openai.responses.streaming",
          label: "SSE streaming",
          kind: "streaming",
          enabled: true,
        },
      ],
      limitations: [
        "The browser shell does not store or request API keys.",
        "A secure host boundary must inject the key before this adapter can run.",
        "This is OpenAI API support, not ChatGPT consumer subscription sync.",
      ],
      setup: "Set OPENAI_API_KEY in the secure host process and proxy requests through that boundary.",
    };
  }

  async *streamTurn(input: AgentTurnInput): AsyncIterable<AgentStreamEvent> {
    const apiKey = await this.#getApiKey();
    const timestamp = new Date().toISOString();
    const messageId = `assistant-${input.threadId}-${Date.now()}`;

    if (!apiKey) {
      yield {
        type: "error",
        severity: "auth",
        message:
          "OpenAI Responses API is implemented, but this shell has no secure API-key boundary configured.",
        timestamp,
      };
      return;
    }

    const response = await this.#fetch(this.#endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.#model,
        input: input.messages
          .filter((message) => message.role === "user" || message.role === "assistant")
          .map((message) => ({
            role: message.role,
            content: message.content,
          }))
          .concat({ role: "user", content: input.prompt }),
        stream: true,
      }),
    });

    if (!response.ok) {
      yield {
        type: "error",
        severity: response.status === 401 ? "auth" : "recoverable",
        message: `OpenAI Responses API request failed: ${response.status} ${response.statusText}`,
        details: await response.text(),
        timestamp,
      };
      return;
    }

    if (!response.body) {
      const payload = await response.json();
      const text = extractOpenAIText(payload);
      if (text) {
        yield {
          type: "message.delta",
          messageId,
          role: "assistant",
          text,
          timestamp,
        };
      }
      yield { type: "done", messageId, timestamp };
      return;
    }

    const reader = response.body.getReader();
    const decoder = createTextDecoder();
    let buffered = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });

      const result = splitSsePayloads(buffered);
      buffered = result.remainder;
      for (const data of result.payloads) {
        if (data === "[DONE]") continue;
        const delta = extractOpenAITextDelta(parseJson(data));
        if (delta) {
          yield {
            type: "message.delta",
            messageId,
            role: "assistant",
            text: delta,
            timestamp,
          };
        }
      }
    }

    yield { type: "done", messageId, timestamp };
  }
}

export interface LocalCliRunner {
  run(input: AgentTurnInput): AsyncIterable<AgentStreamEvent>;
}

export class LocalCliAgentAdapter implements AgentProviderAdapter {
  readonly descriptor: AgentProviderDescriptor;
  readonly #runner?: LocalCliRunner;

  constructor(options: { id?: string; label?: string; runner?: LocalCliRunner } = {}) {
    this.#runner = options.runner;
    this.descriptor = {
      id: options.id ?? "local-cli",
      label: options.label ?? "Local CLI Agent",
      shortLabel: "CLI",
      kind: "local-cli",
      status: options.runner ? "available" : "needs-secure-host",
      auth: {
        kind: "cli-session",
        storage: "cli-session",
        note: "Uses the local CLI's own authentication; Eclipse OS does not store CLI secrets.",
      },
      capabilities: [
        {
          id: "local-cli.chat",
          label: "CLI-backed chat",
          kind: "chat",
          enabled: Boolean(options.runner),
        },
        {
          id: "local-cli.execution",
          label: "Local execution",
          kind: "local-execution",
          enabled: Boolean(options.runner),
        },
      ],
      limitations: options.runner
        ? ["Execution is delegated to the host-provided runner."]
        : ["Browser builds require a secure host runner before local CLI agents can execute."],
      setup: "Provide a host runner that streams stdout/stderr/tool events from an authenticated CLI.",
    };
  }

  async *streamTurn(input: AgentTurnInput): AsyncIterable<AgentStreamEvent> {
    if (!this.#runner) {
      yield {
        type: "error",
        severity: "auth",
        message:
          "Local CLI adapter is implemented, but no secure host runner is attached to this browser shell.",
        timestamp: new Date().toISOString(),
      };
      return;
    }

    yield* this.#runner.run(input);
  }
}

export function createDefaultAgentRegistry(
  selectedProviderId?: string,
): AgentProviderRegistry {
  return new AgentProviderRegistry(
    [
      new OfflineAgentAdapter(),
      new OpenAIResponsesAdapter({
        fetch: async () => {
          throw new Error("OpenAI adapter requires a secure host fetch implementation.");
        },
        getApiKey: () => undefined,
      }),
      new LocalCliAgentAdapter(),
    ],
    selectedProviderId,
  );
}

export function normalizeAgentEvent(event: AgentStreamEvent): HarnessEvent {
  const timestamp = event.timestamp ?? new Date().toISOString();
  switch (event.type) {
    case "status":
      return {
        type: "status.changed",
        status: event.status,
        timestamp,
      };
    case "message.delta":
      return {
        type: "message.delta",
        messageId: event.messageId,
        role: event.role,
        text: event.text,
        timestamp,
      };
    case "reasoning.delta":
      return {
        type: "reasoning.delta",
        messageId: event.messageId,
        text: event.text,
        visibility: event.visibility,
        timestamp,
      };
    case "tool.started":
      return {
        type: "tool.started",
        toolCallId: event.toolCallId,
        tool: event.tool,
        input: event.input,
        timestamp,
      };
    case "tool.output":
      return {
        type: "tool.output",
        toolCallId: event.toolCallId,
        stream: event.stream,
        chunk: event.chunk,
        timestamp,
      };
    case "tool.finished":
      return {
        type: "tool.finished",
        toolCallId: event.toolCallId,
        tool: event.tool,
        output: event.output,
        exitCode: event.exitCode,
        timestamp,
      };
    case "error":
      return {
        type: "error",
        severity: event.severity,
        message: event.message,
        details: event.details,
        timestamp,
      };
    case "done":
      return {
        type: "run.finished",
        status: "completed",
        timestamp,
      };
  }
}

export function extractOpenAITextDelta(payload: unknown): string {
  if (!isRecord(payload)) return "";
  if (payload.type === "response.output_text.delta" && typeof payload.delta === "string") {
    return payload.delta;
  }
  return "";
}

export function extractOpenAIText(payload: unknown): string {
  if (!isRecord(payload)) return "";
  if (typeof payload.output_text === "string") return payload.output_text;
  return "";
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  const timer = (globalThis as {
    setTimeout?: (handler: () => void, timeout: number) => unknown;
  }).setTimeout;
  if (!timer) return Promise.resolve();
  return new Promise((resolve) => {
    timer(resolve, ms);
  });
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function splitSsePayloads(buffer: string): { payloads: string[]; remainder: string } {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const parts = normalized.split("\n\n");
  const remainder = parts.pop() ?? "";
  const payloads = parts
    .flatMap((part) =>
      part
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim()),
    )
    .filter(Boolean);
  return { payloads, remainder };
}

function createTextDecoder(): {
  decode(value?: Uint8Array, options?: { stream?: boolean }): string;
} {
  const decoder = (globalThis as {
    TextDecoder?: new () => {
      decode(value?: Uint8Array, options?: { stream?: boolean }): string;
    };
  }).TextDecoder;
  if (!decoder) {
    throw new Error("Streaming OpenAI responses require TextDecoder.");
  }
  return new decoder();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
