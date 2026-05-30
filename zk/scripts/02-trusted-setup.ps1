. "$PSScriptRoot/config.ps1"

Write-Host "==> Starting Powers of Tau ceremony..."
Write-Host "Power: $PotPower"

snarkjs powersoftau new bn128 $PotPower $Ptau0 -v

Write-Host "==> Contributing to Powers of Tau..."
snarkjs powersoftau contribute `
  $Ptau0 `
  $Ptau1 `
  --name="first contribution" `
  -v `
  -e="$ContributionEntropy"

Write-Host "==> Preparing phase 2 Powers of Tau..."
snarkjs powersoftau prepare phase2 `
  $Ptau1 `
  $PtauFinal `
  -v

if (!(Test-Path $R1csFile)) {
    throw "Missing R1CS file. Run 01-compile-circuit.ps1 first."
}

Write-Host "==> Starting Groth16 setup for circuit: $CircuitName"
snarkjs groth16 setup `
  $R1csFile `
  $PtauFinal `
  $Zkey0

Write-Host "==> Contributing to circuit-specific phase 2..."
snarkjs zkey contribute `
  $Zkey0 `
  $ZkeyFinal `
  --name="rating commitment contribution" `
  -v `
  -e="$ContributionEntropy"

Write-Host "==> Exporting verification key..."
snarkjs zkey export verificationkey `
  $ZkeyFinal `
  $VerificationKeyFile
