param(
    [string]$InstallDir = (Join-Path $env:LOCALAPPDATA "OpenPDF Studio")
)

$ErrorActionPreference = "Stop"
$installDir = [System.IO.Path]::GetFullPath($InstallDir)
$progId = "OpenPDFStudio.PDF"

$running = Get-Process openpdf-desktop -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "Closing OpenPDF Studio..."
    $running | Stop-Process -Force
    Start-Sleep -Milliseconds 500
}

foreach ($key in @(
    "HKCU:\Software\Classes\$progId",
    "HKCU:\Software\OpenPDFStudio",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenPDFStudio"
)) {
    if (Test-Path $key) {
        Remove-Item $key -Recurse -Force
    }
}

$openWith = "HKCU:\Software\Classes\.pdf\OpenWithProgids"
if (Test-Path $openWith) {
    Remove-ItemProperty -Path $openWith -Name $progId -ErrorAction SilentlyContinue
}

$registered = "HKCU:\Software\RegisteredApplications"
if (Test-Path $registered) {
    Remove-ItemProperty -Path $registered -Name "OpenPDF Studio" -ErrorAction SilentlyContinue
}

$programs = [Environment]::GetFolderPath("Programs")
$shortcut = Join-Path $programs "OpenPDF Studio.lnk"
if (Test-Path $shortcut) {
    Remove-Item $shortcut -Force
}

if (Test-Path $installDir) {
    try {
        Remove-Item $installDir -Recurse -Force
        Write-Host "Removed $installDir"
    } catch {
        Write-Warning "Could not remove $installDir. Close OpenPDF Studio and delete the folder manually."
    }
}

Write-Host "OpenPDF Studio was removed from this user account."
Write-Host "If it was your default PDF app, Windows may ask you to choose another one."
