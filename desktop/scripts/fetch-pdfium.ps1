# Downloads the PDFium binary used by the native desktop app.
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\fetch-pdfium.ps1
param(
    [string]$Version = "chromium/8111",
    [ValidateSet("windows-x64", "linux-x64", "macos-arm64", "macos-x64")]
    [string]$Platform = "windows-x64",
    [string]$Destination = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($Destination)) {
    $Destination = Join-Path $root "vendor\pdfium\$Platform"
}
$Destination = [System.IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Path $Destination -Force | Out-Null

switch ($Platform) {
    "windows-x64" { $asset = "pdfium-win-x64.tgz"; $library = "bin\pdfium.dll" }
    "linux-x64"   { $asset = "pdfium-linux-x64.tgz"; $library = "lib\libpdfium.so" }
    "macos-arm64" { $asset = "pdfium-macos-arm64.tgz"; $library = "lib\libpdfium.dylib" }
    "macos-x64"   { $asset = "pdfium-macos-x64.tgz"; $library = "lib\libpdfium.dylib" }
}

$archive = Join-Path $Destination $asset
$url = "https://github.com/bblanchon/pdfium-binaries/releases/download/$Version/$asset"

if (-not (Test-Path $archive)) {
    Write-Host "Downloading $url"
    Invoke-WebRequest -Uri $url -OutFile $archive -UseBasicParsing
}

Write-Host "Extracting $archive"
tar -xzf $archive -C $Destination
if ($LASTEXITCODE -ne 0) {
    throw "Failed to extract $archive"
}

$libraryPath = Join-Path $Destination $library
if (-not (Test-Path $libraryPath)) {
    throw "PDFium library not found at $libraryPath"
}

Write-Host "PDFium ready: $libraryPath"
