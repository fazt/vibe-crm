# Expone el API local (puerto 4000) con Cloudflare Quick Tunnel.
# Uso: .\scripts\cloudflare-tunnel.ps1
# Webhook Stripe: https://<url-generada>/api/webhooks/stripe

$ErrorActionPreference = "Stop"
$port = if ($env:API_PORT) { $env:API_PORT } else { 4000 }

Write-Host "Iniciando Cloudflare Tunnel -> http://localhost:$port" -ForegroundColor Cyan
Write-Host "Webhook Stripe: <tunnel-url>/api/webhooks/stripe" -ForegroundColor Yellow
Write-Host "Ctrl+C para detener" -ForegroundColor DarkGray

cloudflared tunnel --url "http://localhost:$port"
