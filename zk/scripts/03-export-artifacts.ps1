. "$PSScriptRoot/config.ps1"

Write-Host "==> Creating application artifact folders..."

New-Item -ItemType Directory -Force -Path $WebAppArtifactsDir | Out-Null
New-Item -ItemType Directory -Force -Path $ApiArtifactsDir | Out-Null

if (!(Test-Path $WasmFile)) {
    throw "Missing WASM file. Run 01-compile-circuit.ps1 first."
}

if (!(Test-Path $ZkeyFinal)) {
    throw "Missing final zkey. Run 02-trusted-setup.ps1 first."
}

if (!(Test-Path $VerificationKeyFile)) {
    throw "Missing verification key. Run 02-trusted-setup.ps1 first."
}

Write-Host "==> Exporting Web App proving artifacts..."

Copy-Item $WasmFile "$WebAppArtifactsDir/$CircuitName.wasm" -Force
Copy-Item $ZkeyFinal "$WebAppArtifactsDir/${CircuitName}_final.zkey" -Force

Write-Host "==> Exporting API verification artifact..."

Copy-Item $VerificationKeyFile "$ApiArtifactsDir/verification_key.json" -Force

Write-Host "==> Export complete."

Write-Host ""
Write-Host "Web App gets:"
Write-Host "  $WebAppArtifactsDir/$CircuitName.wasm"
Write-Host "  $WebAppArtifactsDir/${CircuitName}_final.zkey"

Write-Host ""
Write-Host "API gets:"
Write-Host "  $ApiArtifactsDir/verification_key.json"