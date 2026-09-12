. "$PSScriptRoot/config.ps1"

Write-Host "==> Creating API runtime artifact folder..."

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

Write-Host "==> Exporting API runtime artifacts..."

Copy-Item $WasmFile "$ApiArtifactsDir/$CircuitName.wasm" -Force
Copy-Item $ZkeyFinal "$ApiArtifactsDir/${CircuitName}_final.zkey" -Force
Copy-Item $VerificationKeyFile "$ApiArtifactsDir/verification_key.json" -Force

Write-Host "==> Export complete."

Write-Host ""
Write-Host "API runtime artifacts:"
Write-Host "  $ApiArtifactsDir/$CircuitName.wasm"
Write-Host "  $ApiArtifactsDir/${CircuitName}_final.zkey"
Write-Host "  $ApiArtifactsDir/verification_key.json"
