# Script para generar tokens seguros
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "GENERADOR DE TOKENS SEGUROS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Token 1: BACKEND_READ_TOKEN
Write-Host "Token 1: BACKEND_READ_TOKEN" -ForegroundColor Green
$token1 = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host $token1 -ForegroundColor Yellow
Write-Host ""

# Token 2: BACKEND_UPDATE_INSTANCE_TOKEN
Write-Host "Token 2: BACKEND_UPDATE_INSTANCE_TOKEN" -ForegroundColor Green
$token2 = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host $token2 -ForegroundColor Yellow
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "COPIA ESTOS TOKENS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Para tu BACKEND (Easypanel):" -ForegroundColor Magenta
Write-Host "BACKEND_READ_TOKEN=$token1"
Write-Host "BACKEND_UPDATE_INSTANCE_TOKEN=$token2"
Write-Host ""
Write-Host "# Para tu FRONTEND (.env.local):" -ForegroundColor Magenta
Write-Host "NEXT_PUBLIC_BACKEND_READ_TOKEN=$token1"
Write-Host "NEXT_PUBLIC_BACKEND_UPDATE_INSTANCE_TOKEN=$token2"
Write-Host ""
