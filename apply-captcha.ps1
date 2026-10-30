# Adds the Turnstile bot check to the sign-up and login pages.
# Safe to run twice. If a page was changed by someone, it tells you and does not touch it.
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Patch($rel, $pairs) {
  $f = Join-Path $root $rel
  if (-not (Test-Path -LiteralPath $f)) { Write-Host "MISSING FILE $rel. Tell Claude."; return }
  $t = [System.IO.File]::ReadAllText($f)
  if ($t.Contains('Turnstile')) { Write-Host "$rel already has the bot check"; return }
  foreach ($p in $pairs) {
    if (-not $t.Contains($p[0])) { Write-Host "CANNOT PATCH $rel because it was changed. Tell Claude. Missing text: $($p[0])"; return }
    $t = $t.Replace($p[0], $p[1])
  }
  [System.IO.File]::WriteAllText($f, $t)
  Write-Host "patched $rel"
}

$importOld = "import { AuthFrame } from '../../components/app/AuthFrame';"
$importNew = $importOld + "`nimport { Turnstile, captchaEnabled } from '../../components/Turnstile';"
$busyOld = "  const [busy, setBusy] = useState(false);"
$btnOld = '<button className="ap-btn ap-btn-wide ap-submit" disabled={!ready || busy}'
$btnNew = "<Turnstile key={widgetKey} onToken={setCaptcha} />`n        " + '<button className="ap-btn ap-btn-wide ap-submit" disabled={!ready || busy || (captchaEnabled && !captcha)}'
$stateNew = $busyOld + "`n  const [captcha, setCaptcha] = useState('');`n  const [widgetKey, setWidgetKey] = useState(0);"

$signupOld = 'emailRedirectTo: `${window.location.origin}/dashboard` },'
$signupNew = 'emailRedirectTo: `${window.location.origin}/dashboard`, captchaToken: captcha || undefined },'
$signupEffect = "`n  useEffect(() => { if (msg?.bad) { setCaptcha(''); setWidgetKey((k) => k + 1); } }, [msg]);"
Patch 'apps\web\src\app\signup\page.tsx' @(
  @($importOld, $importNew),
  @($busyOld, ($stateNew + $signupEffect)),
  @($signupOld, $signupNew),
  @($btnOld, $btnNew)
)

$loginOld = 'await sb.auth.signInWithPassword({ email, password });'
$loginNew = 'await sb.auth.signInWithPassword({ email, password, options: { captchaToken: captcha || undefined } });'
$loginEffect = "`n  useEffect(() => { if (msg) { setCaptcha(''); setWidgetKey((k) => k + 1); } }, [msg]);"
Patch 'apps\web\src\app\login\page.tsx' @(
  @($importOld, $importNew),
  @($busyOld, ($stateNew + $loginEffect)),
  @($loginOld, $loginNew),
  @($btnOld, $btnNew)
)
