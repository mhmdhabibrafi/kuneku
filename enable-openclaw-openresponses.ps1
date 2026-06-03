$configPath = Join-Path $env:USERPROFILE '.openclaw\openclaw.json'

if (-not (Test-Path -LiteralPath $configPath)) {
  Write-Host "OpenClaw config belum ada. Login Codex OAuth dulu."
  exit 0
}

$config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json

if (-not $config.gateway) {
  $config | Add-Member -MemberType NoteProperty -Name gateway -Value ([pscustomobject]@{})
}
if (-not $config.gateway.http) {
  $config.gateway | Add-Member -MemberType NoteProperty -Name http -Value ([pscustomobject]@{})
}
if (-not $config.gateway.http.endpoints) {
  $config.gateway.http | Add-Member -MemberType NoteProperty -Name endpoints -Value ([pscustomobject]@{})
}
if (-not $config.gateway.http.endpoints.responses) {
  $config.gateway.http.endpoints | Add-Member -MemberType NoteProperty -Name responses -Value ([pscustomobject]@{})
}
if (-not $config.gateway.http.endpoints.chatCompletions) {
  $config.gateway.http.endpoints | Add-Member -MemberType NoteProperty -Name chatCompletions -Value ([pscustomobject]@{})
}

$config.gateway.http.endpoints.responses | Add-Member -MemberType NoteProperty -Name enabled -Value $true -Force
$config.gateway.http.endpoints.chatCompletions | Add-Member -MemberType NoteProperty -Name enabled -Value $true -Force

$config | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $configPath -Encoding UTF8
Write-Host "OpenClaw HTTP endpoints enabled: /v1/responses and /v1/chat/completions"
