#Requires -Version 5.1
<#
.SYNOPSIS
    JF Solutions Agent Hub — Setup Script
.DESCRIPTION
    Downloads the project source from Google Drive, reassembles the archive,
    extracts it, configures the environment, installs dependencies and sets up
    the database automatically.
.PARAMETER InstallPath
    Target directory. Default: .\jf-solutions-agent-hub
.PARAMETER ConfigFile
    Path to an existing .env.local to copy instead of being prompted.
.PARAMETER SkipDownload
    Skip download (assumes zip already at $TempDir\jf-solutions-source.zip).
.PARAMETER AutoStart
    Automatically start pnpm dev after setup completes.
.EXAMPLE
    .\setup.ps1
.EXAMPLE
    .\setup.ps1 -ConfigFile C:\secrets\jf.env -AutoStart
#>
param(
    [string]$InstallPath = ".\jf-solutions-agent-hub",
    [string]$ConfigFile  = "",
    [switch]$SkipDownload,
    [switch]$AutoStart
)

$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"   # makes Invoke-WebRequest much faster

# ── Google Drive file IDs (base64 chunks of the source zip) ──────────────────
$Parts = @(
    [pscustomobject]@{ Id = "1AE5w2nD7xjZfGTNzjbwG9-hGxK3MTYqV"; Name = "part1.txt" }
    [pscustomobject]@{ Id = "12Gdbb_1NIGZJgrimDoDWC4cPz6hEm2BS"; Name = "part2.txt" }
    [pscustomobject]@{ Id = "1Pd5_ys7Pgr1xjHqtSCU8kxS0MEgYdS7h"; Name = "part3.txt" }
    [pscustomobject]@{ Id = "1Waf7dovxuFrLlvFWTBuq0ec9wDnKYUWd"; Name = "part4.txt" }
    [pscustomobject]@{ Id = "1ehmjm0aDl56QS3lZDaD57akt5ywszlp2"; Name = "part5.txt" }
    [pscustomobject]@{ Id = "1o6jJ1c2vuSTIP3WhIsCrxDrhiIj5V5Cj"; Name = "part6.txt" }
)

$TempDir = Join-Path $env:TEMP "jf-solutions-setup"
$ZipPath = Join-Path $TempDir "jf-solutions-source.zip"

# ── Helpers ───────────────────────────────────────────────────────────────────
function Write-Header {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║     JF Solutions Agent Hub  —  Setup Script     ║" -ForegroundColor Magenta
    Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
}

function Write-Step  { param([string]$Msg) Write-Host "`n► $Msg" -ForegroundColor Cyan }
function Write-OK    { param([string]$Msg) Write-Host "  ✓ $Msg" -ForegroundColor Green }
function Write-Warn  { param([string]$Msg) Write-Host "  ⚠ $Msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$Msg) Write-Host "`n✗ $Msg`n" -ForegroundColor Red; exit 1 }

function Require-Command {
    param([string]$Cmd, [string]$Hint)
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        Write-Fail "$Cmd is not installed. $Hint"
    }
}

function Get-DriveFile {
    param([string]$FileId, [string]$OutPath)
    $url = "https://drive.google.com/uc?export=download&id=$FileId"
    try {
        Invoke-WebRequest -Uri $url -OutFile $OutPath -UseBasicParsing
    } catch {
        Write-Fail "Download failed for Drive file $FileId`n$_"
    }
}

function New-RandomSecret {
    $chars = ([char[]]('A'..'Z') + [char[]]('a'..'z') + [char[]]('0'..'9'))
    -join (1..32 | ForEach-Object { $chars | Get-Random })
}

# ─────────────────────────────────────────────────────────────────────────────
Write-Header

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
Write-Step "Checking prerequisites"

Require-Command "node" "Install Node.js v20+ from https://nodejs.org"
Require-Command "git"  "Install Git from https://git-scm.com"

$nodeVer   = (node --version) -replace 'v',''
$nodeMajor = [int]($nodeVer.Split('.')[0])
if ($nodeMajor -lt 18) { Write-Fail "Node.js 18+ required (found $nodeVer)" }
Write-OK "Node.js v$nodeVer"

if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Step "Installing pnpm"
    npm install -g pnpm | Out-Null
    Write-OK "pnpm installed"
} else {
    Write-OK "pnpm $(pnpm --version)"
}

# ── 2. Download from Google Drive ─────────────────────────────────────────────
if (-not $SkipDownload) {
    Write-Step "Downloading project parts from Google Drive (6 files)"
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

    $i = 1
    foreach ($part in $Parts) {
        $dest = Join-Path $TempDir $part.Name
        Write-Host "  Downloading part $i/6..." -NoNewline
        Get-DriveFile -FileId $part.Id -OutPath $dest
        Write-Host " done" -ForegroundColor Green
        $i++
    }
} else {
    Write-Warn "Skipping download (-SkipDownload)"
    if (-not (Test-Path $ZipPath)) { Write-Fail "Expected zip not found at $ZipPath" }
}

