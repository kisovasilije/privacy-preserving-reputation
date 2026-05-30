$ErrorActionPreference = "Stop"

Write-Host "==> Running complete trusted setup pipeline..."

& "$PSScriptRoot/01-compile-circuit.ps1"
& "$PSScriptRoot/02-trusted-setup.ps1"
& "$PSScriptRoot/03-export-artifacts.ps1"

Write-Host ""
Write-Host "==> Full trusted setup pipeline finished."