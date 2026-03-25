# UI Session Workflow

This workflow uses a fresh `codex exec --ephemeral` run for each session. That gives you a clean context boundary between sessions while keeping progress in the repo and in `automation/ui-overhaul/session-state.json`.

## Files

- `UI-OVERHAUL-PLAN.md`
  Source of truth for scope and acceptance criteria.
- `automation/ui-overhaul/session-state.json`
  Machine-readable session tracker used by the runner.
- `automation/ui-overhaul/session-result.schema.json`
  Required shape for each session result.
- `docs/ui-session-tracker.md`
  Human-readable tracker generated from the JSON state.
- `scripts/run-ui-overhaul.ps1`
  Runs the next session or all remaining sessions with fresh Codex runs.

## Recommended Setup

1. Create a dedicated branch for the experiment.
2. Start from a clean worktree.
3. Run one session at a time first.
4. When you trust the loop, run all remaining sessions in one pass.
5. Do manual UI testing after Session 7, or at least after Sessions 3, 4, and 7.

## Commands

Run the next incomplete session:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-ui-overhaul.ps1 -Mode next
```

Run all remaining sessions in sequence:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-ui-overhaul.ps1 -Mode all
```

Preview the next prompt without running Codex:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-ui-overhaul.ps1 -Mode next -DryRun
```

Allow the runner to proceed on a dirty worktree:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-ui-overhaul.ps1 -Mode next -AllowDirty
```

Use the more aggressive execution mode only on a disposable branch or sandboxed machine:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-ui-overhaul.ps1 -Mode all -DangerousBypass
```

## How the Loop Works

For each session, the runner:

1. Reads `automation/ui-overhaul/session-state.json`.
2. Finds the next session whose status is not `completed`.
3. Launches `codex exec --ephemeral` so the session starts with fresh context.
4. Instructs Codex to complete exactly one session and stop.
5. Stores the JSONL event log in `automation/ui-overhaul/runs/`.
6. Parses the structured final result.
7. Updates the JSON tracker and regenerates `docs/ui-session-tracker.md`.
8. Moves to the next session if `-Mode all` is used.

## Quality-Test Recommendation

For a cleaner quality comparison, run two passes from the same starting commit:

- Pass A: `-Mode all` with the default runner settings.
- Pass B: `-Mode all` after resetting to the same starting commit, but tweak the prompt or model if you want to compare strategies.

Score each pass on:

- plan adherence
- number of regressions
- cleanup needed after each session
- consistency of the final UI
- quality of the final manual test after Session 7