# ── 3. Reassemble base64 chunks → zip ────────────────────────────────────────
Write-Step "Reassembling archive from base64 parts"

$b64 = ""
foreach ($part in $Parts) {
    $path = Join-Path $TempDir $part.Name
    $b64 += (Get-Content -Raw -Path $path)
}
# Strip all whitespace (line breaks, spaces) before decoding
$b64 = $b64 -replace '\s',''

try {
    $bytes = [Convert]::FromBase64String($b64)
    [System.IO.File]::WriteAllBytes($ZipPath, $bytes)
    Write-OK ("Archive rebuilt — {0:N0} KB" -f ($bytes.Length / 1KB))
} catch {
    Write-Fail "Base64 decode failed: $_"
}

# ── 4. Extract ────────────────────────────────────────────────────────────────
Write-Step "Extracting project"

$absPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($InstallPath)

if (Test-Path $absPath) {
    $answer = Read-Host "  '$absPath' already exists. Overwrite? [y/N]"
    if ($answer -ne 'y') { Write-Host "Aborted."; exit 0 }
    Remove-Item -Recurse -Force $absPath
}

# Extract to a staging dir first, then move to final path
$stagingDir = Join-Path $TempDir "extract"
if (Test-Path $stagingDir) { Remove-Item -Recurse -Force $stagingDir }
Expand-Archive -Path $ZipPath -DestinationPath $stagingDir

# The zip may contain a single root folder; unwrap it automatically
$children = Get-ChildItem $stagingDir
if ($children.Count -eq 1 -and $children[0].PSIsContainer) {
    Move-Item $children[0].FullName $absPath
} else {
    Move-Item $stagingDir $absPath
}

Write-OK "Extracted to $absPath"

# ── 5. Configure .env.local ───────────────────────────────────────────────────
Write-Step "Configuring environment"

$envDest = Join-Path $absPath ".env.local"

if ($ConfigFile -and (Test-Path $ConfigFile)) {
    Copy-Item $ConfigFile $envDest -Force
    Write-OK "Copied .env.local from $ConfigFile"

} elseif (Test-Path $envDest) {
    Write-OK ".env.local already present — skipping"

} else {
    Write-Host ""
    Write-Host "  Enter your credentials (leave blank to skip and edit manually later):" -ForegroundColor White
    Write-Host ""

    $dbUrl     = Read-Host "  DATABASE_URL       (PostgreSQL)"
    $supUrl    = Read-Host "  SUPABASE_URL"
    $supAnon   = Read-Host "  SUPABASE_ANON_KEY"
    $supSvc    = Read-Host "  SUPABASE_SERVICE_KEY"
    $claudeKey = Read-Host "  CLAUDE_API_KEY"
    $appUrl    = "http://localhost:3000"
    $secret    = New-RandomSecret

    @"
DATABASE_URL="$dbUrl"
SUPABASE_URL="$supUrl"
SUPABASE_ANON_KEY="$supAnon"
SUPABASE_SERVICE_KEY="$supSvc"
CLAUDE_API_KEY="$claudeKey"
NEXTAUTH_SECRET="$secret"
NEXTAUTH_URL="$appUrl"
NEXTAUTH_CALLBACK_URL="$appUrl"
"@ | Set-Content -Path $envDest -Encoding UTF8

    Write-OK ".env.local created"
}

# ── 6. Install dependencies ───────────────────────────────────────────────────
Write-Step "Installing dependencies"
Push-Location $absPath
try {
    pnpm install
    Write-OK "Dependencies installed"
} catch {
    Write-Fail "pnpm install failed: $_"
} finally {
    Pop-Location
}

# ── 7. Prisma ─────────────────────────────────────────────────────────────────
Write-Step "Setting up database"
Push-Location $absPath
try {
    pnpm exec prisma generate
    Write-OK "Prisma client generated"

    try {
        pnpm exec prisma migrate deploy
        Write-OK "Migrations deployed"
    } catch {
        Write-Warn "migrate deploy failed, falling back to db push"
        pnpm exec prisma db push --accept-data-loss
        Write-OK "Schema pushed"
    }
} catch {
    Write-Warn "Database setup failed: $_"
    Write-Warn "Run manually: cd `"$absPath`" ; pnpm exec prisma db push"
} finally {
    Pop-Location
}

# ── 8. Done ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║               Setup complete!                   ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Project path : $absPath" -ForegroundColor White
Write-Host "  Start server : cd `"$absPath`" ; pnpm dev" -ForegroundColor Yellow
Write-Host "  App URL      : http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

if ($AutoStart) {
    Push-Location $absPath
    pnpm dev
} else {
    $launch = Read-Host "Start development server now? [y/N]"
    if ($launch -eq 'y') {
        Push-Location $absPath
        pnpm dev
    }
}
