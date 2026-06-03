param(
  [switch]$Lite,
  [switch]$IncludeMySql,
  [switch]$NoNodeModules
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir '..')
$rootPath = $root.Path.TrimEnd('\')
$releaseRoot = Join-Path $rootPath '_release'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

if ($Lite) {
  $NoNodeModules = $true
  $IncludeMySql = $false
}

$includeNodeModules = -not $NoNodeModules
$flavor = if ($Lite) { 'Lite' } elseif ($IncludeMySql) { 'Full' } else { 'RDP' }
$packageName = "KUNEKU-$flavor-$stamp"
$stage = Join-Path $releaseRoot $packageName
$zipPath = Join-Path $releaseRoot "$packageName.zip"

function Write-Step($message) {
  Write-Host "[KUNEKU] $message"
}

function Test-IncludeFile($relativePath) {
  $rel = $relativePath.Replace('\', '/')

  if ($rel -like '_release/*') { return $false }
  if ($rel -like 'logs/*') { return $false }
  if ($rel -like 'reports/*') { return $false }
  if ($rel -like 'forms-gpt-agent/reports/*') { return $false }
  if ($rel -eq 'forms-gpt-agent/config.json') { return $false }
  if ($rel -like '*.zip') { return $false }

  if (-not $includeNodeModules -and $rel -like 'forms-gpt-agent/node_modules/*') { return $false }

  if (-not $IncludeMySql -and $rel -like 'control-panel/mysql-9.7.0-winx64/*') { return $false }
  if ($IncludeMySql) {
    if ($rel -like 'control-panel/mysql-9.7.0-winx64/data/*') { return $false }
    if ($rel -eq 'control-panel/mysql-9.7.0-winx64/kuneku-my.ini') { return $false }
  }

  return $true
}

Write-Step "Menyiapkan build dashboard..."
Push-Location (Join-Path $rootPath 'forms-gpt-agent')
try {
  if (-not (Test-Path 'node_modules')) {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
      throw 'node_modules belum ada dan npm tidak tersedia. Install Node.js LTS dulu.'
    }
    if (Test-Path 'package-lock.json') {
      npm ci
    } else {
      npm install
    }
  }

  if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm run build
  } elseif (-not (Test-Path 'dist/index.html')) {
    throw 'dist belum ada dan npm tidak tersedia untuk build.'
  }
}
finally {
  Pop-Location
}

Write-Step "Membuat staging folder: $stage"
if (Test-Path $stage) {
  Remove-Item -LiteralPath $stage -Recurse -Force
}
New-Item -ItemType Directory -Path $stage | Out-Null

$files = Get-ChildItem -LiteralPath $rootPath -Recurse -Force -File | Where-Object {
  $relative = $_.FullName.Substring($rootPath.Length + 1)
  Test-IncludeFile $relative
}

$count = 0
foreach ($file in $files) {
  $relative = $file.FullName.Substring($rootPath.Length + 1)
  $target = Join-Path $stage $relative
  $targetDir = Split-Path -Parent $target
  if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
  }
  Copy-Item -LiteralPath $file.FullName -Destination $target -Force
  $count++
}

New-Item -ItemType Directory -Path (Join-Path $stage 'logs') -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage 'forms-gpt-agent/reports/screenshots') -Force | Out-Null

$rdpConfig = Join-Path $stage 'forms-gpt-agent/config.rdp.json'
$targetConfig = Join-Path $stage 'forms-gpt-agent/config.json'
if (Test-Path $rdpConfig) {
  Copy-Item -LiteralPath $rdpConfig -Destination $targetConfig -Force
}

Write-Step "File staging: $count file."
Write-Step "Membuat zip: $zipPath"
if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zipPath -CompressionLevel Optimal -Force

$sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Step "Selesai: $zipPath ($sizeMb MB)"
Write-Step "Upload zip ini ke RDP, extract, lalu jalankan START-DI-RDP.bat."
