# Installs OpenPDF Studio for the current Windows user and registers it as a
# PDF handler candidate. No administrator rights are required.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
#   powershell -ExecutionPolicy Bypass -File .\install-windows.ps1 -NoShortcut
param(
    [string]$InstallDir = (Join-Path $env:LOCALAPPDATA "OpenPDF Studio"),
    [switch]$NoShortcut
)

$ErrorActionPreference = "Stop"
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceExe = Join-Path $source "openpdf-desktop.exe"
$sourceDll = Join-Path $source "pdfium.dll"

if (-not (Test-Path $sourceExe) -or -not (Test-Path $sourceDll)) {
    throw "openpdf-desktop.exe and pdfium.dll must be in the same folder as this script."
}

$installDir = [System.IO.Path]::GetFullPath($InstallDir)
New-Item -ItemType Directory -Path $installDir -Force | Out-Null

$running = Get-Process openpdf-desktop -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "Closing the running OpenPDF Studio instance..."
    $running | Stop-Process -Force
    Start-Sleep -Milliseconds 500
}

Copy-Item $sourceExe (Join-Path $installDir "openpdf-desktop.exe") -Force
Copy-Item $sourceDll (Join-Path $installDir "pdfium.dll") -Force
foreach ($name in @("README.md", "THIRD-PARTY-NOTICES.md", "LICENSE", "uninstall-windows.ps1")) {
    $item = Join-Path $source $name
    if (Test-Path $item) {
        Copy-Item $item (Join-Path $installDir $name) -Force
    }
}
$licenseSource = Join-Path $source "licenses"
if (Test-Path $licenseSource) {
    Copy-Item $licenseSource (Join-Path $installDir "licenses") -Recurse -Force
}

$exe = Join-Path $installDir "openpdf-desktop.exe"
$progId = "OpenPDFStudio.PDF"
$description = "OpenPDF Studio PDF document"

# ProgID and open command.
$progKey = "HKCU:\Software\Classes\$progId"
New-Item -Path $progKey -Force | Out-Null
Set-ItemProperty -Path $progKey -Name "(default)" -Value $description
New-Item -Path "$progKey\DefaultIcon" -Force | Out-Null
Set-ItemProperty -Path "$progKey\DefaultIcon" -Name "(default)" -Value "`"$exe`",0"
New-Item -Path "$progKey\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "$progKey\shell\open\command" -Name "(default)" -Value "`"$exe`" `"%1`""

# Offer OpenPDF Studio in Explorer's "Open with" menu for .pdf files.
$pdfKey = "HKCU:\Software\Classes\.pdf"
New-Item -Path $pdfKey -Force | Out-Null
New-Item -Path "$pdfKey\OpenWithProgids" -Force | Out-Null
New-ItemProperty -Path "$pdfKey\OpenWithProgids" -Name $progId -Value "" -PropertyType String -Force | Out-Null

# Make the app visible under Windows "Default apps".
$capabilities = "HKCU:\Software\OpenPDFStudio\Capabilities"
New-Item -Path $capabilities -Force | Out-Null
Set-ItemProperty -Path $capabilities -Name "ApplicationName" -Value "OpenPDF Studio"
Set-ItemProperty -Path $capabilities -Name "ApplicationDescription" -Value "Native, local-first PDF viewer and annotator"
New-Item -Path "$capabilities\FileAssociations" -Force | Out-Null
Set-ItemProperty -Path "$capabilities\FileAssociations" -Name ".pdf" -Value $progId
New-Item -Path "HKCU:\Software\RegisteredApplications" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\RegisteredApplications" -Name "OpenPDF Studio" -Value "Software\OpenPDFStudio\Capabilities"

# Add/Remove Programs entry.
$uninstallKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenPDFStudio"
New-Item -Path $uninstallKey -Force | Out-Null
Set-ItemProperty -Path $uninstallKey -Name "DisplayName" -Value "OpenPDF Studio"
Set-ItemProperty -Path $uninstallKey -Name "DisplayVersion" -Value "0.2.0"
Set-ItemProperty -Path $uninstallKey -Name "Publisher" -Value "OpenPDF Studio"
Set-ItemProperty -Path $uninstallKey -Name "DisplayIcon" -Value "`"$exe`",0"
Set-ItemProperty -Path $uninstallKey -Name "InstallLocation" -Value $installDir
Set-ItemProperty -Path $uninstallKey -Name "UninstallString" -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$installDir\uninstall-windows.ps1`""
Set-ItemProperty -Path $uninstallKey -Name "NoModify" -Value 1 -Type DWord
Set-ItemProperty -Path $uninstallKey -Name "NoRepair" -Value 1 -Type DWord

if (-not $NoShortcut) {
    $shell = New-Object -ComObject WScript.Shell
    $programs = [Environment]::GetFolderPath("Programs")
    $shortcut = $shell.CreateShortcut((Join-Path $programs "OpenPDF Studio.lnk"))
    $shortcut.TargetPath = $exe
    $shortcut.WorkingDirectory = $installDir
    $shortcut.IconLocation = "$exe,0"
    $shortcut.Description = "OpenPDF Studio"
    $shortcut.Save()
}

Write-Host ""
Write-Host "OpenPDF Studio installed at: $installDir"
Write-Host ""
Write-Host "To make it the default PDF app:"
Write-Host "  Windows 11: Settings > Apps > Default apps > Choose defaults by file type > .pdf"
Write-Host "  Windows 10: Settings > Apps > Default apps > Choose default apps by file type > .pdf"
Write-Host ""
Write-Host "Or right-click a PDF > Open with > Choose another app > OpenPDF Studio > Always."
Write-Host ""
if (-not $NoShortcut) {
    Write-Host "A Start Menu shortcut was created."
}
