# fate-core-ko 릴리스 빌드 — 판매/배포용 zip 생성
# 사용법: powershell -ExecutionPolicy Bypass -File build-release.ps1
# 산출물: dist/fate-core-ko.zip, dist/system.json (GitHub Release에 둘 다 업로드)

$ErrorActionPreference = "Stop"
$root  = $PSScriptRoot
$sys   = Get-Content "$root\system.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$ver   = $sys.version
$stage = "$env:TEMP\fate-core-ko-build\fate-core-ko"
$dist  = "$root\dist"

Write-Host "== fate-core-ko v$ver 릴리스 빌드 =="

if (Test-Path "$env:TEMP\fate-core-ko-build") { Remove-Item "$env:TEMP\fate-core-ko-build" -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null
if (-not (Test-Path $dist)) { New-Item -ItemType Directory -Path $dist | Out-Null }

# ── 포함 목록 (화이트리스트) ──────────────────────────────
$include = @(
  "system.json", "template.json",
  "README.md", "LICENSE.md", "THIRD-PARTY-LICENSES.md", "CHANGELOG.md",
  "lang", "scripts", "styles", "templates", "assets"
)
foreach ($item in $include) {
  if (Test-Path "$root\$item") { Copy-Item "$root\$item" "$stage\$item" -Recurse }
}

# 생성 원본(대용량)은 배포 제외 — 가공본(assets/ui)만 동봉
Remove-Item "$stage\assets\generated" -Recurse -Force -ErrorAction SilentlyContinue

# ── 디자인 에셋: 런타임이 참조하는 것만 ──────────────────
$ds = "design\End-War Knight Design System"
New-Item -ItemType Directory -Path "$stage\$ds\assets\fonts", "$stage\$ds\journal" -Force | Out-Null

# 코드가 사용하는 폰트 8종만 (전체 128MB → 필요분만)
$fonts = @(
  "IBMPlexMono-Regular.ttf", "IBMPlexMono-Bold.ttf",
  "NotoSansKR-Variable.ttf",
  "NotoSerifKR-Regular.ttf", "NotoSerifKR-Medium.ttf",
  "NotoSerifKR-SemiBold.ttf", "NotoSerifKR-Bold.ttf", "NotoSerifKR-Black.ttf"
)
foreach ($f in $fonts) { Copy-Item "$root\$ds\assets\fonts\$f" "$stage\$ds\assets\fonts\" }

# 저널 템플릿 데이터 (샘플 삽화는 assets/ui의 자체 생성본을 참조)
Copy-Item "$root\$ds\journal\journals-data.js" "$stage\$ds\journal\"

# ── 압축 및 매니페스트 산출 ──────────────────────────────
$zip = "$dist\fate-core-ko.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path "$stage\*" -DestinationPath $zip
Copy-Item "$root\system.json" "$dist\system.json" -Force

$size = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host "완료: dist/fate-core-ko.zip ($size MB)"
Write-Host ""
Write-Host "배포 절차:"
Write-Host "  1) git tag v$ver; git push origin v$ver"
Write-Host "  2) GitHub Release v$ver 생성 → fate-core-ko.zip, system.json 업로드"
Remove-Item "$env:TEMP\fate-core-ko-build" -Recurse -Force
