import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const buildRoot = process.env.HARNESS_TEST_BUILD_DIR;
if (!buildRoot) {
  throw new Error("HARNESS_TEST_BUILD_DIR is required.");
}

const coreUrl = pathToFileURL(
  path.join(buildRoot, "packages/harness-core/src/index.js"),
).href;
const eclipseUrl = pathToFileURL(
  path.join(buildRoot, "packages/harness-eclipse/src/index.js"),
).href;

async function loadCore() {
  return import(coreUrl);
}

async function loadEclipse() {
  return import(eclipseUrl);
}

test("provider registry falls back to an available adapter", async () => {
  const core = await loadCore();
  const registry = core.createDefaultAgentRegistry("missing-provider");

  assert.equal(registry.getSelectedProvider().descriptor.id, "offline-mock");
  assert.deepEqual(
    registry.listProviders().map((provider) => provider.id),
    ["offline-mock", "openai-responses", "local-cli"],
  );
});

test("offline adapter streams assistant, reasoning, and tool events", async () => {
  const core = await loadCore();
  const adapter = new core.OfflineAgentAdapter({ delayMs: 0 });
  const events = [];

  for await (const event of adapter.streamTurn({
    threadId: "thread-1",
    messages: [],
    prompt: "Prove the harness path",
  })) {
    events.push(event);
  }

  assert.ok(events.some((event) => event.type === "reasoning.delta"));
  assert.ok(events.some((event) => event.type === "tool.started"));
  assert.ok(events.some((event) => event.type === "tool.finished"));
  assert.ok(events.some((event) => event.type === "message.delta"));

  const normalized = core.normalizeAgentEvent(
    events.find((event) => event.type === "message.delta"),
  );
  assert.equal(normalized.type, "message.delta");
  assert.equal(normalized.role, "assistant");
});

test("OpenAI adapter keeps auth behind an injected secure boundary", async () => {
  const core = await loadCore();
  assert.equal(
    core.extractOpenAITextDelta({
      type: "response.output_text.delta",
      delta: "hello",
    }),
    "hello",
  );

  const adapter = new core.OpenAIResponsesAdapter({
    fetch: async () => {
      throw new Error("fetch should not run without an API key");
    },
    getApiKey: () => undefined,
  });
  const events = [];

  for await (const event of adapter.streamTurn({
    threadId: "thread-2",
    messages: [],
    prompt: "Call OpenAI",
  })) {
    events.push(event);
  }

  assert.equal(events.length, 1);
  assert.equal(events[0].type, "error");
  assert.equal(events[0].severity, "auth");
});

test("local persistence stores provider selection and thread messages", async () => {
  const eclipse = await loadEclipse();
  const storage = new eclipse.MemoryKeyValueStorage();
  const settings = new eclipse.EclipseHarnessSettingsStore(storage);
  settings.setSelectedProviderId("offline-mock");

  const threads = new eclipse.EclipseLocalThreadStore(storage, {
    now: () => "2026-07-14T12:00:00.000Z",
    id: (prefix) => `${prefix}-fixed`,
  });
  const thread = threads.createThread({
    providerId: settings.getSelectedProviderId(),
    titleSeed: "Build portfolio harness",
  });
  threads.appendMessage(thread.id, {
    threadId: thread.id,
    role: "user",
    content: "Hello harness",
    providerId: "offline-mock",
  });

  const reloaded = new eclipse.EclipseLocalThreadStore(storage);
  assert.equal(reloaded.listThreads().length, 1);
  assert.equal(reloaded.listThreads()[0].messages[0].content, "Hello harness");
  assert.equal(settings.getSelectedProviderId(), "offline-mock");

  const defaultIdStore = new eclipse.EclipseLocalThreadStore(
    new eclipse.MemoryKeyValueStorage(),
  );
  assert.match(
    defaultIdStore.createThread({ providerId: "offline-mock" }).id,
    /^thread-/,
  );
});

test("offline conversation path persists user and assistant messages", async () => {
  const core = await loadCore();
  const eclipse = await loadEclipse();
  const storage = new eclipse.MemoryKeyValueStorage();
  const store = new eclipse.EclipseLocalThreadStore(storage, {
    now: () => "2026-07-14T12:00:00.000Z",
    id: (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`,
  });
  const adapter = new core.OfflineAgentAdapter({ delayMs: 0 });
  const thread = store.createThread({
    providerId: adapter.descriptor.id,
    titleSeed: "Persist a streamed turn",
  });
  store.appendMessage(thread.id, {
    threadId: thread.id,
    role: "user",
    content: "Persist a streamed turn",
    providerId: adapter.descriptor.id,
  });

  let assistantText = "";
  for await (const event of adapter.streamTurn({
    threadId: thread.id,
    messages: thread.messages,
    prompt: "Persist a streamed turn",
  })) {
    if (event.type === "message.delta") {
      assistantText += event.text;
    }
  }
  store.appendMessage(thread.id, {
    threadId: thread.id,
    role: "assistant",
    content: assistantText,
    providerId: adapter.descriptor.id,
  });

  const messages = store.listThreads()[0].messages;
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "user");
  assert.equal(messages[1].role, "assistant");
  assert.match(messages[1].content, /Offline harness path is live/);
});
