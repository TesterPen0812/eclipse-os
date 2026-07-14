import type {
  HarnessAdapter,
  HarnessCapability,
  HarnessEvent,
  HarnessRunId,
  HarnessStartInput,
  HarnessStartResult,
  HarnessStatus,
  HarnessStopInput,
  HarnessStreamInput,
} from "@eclipse-os/harness-core";

export const harnessEclipseOSStatus = "fixture-adapter-ready";

export const eclipseFixtureRunId = "run-eclipse-fixture-001" as const;
export const eclipseFixtureAttemptId = "attempt-eclipse-fixture-001" as const;
export const eclipseFixtureProcessId = "process-eclipse-fixture-001" as const;
export const eclipseFixtureEndpointId = "endpoint-eclipse-fixture-001" as const;
export const eclipseFixtureToolCallId = "tool-eclipse-fixture-001" as const;
export const eclipseFixtureApprovalId = "approval-eclipse-fixture-001" as const;

const FIXTURE_TIMESTAMP = "2026-06-21T00:00:00.000Z";

const fixtureCapabilities: HarnessCapability[] = [
  {
    id: "fixture.run",
    label: "Run fixture",
    kind: "run",
    enabled: true,
    description: "Emit the deterministic Eclipse OS harness fixture stream.",
  },
  {
    id: "fixture.approval",
    label: "Approval fixture",
    kind: "approval",
    enabled: true,
    description: "Exercise approval request and response events without real execution.",
  },
  {
    id: "fixture.artifact",
    label: "Artifact fixture",
    kind: "artifact",
    enabled: true,
    description: "Emit a redacted remote-path artifact metadata event.",
  },
];

export function createEclipseFixtureEvents(
  input: HarnessStartInput = {},
): HarnessEvent[] {
  const workspace = input.workspace ?? {
    rootPath: "/workspace/eclipse-os",
    branch: "main",
    dirty: false,
    trust: "trusted",
  };

  return [
    {
      type: "run.created",
      id: "event-001",
      runId: eclipseFixtureRunId,
      status: "queued",
      workspace,
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "run.started",
      id: "event-002",
      runId: eclipseFixtureRunId,
      status: "running",
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "attempt.started",
      id: "event-003",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      status: "running",
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "process.started",
      id: "event-004",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      process: {
        id: eclipseFixtureProcessId,
        label: "Fixture runtime",
        status: "running",
        commandLabel: "eclipse-fixture-runtime",
        cwd: workspace.rootPath,
        approvalPolicy: "manual",
        sandboxMode: "workspace-write",
        model: "fixture-model",
        baseUrl: "http://127.0.0.1:0",
        dataDir: ".eclipse-os/fixture",
      },
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "service.endpoint",
      id: "event-005",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      endpoint: {
        id: eclipseFixtureEndpointId,
        processId: eclipseFixtureProcessId,
        url: "http://127.0.0.1:0/fixture",
        protocol: "http",
        health: "healthy",
        contentType: "application/json",
        lastCheckedAt: FIXTURE_TIMESTAMP,
      },
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "health.changed",
      id: "event-006",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      endpointId: eclipseFixtureEndpointId,
      status: "healthy",
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "message.delta",
      id: "event-007",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      messageId: "message-eclipse-fixture-001",
      role: "assistant",
      text: "Preparing Eclipse OS fixture run.",
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "reasoning.delta",
      id: "event-008",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      messageId: "message-eclipse-fixture-001",
      text: "Map runtime evidence into a neutral harness event stream.",
      visibility: "collapsed",
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "tool.started",
      id: "event-009",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      toolCallId: eclipseFixtureToolCallId,
      tool: "runtime_probe",
      input: { target: "fixture" },
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "tool.output",
      id: "event-010",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      toolCallId: eclipseFixtureToolCallId,
      stream: "stdout",
      chunk: "health=healthy content-type=application/json",
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "tool.finished",
      id: "event-011",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      toolCallId: eclipseFixtureToolCallId,
      tool: "runtime_probe",
      output: { status: "healthy" },
      exitCode: 0,
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "approval.requested",
      id: "event-012",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      approvalId: eclipseFixtureApprovalId,
      label: "Allow fixture artifact registration",
      payload: { artifactKind: "remote-path" },
      expiresAt: "2026-06-21T00:05:00.000Z",
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "approval.responded",
      id: "event-013",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      approvalId: eclipseFixtureApprovalId,
      decision: "approved",
      payload: { source: "fixture" },
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "artifact.created",
      id: "event-014",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      artifact: {
        id: "artifact-eclipse-fixture-001",
        kind: "remote-path",
        label: "Fixture evidence folder",
        remotePath: "mybox-pro:~/MyBoxRemote/g13-reference-evidence/2026-06-21/",
        redacted: true,
      },
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "terminal.output",
      id: "event-015",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      processId: eclipseFixtureProcessId,
      stream: "system",
      chunk: "fixture runtime complete",
      level: "info",
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "attempt.finished",
      id: "event-016",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      status: "completed",
      exitCode: 0,
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "run.finished",
      id: "event-017",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      status: "completed",
      exitCode: 0,
      timestamp: FIXTURE_TIMESTAMP,
    },
    {
      type: "process.exited",
      id: "event-018",
      runId: eclipseFixtureRunId,
      attemptId: eclipseFixtureAttemptId,
      processId: eclipseFixtureProcessId,
      exitCode: 0,
      timestamp: FIXTURE_TIMESTAMP,
    },
  ];
}

export class EclipseFixtureHarnessAdapter implements HarnessAdapter {
  readonly id = "eclipse-fixture";
  readonly kind = "eclipse-os";
  readonly label = "Eclipse OS Fixture";

  #status: HarnessStatus = "idle";
  #events: HarnessEvent[] = createEclipseFixtureEvents();
  #lastRunId: HarnessRunId | undefined;
  #lastInput: unknown;

  async getCapabilities(): Promise<HarnessCapability[]> {
    return fixtureCapabilities;
  }

  async getStatus(): Promise<HarnessStatus> {
    return this.#status;
  }

  async start(input: HarnessStartInput = {}): Promise<HarnessStartResult> {
    this.#status = "running";
    this.#events = createEclipseFixtureEvents(input);
    this.#lastRunId = eclipseFixtureRunId;
    return { runId: eclipseFixtureRunId };
  }

  async stop(_input: HarnessStopInput = {}): Promise<void> {
    this.#status = "stopped";
  }

  async send(input: unknown): Promise<void> {
    this.#lastInput = input;
  }

  async *stream(input: HarnessStreamInput = {}): AsyncIterable<HarnessEvent> {
    const shouldReplay = input.replay ?? true;
    const runId = input.runId ?? this.#lastRunId ?? eclipseFixtureRunId;

    if (!shouldReplay) return;

    for (const event of this.#events) {
      if (!event.runId || event.runId === runId) {
        yield event;
      }
    }
  }

  getLastInput(): unknown {
    return this.#lastInput;
  }
}

export function createEclipseFixtureHarnessAdapter(): HarnessAdapter {
  return new EclipseFixtureHarnessAdapter();
}

export {
  ECLIPSE_SETTINGS_STORAGE_KEY,
  ECLIPSE_THREADS_STORAGE_KEY,
  EclipseHarnessSettingsStore,
  EclipseLocalThreadStore,
  MemoryKeyValueStorage,
  readHarnessSettings,
  readThreadSnapshot,
} from "./localThreads";

export type {
  EclipseHarnessSettings,
  EclipseThread,
  EclipseThreadSnapshot,
  KeyValueStorage,
} from "./localThreads";
