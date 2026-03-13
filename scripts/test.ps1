# 自动化测试脚本 (Windows PowerShell)
# 运行前端和后端测试

$ErrorActionPreference = "Stop"

function Write-Info($message) {
    Write-Host $message -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host $message -ForegroundColor Green
}

function Write-Error($message) {
    Write-Host $message -ForegroundColor Red
}

function Write-Warning($message) {
    Write-Host $message -ForegroundColor Yellow
}

Write-Info "🧪 运行自动化测试框架..."
Write-Info "================================"

# 前端测试
Write-Warning "`n📦 运行前端测试..."
Write-Warning "================================"
try {
    npm run test:run
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ 前端测试失败"
        exit 1
    }
    Write-Success "✅ 前端测试通过"
} catch {
    Write-Error "❌ 前端测试执行出错: $_"
    exit 1
}

# 后端测试
Write-Warning "`n🔧 运行后端测试..."
Write-Warning "================================"
try {
    Push-Location src-tauri
    cargo test
    $rustExitCode = $LASTEXITCODE
    Pop-Location

    if ($rustExitCode -ne 0) {
        Write-Error "❌ 后端测试失败"
        exit 1
    }
    Write-Success "✅ 后端测试通过"
} catch {
    Write-Error "❌ 后端测试执行出错: $_"
    exit 1
}

Write-Success "`n================================"
Write-Success "✅ 所有测试通过!"
Write-Success "================================"
