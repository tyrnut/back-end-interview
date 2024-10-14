Push-Location $PSScriptRoot
docker compose -f ../docker-compose.yaml -f docker-compose.yaml up
Pop-Location