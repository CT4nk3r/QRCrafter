$ErrorActionPreference = 'Stop'

$version = (git describe --tags --abbrev=0)
if (-not $version) {
  Write-Error "No git tag found. Please create a tag first: git tag -a v1.0.0 -m 'Release v1.0.0'"
}

Write-Host "Building Windows desktop release for $version..."

$releaseDir = Join-Path -Path $PSScriptRoot -ChildPath "..\releases\$version"
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

Set-Location (Join-Path $PSScriptRoot '..\web')

npm run tauri:build

Set-Location (Join-Path $PSScriptRoot '..')

$bundleDir = Join-Path $PSScriptRoot '..\web\src-tauri\target\release\bundle'
$msi = Get-ChildItem -Path (Join-Path $bundleDir 'msi') -Filter '*.msi' -ErrorAction SilentlyContinue | Select-Object -First 1
$exe = Get-ChildItem -Path (Join-Path $bundleDir 'nsis') -Filter '*.exe' -ErrorAction SilentlyContinue | Select-Object -First 1

$artifacts = @()

if ($msi) {
  $msiDest = Join-Path $releaseDir "QRCrafter-$version-windows.msi"
  Copy-Item $msi.FullName $msiDest -Force
  $artifacts += $msiDest
  Write-Host "Added $([System.IO.Path]::GetFileName($msiDest))"
} else {
  Write-Warning "Missing artifact: $bundleDir\msi\*.msi"
}

if ($exe) {
  $exeDest = Join-Path $releaseDir "QRCrafter-$version-windows.exe"
  Copy-Item $exe.FullName $exeDest -Force
  $artifacts += $exeDest
  Write-Host "Added $([System.IO.Path]::GetFileName($exeDest))"
} else {
  Write-Warning "Missing artifact: $bundleDir\nsis\*.exe"
}

$checksumFile = Join-Path $releaseDir 'checksums-windows.txt'
"QRCrafter $version - Windows SHA256 Checksums" | Out-File $checksumFile -Encoding utf8
"=============================================" | Out-File $checksumFile -Encoding utf8 -Append

foreach ($artifact in $artifacts) {
  $hash = (Get-FileHash -Path $artifact -Algorithm SHA256).Hash
  "$([System.IO.Path]::GetFileName($artifact)): $hash" | Out-File $checksumFile -Encoding utf8 -Append
}

Write-Host "Release artifacts written to $releaseDir"
