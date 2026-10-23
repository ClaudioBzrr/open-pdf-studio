param(
    [string]$Version = "0.2.0",
    [string]$Destination = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$repo = Split-Path -Parent $root
if ([string]::IsNullOrWhiteSpace($Destination)) {
    $Destination = Join-Path $root "dist"
}

$exe = Join-Path $root "target\release\openpdf-desktop.exe"
$pdfium = Join-Path $root "vendor\pdfium\windows-x64\bin\pdfium.dll"
if (-not (Test-Path $exe)) {
    throw "Missing $exe. Run cargo build --release in desktop/ first."
}
if (-not (Test-Path $pdfium)) {
    throw "Missing $pdfium. Run scripts/fetch-pdfium.ps1 first."
}

$stage = Join-Path $Destination "openpdf-desktop-windows-x64"
if (Test-Path $stage) {
    Remove-Item $stage -Recurse -Force
}
New-Item -ItemType Directory -Path $stage -Force | Out-Null

Copy-Item $exe (Join-Path $stage "openpdf-desktop.exe")
Copy-Item $pdfium (Join-Path $stage "pdfium.dll")
Copy-Item (Join-Path $root "README.md") (Join-Path $stage "README.md")
Copy-Item (Join-Path $root "THIRD-PARTY-NOTICES.md") (Join-Path $stage "THIRD-PARTY-NOTICES.md")
Copy-Item (Join-Path $root "scripts\install-windows.ps1") $stage
Copy-Item (Join-Path $root "scripts\uninstall-windows.ps1") $stage
Copy-Item (Join-Path $repo "LICENSE") (Join-Path $stage "LICENSE")

$licenses = Join-Path $stage "licenses"
New-Item -ItemType Directory -Path $licenses -Force | Out-Null
$pdfiumLicense = Join-Path $root "vendor\pdfium\windows-x64\licenses"
if (Test-Path $pdfiumLicense) {
    Copy-Item $pdfiumLicense (Join-Path $licenses "pdfium") -Recurse
}
Copy-Item (Join-Path $root "vendor\pdfium\windows-x64\LICENSE") (Join-Path $licenses "pdfium-binaries-LICENSE.txt") -ErrorAction SilentlyContinue
Copy-Item (Join-Path $root "assets\OFL.txt") (Join-Path $licenses "IBM-Plex-OFL.txt")

$zip = Join-Path $Destination "openpdf-desktop-windows-x64.zip"
if (Test-Path $zip) {
    Remove-Item $zip -Force
}
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -CompressionLevel Optimal

$hash = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant()
Write-Host "Created $zip"
Write-Host "SHA256 $hash"
Write-Host "Size $([math]::Round((Get-Item $zip).Length / 1MB, 2)) MB"
