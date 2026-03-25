param(
  [ValidateSet("next", "all")]
  [string]$Mode = "next",

  [string]$Model,

  [switch]$AllowDirty,

  [switch]$DryRun,

  [switch]$DangerousBypass,

  [switch]$Search
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$AutomationRoot = Join-Path $RepoRoot "automation/ui-overhaul"
$StatePath = Join-Path $AutomationRoot "session-state.json"
$SchemaPath = Join-Path $AutomationRoot "session-result.schema.json"
$RunsPath = Join-Path $AutomationRoot "runs"
$MarkdownTrackerPath = Join-Path $RepoRoot "docs/ui-session-tracker.md"

function Assert-Prerequisites {
  if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
    throw "codex CLI was not found in PATH."
  }

  foreach ($path in @($StatePath, $SchemaPath)) {
    if (-not (Test-Path $path)) {
      throw "Required file not found: $path"
    }
  }

  if (-not (Test-Path $RunsPath)) {
    New-Item -ItemType Directory -Path $RunsPath | Out-Null
  }
}

function Read-State {
  return Get-Content -Path $StatePath -Raw | ConvertFrom-Json
}

function Write-State($state) {
  $state.updated_at = (Get-Date).ToUniversalTime().ToString("o")
  $json = $state | ConvertTo-Json -Depth 100
  [System.IO.File]::WriteAllText($StatePath, $json + [Environment]::NewLine)
}

function Write-MarkdownTracker($state) {
  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add("# UI Session Tracker")
  $lines.Add("")
  $lines.Add("Generated from automation/ui-overhaul/session-state.json.")
  $lines.Add("")
  $lines.Add("| Session | Name | Milestones | Status | Completed At |")
  $lines.Add("|---|---|---|---|---|")

  foreach ($session in $state.sessions) {
    $milestones = ($session.milestones -join ", ")
    $completedAt = [string]$session.completed_at
    $lines.Add("| $($session.id) | $($session.name) | $milestones | $($session.status) | $completedAt |")
  }

  $lines.Add("")
  $lines.Add("## Notes")
  $lines.Add("")

  foreach ($session in $state.sessions) {
    $lines.Add("### Session $($session.id)")
    if ([string]::IsNullOrWhiteSpace([string]$session.summary)) {
      $lines.Add("- Summary: ")
    } else {
      $lines.Add("- Summary: $($session.summary)")
    }

    $verification = $session.verification
    if ($verification) {
      $lines.Add("- Verification: eslint=$($verification.eslint), tsc=$($verification.tsc), tests=$($verification.tests)")
    }

    if ($session.blockers.Count -gt 0) {
      foreach ($blocker in $session.blockers) {
        $lines.Add("- Blocker: $blocker")
      }
    }

    if ($session.follow_ups.Count -gt 0) {
      foreach ($followUp in $session.follow_ups) {
        $lines.Add("- Follow-up: $followUp")
      }
    }

    if ($session.last_jsonl_path) {
      $lines.Add("- Log: $($session.last_jsonl_path)")
    }
    if ($session.last_result_path) {
      $lines.Add("- Result: $($session.last_result_path)")
    }

    $lines.Add("")
  }

  [System.IO.File]::WriteAllText($MarkdownTrackerPath, ($lines -join [Environment]::NewLine) + [Environment]::NewLine)
}

function Test-CleanWorktree {
  $status = git -C $RepoRoot status --porcelain
  return [string]::IsNullOrWhiteSpace(($status | Out-String))
}

function Get-RelativePath([string]$BasePath, [string]$TargetPath) {
  $baseFullPath = [System.IO.Path]::GetFullPath($BasePath)
  $targetFullPath = [System.IO.Path]::GetFullPath($TargetPath)

  if (-not $baseFullPath.EndsWith([System.IO.Path]::DirectorySeparatorChar.ToString())) {
    $baseFullPath += [System.IO.Path]::DirectorySeparatorChar
  }

  $baseUri = New-Object System.Uri($baseFullPath)
  $targetUri = New-Object System.Uri($targetFullPath)
  $relativeUri = $baseUri.MakeRelativeUri($targetUri)

  return [System.Uri]::UnescapeDataString($relativeUri.ToString()).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
}

function Get-NextSession($state) {
  return @($state.sessions | Where-Object { $_.status -ne "completed" } | Sort-Object id)[0]
}

function Get-CompletedSessionIds($state) {
  return @($state.sessions | Where-Object { $_.status -eq "completed" } | Sort-Object id | ForEach-Object { $_.id })
}

