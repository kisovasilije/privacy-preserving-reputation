. "$PSScriptRoot/config.ps1"

Write-Host "==> Creating build folder..."
New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null

Write-Host "==> Checking if circuit file exists..."
if (!(Test-Path $CircuitFile)) {
  throw "==> Circuit file not found: $CircuitFile"
}

Write-Host "==> Compiling circuit..."
circom $CircuitFile `
  --r1cs `
  --sym `
  --wasm `
  --output $BuildDir

Write-Host "==> Circuit compiled successfully."
