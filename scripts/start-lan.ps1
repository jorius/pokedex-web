<#
.SYNOPSIS
    Starts the whole pokedex ecosystem bound to every network interface, so the app can be
    reviewed from a phone on the same LAN.

.DESCRIPTION
    Launches four servers, each in its own PowerShell window (close a window or press Ctrl+C
    in it to stop that service):

        .NET backend   http://<lan-ip>:5257   ../pokedex-api-dotnet
        Express (JS)   http://<lan-ip>:3000   ../pokedex-api-express-js
        Express (TS)   http://<lan-ip>:3001   ../pokedex-api-express-ts
        Vite frontend  http://<lan-ip>:5173   this repo

    Nothing here overrides host binding at the command line: LAN reachability is baked into
    the repos themselves (vite.config.ts `server.host`, launchSettings.json `applicationUrl`,
    and Node's default all-interfaces listen). The script only starts them together, in the
    right directories, and prints the URL to type into the phone.

    Per-service configuration (database URL, shared JWT secret, ports) still comes from each
    repo's own .env / user-secrets — see the sibling READMEs. The script verifies the Node
    repos have a .env and warns if one is missing rather than starting a service that will
    fail to boot.

.PARAMETER HostIp
    LAN address to advertise. Defaults to the first non-loopback, non-APIPA IPv4 address of
    an "Up" interface — normally correct on a single-NIC machine.

.PARAMETER SkipDotnet, SkipExpressJs, SkipExpressTs, SkipWeb
    Skip an individual service (e.g. one is already running).

.EXAMPLE
    .\scripts\start-lan.ps1

.EXAMPLE
    .\scripts\start-lan.ps1 -HostIp 192.168.0.254 -SkipExpressJs
#>

[CmdletBinding()]
param(
    [string]$HostIp,
    [switch]$SkipDotnet,
    [switch]$SkipExpressJs,
    [switch]$SkipExpressTs,
    [switch]$SkipWeb
)

$ErrorActionPreference = 'Stop'

$webRoot = Split-Path -Parent $PSScriptRoot
$siblings = Split-Path -Parent $webRoot

function Resolve-LanIp {
    $candidate = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -ne '127.0.0.1' -and
            $_.IPAddress -notlike '169.254.*' -and
            $_.AddressState -eq 'Preferred'
        } |
        Select-Object -First 1

    if ($null -eq $candidate) { return $null }
    return $candidate.IPAddress
}

function Start-Service([string]$Title, [string]$WorkingDirectory, [string]$Command) {
    if (-not (Test-Path $WorkingDirectory)) {
        Write-Warning "$Title - skipped, directory not found: $WorkingDirectory"
        return $false
    }

    # -NoExit keeps the window (and its logs) around after the server stops.
    Start-Process powershell -WorkingDirectory $WorkingDirectory -ArgumentList @(
        '-NoExit'
        '-Command'
        "`$Host.UI.RawUI.WindowTitle = '$Title'; $Command"
    ) | Out-Null

    Write-Host ("  started  {0}" -f $Title) -ForegroundColor Green
    return $true
}

function Test-EnvFile([string]$Directory, [string]$Title) {
    if (Test-Path (Join-Path $Directory '.env')) { return }
    Write-Warning "$Title has no .env - copy its .env.example first, or the service will not boot."
}

if (-not $HostIp) { $HostIp = Resolve-LanIp }
if (-not $HostIp) {
    throw 'Could not determine a LAN IPv4 address. Pass one explicitly: -HostIp 192.168.0.254'
}

Write-Host ''
Write-Host 'Starting the pokedex ecosystem on all interfaces...' -ForegroundColor Cyan
Write-Host ''

if (-not $SkipDotnet) {
    $dotnetRoot = Join-Path $siblings 'pokedex-api-dotnet'
    Start-Service '.NET API 5257' $dotnetRoot 'dotnet run --project src/PokedexApi.Api --launch-profile http' | Out-Null
}

if (-not $SkipExpressJs) {
    $jsRoot = Join-Path $siblings 'pokedex-api-express-js'
    if (Test-Path $jsRoot) { Test-EnvFile $jsRoot 'Express JS API' }
    Start-Service 'Express JS API 3000' $jsRoot 'npm run dev' | Out-Null
}

if (-not $SkipExpressTs) {
    $tsRoot = Join-Path $siblings 'pokedex-api-express-ts'
    if (Test-Path $tsRoot) { Test-EnvFile $tsRoot 'Express TS API' }
    Start-Service 'Express TS API 3001' $tsRoot 'npm run dev' | Out-Null
}

if (-not $SkipWeb) {
    Start-Service 'Vite web 5173' $webRoot 'npm run dev' | Out-Null
}

Write-Host ''
Write-Host '  Open this on the phone (same Wi-Fi network):' -ForegroundColor Cyan
Write-Host ("  http://{0}:5173" -f $HostIp) -ForegroundColor Yellow
Write-Host ''
Write-Host '  Backends (the app derives these from the host it was loaded from):'
Write-Host ("    .NET        http://{0}:5257" -f $HostIp)
Write-Host ("    Express JS  http://{0}:3000" -f $HostIp)
Write-Host ("    Express TS  http://{0}:3001" -f $HostIp)
Write-Host ''
Write-Host '  If the phone cannot connect, Windows Firewall is blocking the inbound ports.'
Write-Host '  See "Testing from a phone on your LAN" in README.md for the rule to add.'
Write-Host ''