function New-SessionPrompt($state, $session) {
  $completedIds = Get-CompletedSessionIds $state
  $completedLabel = if ($completedIds.Count -gt 0) { ($completedIds -join ", ") } else { "none" }
  $milestones = $session.milestones -join ", "

  return @"
Complete exactly UI overhaul Session $($session.id): $($session.name).

Required reading:
- UI-OVERHAUL-PLAN.md
- automation/ui-overhaul/session-state.json
- docs/color-palette.md
- docs/brand-identity.md

Rules:
- Use UI-OVERHAUL-PLAN.md as the source of truth for scope and acceptance criteria.
- Use automation/ui-overhaul/session-state.json as the source of truth for current progress.
- Complete exactly Session $($session.id) and do not begin Session $([int]$session.id + 1).
- You may spawn sub-agents if that improves throughput, but keep file ownership disjoint.
- Preserve unrelated changes already present in the worktree.
- Do not modify automation/ui-overhaul/session-state.json or docs/ui-session-tracker.md. The runner updates those files after the session completes.
- Run verification commands as relevant: eslint, npx tsc --noEmit, and npm run test.
- If the session cannot be completed safely, stop and return outcome=blocked with explicit blockers.
- Your final response must match the provided JSON schema exactly.

Session metadata:
- Session id: $($session.id)
- Session name: $($session.name)
- Milestones: $milestones
- Already completed sessions: $completedLabel

Stop after this session.
"@
}

function Invoke-CodexSession($state, $session) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $jsonlPath = Join-Path $RunsPath ("session-{0}-{1}.jsonl" -f $session.id, $timestamp)
  $resultPath = Join-Path $RunsPath ("session-{0}-{1}-result.json" -f $session.id, $timestamp)
  $prompt = New-SessionPrompt $state $session

  $args = @(
    "exec",
    "--json",
    "--ephemeral",
    "--output-schema", $SchemaPath,
    "--output-last-message", $resultPath,
    "-C", $RepoRoot
  )

  if ($DangerousBypass) {
    $args += "--dangerously-bypass-approvals-and-sandbox"
  } else {
    $args += "--full-auto"
  }

  if ($Search) {
    $args += "--search"
  }

  if ($Model) {
    $args += @("-m", $Model)
  }

  $args += "-"

  Write-Host ""
  Write-Host ("==> Running Session {0}: {1}" -f $session.id, $session.name)
  Write-Host ("    Log: {0}" -f $jsonlPath)
  Write-Host ("    Result: {0}" -f $resultPath)
  Write-Host ""

  if ($DryRun) {
    Write-Host $prompt
    return [pscustomobject]@{
      Outcome = "dry_run"
      JsonlPath = $jsonlPath
      ResultPath = $resultPath
      ParsedResult = $null
    }
  }

  $null = $prompt | & codex @args 2>&1 | Tee-Object -FilePath $jsonlPath | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "codex exec failed with exit code $LASTEXITCODE"
  }

  if (-not (Test-Path $resultPath)) {
    throw "Codex did not write the final result file: $resultPath"
  }

  $parsed = Get-Content -Path $resultPath -Raw | ConvertFrom-Json
  return [pscustomobject]@{
    Outcome = "completed"
    JsonlPath = $jsonlPath
    ResultPath = $resultPath
    ParsedResult = $parsed
  }
}

function Update-SessionFromResult($state, $session, $runResult) {
  $result = $runResult.ParsedResult

  if ([int]$result.session_id -ne [int]$session.id) {
    throw "Result session_id $($result.session_id) did not match expected session $($session.id)"
  }

  $session.status = [string]$result.outcome
  $session.summary = [string]$result.summary
  $session.verification = $result.verification
  $session.changed_files = @($result.changed_files)
  $session.blockers = @($result.blockers)
  $session.follow_ups = @($result.follow_ups)
  $session.last_jsonl_path = Get-RelativePath -BasePath $RepoRoot -TargetPath $runResult.JsonlPath
  $session.last_result_path = Get-RelativePath -BasePath $RepoRoot -TargetPath $runResult.ResultPath

  if ($result.outcome -eq "completed") {
    $session.completed_at = (Get-Date).ToUniversalTime().ToString("o")
  } else {
    $session.completed_at = ""
  }
}

Assert-Prerequisites

if (-not $AllowDirty -and -not $DryRun -and -not (Test-CleanWorktree)) {
  throw "Worktree is not clean. Commit/stash changes first, or rerun with -AllowDirty."
}

$keepRunning = $true
while ($keepRunning) {
  $state = Read-State
  $session = Get-NextSession $state

  if (-not $session) {
    Write-Host "All sessions are already completed."
    break
  }

  if (-not $DryRun) {
    $session.status = "in_progress"
    Write-State $state
    Write-MarkdownTracker $state
  }

  try {
    $runResult = Invoke-CodexSession $state $session
    if ($runResult.Outcome -eq "dry_run") {
      break
    }

    $state = Read-State
    $session = @($state.sessions | Where-Object { $_.id -eq $session.id })[0]
    Update-SessionFromResult -state $state -session $session -runResult $runResult
    Write-State $state
    Write-MarkdownTracker $state
    Write-Host ("<== Session {0} finished with status '{1}'" -f $session.id, $session.status)

    if ($session.status -ne "completed") {
      Write-Warning ("Session {0} finished with status '{1}'. Stopping loop." -f $session.id, $session.status)
      break
    }
  } catch {
    if (-not $DryRun) {
      $state = Read-State
      $session = @($state.sessions | Where-Object { $_.id -eq $session.id })[0]
      $session.status = "failed"
      $session.summary = $_.Exception.Message
      $session.completed_at = ""
      Write-State $state
      Write-MarkdownTracker $state
    }
    throw
  }

  if ($Mode -eq "next") {
    $keepRunning = $false
  }
}
