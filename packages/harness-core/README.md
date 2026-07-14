# Harness Core

Shared harness contracts for future browser, terminal, OpenClaw, Eclipse OS backend, chat, editor, and preview integrations.

This package owns the neutral event vocabulary between runtime adapters and Eclipse OS UI surfaces.

Current contract areas:

- harness identity, status, and capabilities;
- run, attempt, process, endpoint, tool, approval, artifact, message, and workspace IDs;
- local process descriptors and service endpoint health metadata;
- approval policy and sandbox-mode metadata;
- typed `HarnessEvent` stream;
- `HarnessAdapter` lifecycle, input, stop, send, and stream contract.

G13G applied the first real contract from `docs/eclipse-backend/G13F_HARNESS_CONTRACT_REVISION.md`.
