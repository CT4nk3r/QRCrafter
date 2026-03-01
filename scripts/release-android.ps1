$ErrorActionPreference = 'Stop'

$version = (git describe --tags --abbrev=0)
if (-not $version) {
  Write-Error "No git tag found. Please create a tag first: git tag -a v1.0.0 -m 'Release v1.0.0'"
}

Write-Host "Building Android release for $version..."

$releaseDir = Join-Path -Path $PSScriptRoot -ChildPath "..\releases\$version"
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

Set-Location (Join-Path $PSScriptRoot '..\android')

./gradlew.bat bundleRelease assembleRelease

Set-Location (Join-Path $PSScriptRoot '..')

$apkSrc = Join-Path $PSScriptRoot '..\android\app\build\outputs\apk\release\app-release.apk'
$aabSrc = Join-Path $PSScriptRoot '..\android\app\build\outputs\bundle\release\app-release.aab'
$apkDest = Join-Path $releaseDir "QRCrafter-$version-android.apk"
$aabDest = Join-Path $releaseDir "QRCrafter-$version-android.aab"

$artifacts = @()

if (Test-Path $apkSrc) {
  Copy-Item $apkSrc $apkDest -Force
  $artifacts += $apkDest
  Write-Host "Added $([System.IO.Path]::GetFileName($apkDest))"
} else {
  Write-Warning "Missing artifact: $apkSrc"
}

if (Test-Path $aabSrc) {
  Copy-Item $aabSrc $aabDest -Force
  $artifacts += $aabDest
  Write-Host "Added $([System.IO.Path]::GetFileName($aabDest))"
} else {
  Write-Warning "Missing artifact: $aabSrc"
}

$checksumFile = Join-Path $releaseDir 'checksums-android.txt'
"QRCrafter $version - Android SHA256 Checksums" | Out-File $checksumFile -Encoding utf8
"=============================================" | Out-File $checksumFile -Encoding utf8 -Append

foreach ($artifact in $artifacts) {
  $hash = (Get-FileHash -Path $artifact -Algorithm SHA256).Hash
  "$([System.IO.Path]::GetFileName($artifact)): $hash" | Out-File $checksumFile -Encoding utf8 -Append
}

Write-Host "Release artifacts written to $releaseDir"
