import type { AgentMessage } from "@eclipse-os/harness-core";

export const ECLIPSE_THREADS_STORAGE_KEY = "eclipse-os.agentThreads.v1";
export const ECLIPSE_SETTINGS_STORAGE_KEY = "eclipse-os.harnessSettings.v1";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface EclipseThread {
  id: string;
  title: string;
  providerId: string;
  createdAt: string;
  updatedAt: string;
  messages: AgentMessage[];
}

export interface EclipseThreadSnapshot {
  version: 1;
  activeThreadId?: string;
  threads: EclipseThread[];
}

export interface EclipseHarnessSettings {
  version: 1;
  selectedProviderId: string;
}

export class MemoryKeyValueStorage implements KeyValueStorage {
  readonly #values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value);
  }

  removeItem(key: string): void {
    this.#values.delete(key);
  }
}

export class EclipseLocalThreadStore {
  readonly #storage: KeyValueStorage;
  readonly #now: () => string;
  readonly #id: (prefix: string) => string;
  #snapshot: EclipseThreadSnapshot;

  constructor(
    storage: KeyValueStorage,
    options: {
      now?: () => string;
      id?: (prefix: string) => string;
    } = {},
  ) {
    this.#storage = storage;
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#id = options.id ?? createId;
    this.#snapshot = readThreadSnapshot(storage);
  }

  snapshot(): EclipseThreadSnapshot {
    return cloneSnapshot(this.#snapshot);
  }

  listThreads(): EclipseThread[] {
    return [...this.#snapshot.threads].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  getActiveThread(): EclipseThread | undefined {
    return this.#snapshot.threads.find(
      (thread) => thread.id === this.#snapshot.activeThreadId,
    );
  }

  setActiveThread(threadId: string | undefined): void {
    this.#snapshot.activeThreadId = threadId;
    this.#write();
  }

  getOrCreateThread(input: {
    providerId: string;
    titleSeed?: string;
  }): EclipseThread {
    const active = this.getActiveThread();
    if (active) return active;
    return this.createThread(input);
  }

  createThread(input: { providerId: string; titleSeed?: string }): EclipseThread {
    const timestamp = this.#now();
    const thread: EclipseThread = {
      id: this.#id("thread"),
      title: titleFromSeed(input.titleSeed),
      providerId: input.providerId,
      createdAt: timestamp,
      updatedAt: timestamp,
      messages: [],
    };
    this.#snapshot.threads.unshift(thread);
    this.#snapshot.activeThreadId = thread.id;
    this.#write();
    return thread;
  }

  appendMessage(threadId: string, message: Omit<AgentMessage, "id" | "createdAt">): AgentMessage {
    const thread = this.#requireThread(threadId);
    const timestamp = this.#now();
    const saved: AgentMessage = {
      ...message,
      id: this.#id("message"),
      createdAt: timestamp,
    };
    thread.messages.push(saved);
    thread.updatedAt = timestamp;
    if (message.role === "user" && thread.messages.length === 1) {
      thread.title = titleFromSeed(message.content);
    }
    this.#write();
    return saved;
  }

  replaceMessages(threadId: string, messages: AgentMessage[]): void {
    const thread = this.#requireThread(threadId);
    thread.messages = [...messages];
    thread.updatedAt = this.#now();
    this.#write();
  }

  clear(): void {
    this.#snapshot = { version: 1, threads: [] };
    this.#write();
  }

  #requireThread(threadId: string): EclipseThread {
    const thread = this.#snapshot.threads.find((candidate) => candidate.id === threadId);
    if (!thread) {
      throw new Error(`Unknown Eclipse OS thread: ${threadId}`);
    }
    return thread;
  }

  #write(): void {
    this.#storage.setItem(ECLIPSE_THREADS_STORAGE_KEY, JSON.stringify(this.#snapshot));
  }
}

export class EclipseHarnessSettingsStore {
  readonly #storage: KeyValueStorage;
  #settings: EclipseHarnessSettings;

  constructor(storage: KeyValueStorage, fallbackProviderId = "offline-mock") {
    this.#storage = storage;
    this.#settings = readHarnessSettings(storage, fallbackProviderId);
  }

  getSelectedProviderId(): string {
    return this.#settings.selectedProviderId;
  }

  setSelectedProviderId(providerId: string): void {
    this.#settings = {
      version: 1,
      selectedProviderId: providerId,
    };
    this.#storage.setItem(ECLIPSE_SETTINGS_STORAGE_KEY, JSON.stringify(this.#settings));
  }
}

export function readThreadSnapshot(storage: KeyValueStorage): EclipseThreadSnapshot {
  const raw = storage.getItem(ECLIPSE_THREADS_STORAGE_KEY);
  if (!raw) return { version: 1, threads: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<EclipseThreadSnapshot>;
    if (parsed.version !== 1 || !Array.isArray(parsed.threads)) {
      return { version: 1, threads: [] };
    }
    return {
      version: 1,
      activeThreadId:
        typeof parsed.activeThreadId === "string" ? parsed.activeThreadId : undefined,
      threads: parsed.threads.filter(isThread),
    };
  } catch {
    return { version: 1, threads: [] };
  }
}

export function readHarnessSettings(
  storage: KeyValueStorage,
  fallbackProviderId: string,
): EclipseHarnessSettings {
  const raw = storage.getItem(ECLIPSE_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return { version: 1, selectedProviderId: fallbackProviderId };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<EclipseHarnessSettings>;
    if (parsed.version !== 1 || typeof parsed.selectedProviderId !== "string") {
      return { version: 1, selectedProviderId: fallbackProviderId };
    }
    return {
      version: 1,
      selectedProviderId: parsed.selectedProviderId,
    };
  } catch {
    return { version: 1, selectedProviderId: fallbackProviderId };
  }
}

function cloneSnapshot(snapshot: EclipseThreadSnapshot): EclipseThreadSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as EclipseThreadSnapshot;
}

function titleFromSeed(seed: string | undefined): string {
  const value = seed?.trim();
  if (!value) return "New thread";
  return value.length > 42 ? `${value.slice(0, 42)}...` : value;
}

function createId(prefix: string): string {
  const cryptoRef = (globalThis as {
    crypto?: { randomUUID?: () => string };
  }).crypto;
  if (cryptoRef?.randomUUID) return `${prefix}-${cryptoRef.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isThread(value: unknown): value is EclipseThread {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<EclipseThread>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.providerId === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    Array.isArray(candidate.messages)
  );
}
