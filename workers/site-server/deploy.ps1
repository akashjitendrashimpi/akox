param([switch]$WithRoute)
$envFile = Join-Path $PSScriptRoot '..\..\apps\web\.env.local'
if (-not (Test-Path $envFile)) { Write-Host 'Cannot find apps\web\.env.local'; exit 1 }
$vals = @{}
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') { $vals[$Matches[1]] = $Matches[2].Trim().Trim('"') }
}
$url = $vals['NEXT_PUBLIC_SUPABASE_URL']
$key = $vals['NEXT_PUBLIC_SUPABASE_ANON_KEY']
if (-not $url -or -not $key) { Write-Host 'Missing the public Supabase values in .env.local'; exit 1 }
$extra = @()
if ($WithRoute) { $extra += @('--routes', '*.akox.in/*') }
Push-Location $PSScriptRoot
npx wrangler deploy --var "SUPABASE_URL:$url" --var "SUPABASE_ANON_KEY:$key" @extra
Pop-Location