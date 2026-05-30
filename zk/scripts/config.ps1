[Diagnostics.CodeAnalysis.SuppressMessageAttribute(
    'PSUseDeclaredVarsMoreThanAssignments',
    '',
    Justification = 'Variables are shared through dot-sourced config scripts.'
)]
param()

$ErrorActionPreference = "Stop"

$CircuitName = "rating"
$CircuitFile = "circuits/$CircuitName.circom"

$PotPower = 14

$BuildDir = "build"
$WebAppArtifactsDir = "../web/public/assets/zk"
$ApiArtifactsDir = "../api/zk-artifacts"

$R1csFile = "$BuildDir/$CircuitName.r1cs"
$SymFile = "$BuildDir/$CircuitName.sym"
$WasmDir = "$BuildDir/${CircuitName}_js"
$WasmFile = "$WasmDir/${CircuitName}.wasm"

$Ptau0 = "$BuildDir/pot${PotPower}_0000.ptau"
$Ptau1 = "$BuildDir/pot${PotPower}_0001.ptau"
$PtauFinal = "$BuildDir/pot${PotPower}_final.ptau"

$Zkey0 = "$BuildDir/${CircuitName}_0000.zkey"
$ZkeyFinal = "$BuildDir/${CircuitName}_final.zkey"

$VerificationKeyFile = "$BuildDir/verification_key.json"

$ContributionEntropy = "dev contribution entropy for $CircuitName"