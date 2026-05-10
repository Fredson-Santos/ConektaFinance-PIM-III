$url = "http://localhost:5041/api/auth/login"
$body = @{ Email = "test@test.com"; Password = "wrongpassword" } | ConvertTo-Json
$headers = @{ "Content-Type" = "application/json" }

$totalRequests = 100
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

for ($i = 0; $i -lt $totalRequests; $i++) {
    try {
        Invoke-RestMethod -Uri $url -Method Post -Body $body -Headers $headers -ErrorAction SilentlyContinue
    } catch {
        # ignore
    }
}

$stopwatch.Stop()
$timeTakenMs = $stopwatch.ElapsedMilliseconds
$avgTime = $timeTakenMs / $totalRequests
$reqPerSec = $totalRequests / ($timeTakenMs / 1000)

Write-Host "--- TESTE DE PERFORMANCE (SEQUENCIAL) ---"
Write-Host "Total Requests : $totalRequests"
Write-Host "Tempo Total    : $timeTakenMs ms"
Write-Host "Media p/ Req   : $([math]::Round($avgTime, 2)) ms"
Write-Host "Reqs por seg   : $([math]::Round($reqPerSec, 2)) req/s"
Write-Host "-------------------------------------------"
