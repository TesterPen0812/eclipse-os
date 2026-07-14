export type HarnessKind =
  | "browser"
  | "terminal"
  | "openclaw"
  | "eclipse-os"
  | "chat"
  | "editor"
  | "preview";

export type HarnessId = string;
export type HarnessRunId = string;
export type HarnessAttemptId = string;
export type HarnessStepId = string;
export type HarnessProcessId = string;
export type HarnessEndpointId = string;
export type HarnessToolCallId = string;
export type HarnessApprovalId = string;
export type HarnessArtifactId = string;
export type HarnessMessageId = string;

export type HarnessStatus =
  | "idle"
  | "starting"
  | "running"
  | "waiting-for-approval"
  | "degraded"
  | "stopping"
  | "error"
  | "stopped";

export type HarnessRunStatus =
  | "queued"
  | "starting"
  | "running"
  | "waiting-for-approval"
  | "paused"
  | "cancelling"
  | "cancelled"
  | "completed"
  | "failed";

export type HarnessProcessStatus =
  | "pending"
  | "spawning"
  | "running"
  | "unhealthy"
  | "exiting"
  | "exited"
  | "failed";

export type HarnessLogLevel = "debug" | "info" | "warn" | "error";
export type HarnessOutputStream = "stdout" | "stderr" | "system";
export type HarnessApprovalPolicy = "manual" | "auto" | "never" | "unknown";
export type HarnessSandboxMode =
  | "read-only"
  | "workspace-write"
  | "unrestricted"
  | "unknown";

export interface HarnessWorkspaceContext {
  rootPath?: string;
  branch?: string;
  dirty?: boolean;
  trust?: "trusted" | "untrusted" | "unknown";
  selectedFiles?: string[];
}

export interface HarnessCapability {
  id: string;
  label: string;
  kind:
    | "run"
    | "tool"
    | "approval"
    | "artifact"
    | "terminal"
    | "browser"
    | "workspace";
  enabled: boolean;
  description?: string;
}

export interface HarnessProcessDescriptor {
  id: HarnessProcessId;
  label: string;
  status: HarnessProcessStatus;
  pid?: number;
  commandLabel?: string;
  cwd?: string;
  approvalPolicy?: HarnessApprovalPolicy;
  sandboxMode?: HarnessSandboxMode;
  model?: string;
  baseUrl?: string;
  dataDir?: string;
}

export interface HarnessServiceEndpoint {
  id: HarnessEndpointId;
  processId?: HarnessProcessId;
  url?: string;
  protocol: "http" | "sse" | "websocket" | "stdio" | "ipc" | "unknown";
  health: "unknown" | "checking" | "healthy" | "unhealthy" | "stopped";
  contentType?: string;
  lastCheckedAt?: string;
}

export interface HarnessArtifactMetadata {
  id: HarnessArtifactId;
  kind:
    | "file"
    | "screenshot"
    | "log"
    | "diff"
    | "preview"
    | "recording"
    | "remote-path"
    | "other";
  label?: string;
  path?: string;
  url?: string;
  remotePath?: string;
  contentType?: string;
  redacted?: boolean;
}

export interface HarnessEventBase {
  id?: string;
  runId?: HarnessRunId;
  attemptId?: HarnessAttemptId;
  stepId?: HarnessStepId;
  timestamp?: string;
}

export type HarnessEvent =
  | (HarnessEventBase & { type: "status.changed"; status: HarnessStatus })
  | (HarnessEventBase & {
      type: "run.created";
      status: HarnessRunStatus;
      workspace?: HarnessWorkspaceContext;
    })
  | (HarnessEventBase & { type: "run.started"; status: HarnessRunStatus })
  | (HarnessEventBase & { type: "attempt.started"; status: HarnessRunStatus })
  | (HarnessEventBase & {
      type: "attempt.finished";
      status: HarnessRunStatus;
      exitCode?: number;
    })
  | (HarnessEventBase & {
      type: "run.finished";
      status: HarnessRunStatus;
      exitCode?: number;
    })
  | (HarnessEventBase & {
      type: "process.started";
      process: HarnessProcessDescriptor;
    })
  | (HarnessEventBase & {
      type: "process.exited";
      processId: HarnessProcessId;
      exitCode?: number;
      signal?: string;
    })
  | (HarnessEventBase & {
      type: "service.endpoint";
      endpoint: HarnessServiceEndpoint;
    })
  | (HarnessEventBase & {
      type: "health.changed";
      endpointId?: HarnessEndpointId;
      status: HarnessServiceEndpoint["health"];
    })
  | (HarnessEventBase & {
      type: "message.delta";
      messageId?: HarnessMessageId;
      role?: "user" | "assistant" | "system" | "tool";
      text: string;
    })
  | (HarnessEventBase & {
      type: "reasoning.delta";
      messageId?: HarnessMessageId;
      text: string;
      visibility?: "collapsed" | "expanded" | "hidden";
    })
  | (HarnessEventBase & {
      type: "tool.started";
      toolCallId: HarnessToolCallId;
      tool: string;
      input?: unknown;
    })
  | (HarnessEventBase & {
      type: "tool.progress";
      toolCallId: HarnessToolCallId;
      label?: string;
      output?: unknown;
    })
  | (HarnessEventBase & {
      type: "tool.output";
      toolCallId: HarnessToolCallId;
      stream: HarnessOutputStream;
      chunk: string;
    })
  | (HarnessEventBase & {
      type: "tool.finished";
      toolCallId: HarnessToolCallId;
      tool: string;
      output?: unknown;
      exitCode?: number;
    })
  | (HarnessEventBase & {
      type: "approval.requested";
      approvalId: HarnessApprovalId;
      label: string;
      payload?: unknown;
      expiresAt?: string;
    })
  | (HarnessEventBase & {
      type: "approval.responded";
      approvalId: HarnessApprovalId;
      decision: "approved" | "denied" | "expired";
      payload?: unknown;
    })
  | (HarnessEventBase & {
      type: "artifact.created";
      artifact: HarnessArtifactMetadata;
    })
  | (HarnessEventBase & {
      type: "terminal.output";
      processId?: HarnessProcessId;
      stream: HarnessOutputStream;
      chunk: string;
      level?: HarnessLogLevel;
    })
  | (HarnessEventBase & {
      type: "browser.screenshot";
      artifact: HarnessArtifactMetadata;
    })
  | (HarnessEventBase & {
      type: "workspace.changed";
      workspace: HarnessWorkspaceContext;
    })
  | (HarnessEventBase & {
      type: "error";
      severity: "warning" | "recoverable" | "fatal" | "auth";
      message: string;
      details?: unknown;
    });

export interface HarnessStartInput {
  workspace?: HarnessWorkspaceContext;
  metadata?: Record<string, unknown>;
}

export interface HarnessStartResult {
  runId?: HarnessRunId;
}

export interface HarnessStopInput {
  runId?: HarnessRunId;
  reason?: string;
}

export interface HarnessStreamInput {
  runId?: HarnessRunId;
  replay?: boolean;
}

export interface HarnessAdapter {
  id: HarnessId;
  kind: HarnessKind;
  label: string;
  getCapabilities?(): Promise<HarnessCapability[]>;
  getStatus(): Promise<HarnessStatus>;
  start(input?: HarnessStartInput): Promise<HarnessStartResult | void>;
  stop(input?: HarnessStopInput): Promise<void>;
  send(input: unknown): Promise<void>;
  stream(input?: HarnessStreamInput): AsyncIterable<HarnessEvent>;
}
