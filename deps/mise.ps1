<#
.SYNOPSIS
deps/mise.ps1: check for mise and install it on Windows (the deps/ contract, deps/README.md).
Installs with winget (package jdx.mise). Opinionated: winget only.

.DESCRIPTION
If mise is already installed anywhere (on PATH, through winget, Scoop or Chocolatey, or in
~\.local\bin), it lists what it found and stops. In an interactive session it asks before
installing another copy; otherwise it never does, unless -Yes is given.

.PARAMETER Check
Only report the copies found (exit 0 if any, 1 if none); install nothing.

.PARAMETER Yes
Install even if a copy exists, without asking.

.PARAMETER Activate
Add mise's activation line to the PowerShell 7 (pwsh) profile if it isn't there.

.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File deps\mise.ps1 -Activate
#>
param([switch]$Check, [switch]$Yes, [switch]$Activate)
$ErrorActionPreference = 'Stop'

function Find-Mise {
  $found = New-Object System.Collections.Generic.List[string]
  foreach ($c in @(Get-Command mise -All -ErrorAction SilentlyContinue)) {
    if ($c.Source -and -not $found.Contains($c.Source)) { $found.Add($c.Source) }
  }
  $candidates = @(
    "$env:USERPROFILE\.local\bin\mise.exe",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links\mise.exe",
    "$env:USERPROFILE\scoop\shims\mise.exe",
    "$env:ProgramData\chocolatey\bin\mise.exe",
    "$env:LOCALAPPDATA\mise\bin\mise.exe"
  )
  foreach ($p in $candidates) { if ((Test-Path $p) -and -not $found.Contains($p)) { $found.Add($p) } }
  return ,$found
}

function Test-WingetHasMise {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { return $false }
  winget list --id jdx.mise --exact --accept-source-agreements *> $null
  return ($LASTEXITCODE -eq 0)
}

function Test-Interactive {
  return ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected -and $Host.Name -eq 'ConsoleHost')
}

function Update-SessionPath {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

function Add-Activation {
  if (-not $Activate) { return }
  if ($PSVersionTable.PSEdition -ne 'Core') {
    Write-Host "deps/mise: activation is for PowerShell 7 (pwsh); rerun this script under pwsh with -Activate."
    return
  }
  $line = '(&mise activate pwsh) | Out-String | Invoke-Expression'
  if ((Test-Path $PROFILE) -and (Select-String -Path $PROFILE -SimpleMatch 'mise activate' -Quiet)) {
    Write-Host "deps/mise: $PROFILE already activates mise; left alone."
    return
  }
  New-Item -ItemType Directory -Force -Path (Split-Path $PROFILE) | Out-Null
  Add-Content -Path $PROFILE -Value "`n# mise (added by gnomatix-oss-skills deps/mise.ps1)`n$line"
  Write-Host "deps/mise: added mise activation to $PROFILE (takes effect in a new session)."
}

$found = Find-Mise
$viaWinget = Test-WingetHasMise
if ($found.Count -gt 0 -or $viaWinget) {
  Write-Host "deps/mise: mise is already installed:"
  foreach ($p in $found) {
    $v = try { (& $p --version 2>$null | Select-Object -First 1) } catch { '?' }
    Write-Host "  $p  ($v)"
  }
  if ($viaWinget) { Write-Host "  winget package jdx.mise" }
  if ($Check) { exit 0 }
  if (-not $Yes) {
    $answer = if (Test-Interactive) { Read-Host 'Install another copy with winget anyway? [y/N]' } else { '' }
    if ($answer -notmatch '^(y|yes)$') {
      Write-Host "deps/mise: nothing installed."
      Add-Activation
      exit 0
    }
  }
} elseif ($Check) {
  Write-Host "deps/mise: no mise found."
  exit 1
}

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  throw "deps/mise: winget not found. Install 'App Installer' from the Microsoft Store (it provides winget), then rerun."
}

for ($n = 1; $n -le 3; $n++) {
  winget install --id jdx.mise --exact --source winget --silent --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -eq 0) { break }
  if ($n -eq 3) { throw "deps/mise: 'winget install jdx.mise' failed 3 times (exit $LASTEXITCODE)." }
  Write-Host "deps/mise: retrying ($($n + 1) of 3) ..."
  Start-Sleep -Seconds (5 * $n)
}

Update-SessionPath
$m = Get-Command mise -ErrorAction SilentlyContinue
if (-not $m) { throw "deps/mise: winget installed jdx.mise, but mise isn't on PATH in this session; open a new terminal and run 'mise --version'." }
& $m.Source --version
Add-Activation
Write-Host "deps/mise: done. Check it with: mise doctor"
