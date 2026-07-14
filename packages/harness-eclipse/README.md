# Harness Eclipse OS

Fixture adapter for the Eclipse OS harness contract.

The fixture adapter is deterministic and does not connect to a live backend or spawn local processes. The package also exports the local thread and provider-settings stores used by the desktop shell.

Fixture coverage:

- run and attempt lifecycle;
- process start/exit;
- loopback endpoint and health metadata;
- message and reasoning deltas;
- tool start/output/finish;
- approval request/response;
- redacted remote-path artifact metadata;
- terminal/system output.
