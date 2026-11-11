[CmdletBinding()]
param(
    [ValidateSet("Debug", "Release")]
    [string] $Configuration = "Release",

    [string] $OutputDirectory
)

$ErrorActionPreference = "Stop"
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$testResultsRoot = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot "TestResults"))

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $testResultsRoot "RbacCoverage"
}

$resolvedOutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
$isTestResultsRoot = $resolvedOutputDirectory.Equals(
    $testResultsRoot,
    [System.StringComparison]::OrdinalIgnoreCase)
$isBelowTestResults = $resolvedOutputDirectory.StartsWith(
    $testResultsRoot + [System.IO.Path]::DirectorySeparatorChar,
    [System.StringComparison]::OrdinalIgnoreCase)

if (-not ($isTestResultsRoot -or $isBelowTestResults)) {
    throw "Coverage output must stay inside $testResultsRoot."
}

if (Test-Path -LiteralPath $resolvedOutputDirectory) {
    Remove-Item -LiteralPath $resolvedOutputDirectory -Recurse -Force
}

New-Item -ItemType Directory -Path $resolvedOutputDirectory -Force | Out-Null

function Invoke-CoverageProject {
    param(
        [Parameter(Mandatory)] [string] $ProjectPath,
        [Parameter(Mandatory)] [string] $SettingsPath,
        [Parameter(Mandatory)] [string] $ResultName
    )

    $resultDirectory = Join-Path $resolvedOutputDirectory $ResultName
    dotnet test $ProjectPath `
        --configuration $Configuration `
        --no-restore `
        --settings $SettingsPath `
        "--collect:XPlat Code Coverage" `
        --results-directory $resultDirectory

    if ($LASTEXITCODE -ne 0) {
        throw "Coverage test run failed for $ProjectPath with exit code $LASTEXITCODE."
    }
}

# API owns backend/shared assembly coverage. App intentionally includes CTS.App only,
# so the reports can be analyzed together without counting production assemblies twice.
Invoke-CoverageProject `
    -ProjectPath (Join-Path $repositoryRoot "CTS.Api.Tests\CTS.Api.Tests.csproj") `
    -SettingsPath (Join-Path $repositoryRoot "Config\coverage-api.runsettings") `
    -ResultName "Api"

Invoke-CoverageProject `
    -ProjectPath (Join-Path $repositoryRoot "CTS.App.Tests\CTS.App.Tests.csproj") `
    -SettingsPath (Join-Path $repositoryRoot "Config\coverage-app.runsettings") `
    -ResultName "App"

$reports = Get-ChildItem -LiteralPath $resolvedOutputDirectory -Filter "coverage.cobertura.xml" -Recurse
if ($reports.Count -ne 2) {
    throw "Expected two coverage reports but found $($reports.Count)."
}

$apiReport = $reports | Where-Object { $_.FullName -like "*$( [System.IO.Path]::DirectorySeparatorChar )Api$( [System.IO.Path]::DirectorySeparatorChar )*" }
$appReport = $reports | Where-Object { $_.FullName -like "*$( [System.IO.Path]::DirectorySeparatorChar )App$( [System.IO.Path]::DirectorySeparatorChar )*" }
[xml] $apiCoverage = Get-Content -LiteralPath $apiReport.FullName -Raw
[xml] $appCoverage = Get-Content -LiteralPath $appReport.FullName -Raw

$apiAssemblies = @($apiCoverage.coverage.packages.package | ForEach-Object { $_.name })
$appAssemblies = @($appCoverage.coverage.packages.package | ForEach-Object { $_.name })
$duplicateAssemblies = @($apiAssemblies | Where-Object { $appAssemblies -contains $_ })
if ($duplicateAssemblies.Count -gt 0) {
    throw "Coverage reports contain duplicate production assemblies: $($duplicateAssemblies -join ', ')."
}

$generatedFiles = @(
    $apiCoverage.coverage.packages.package.classes.class
    $appCoverage.coverage.packages.package.classes.class
) | Where-Object { $_.filename -match "[\\/]obj[\\/]" }
if ($generatedFiles.Count -gt 0) {
    throw "Coverage reports unexpectedly contain generated obj files."
}

Write-Output "RBAC coverage reports:"
$reports.FullName | Sort-Object
