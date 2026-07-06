# Run this from inside this v4 fix folder.
# Change the path below to your existing converter folder if needed.
$Target = "C:\Users\HP\Downloads\examon-dpp-converter-mvp\examon-dpp-converter"

if (!(Test-Path $Target)) {
  Write-Host "Target folder not found: $Target" -ForegroundColor Red
  Write-Host "Edit APPLY_TO_EXISTING_CONVERTER_FOLDER.ps1 and set correct Target path." -ForegroundColor Yellow
  exit 1
}

New-Item -ItemType Directory -Force -Path (Join-Path $Target "src") | Out-Null
Copy-Item -Force ".\server.js" (Join-Path $Target "server.js")
Copy-Item -Force ".\src\parser.js" (Join-Path $Target "src\parser.js")
Copy-Item -Force ".\src\template.js" (Join-Path $Target "src\template.js")

Write-Host "Applied safe option fix v4 successfully." -ForegroundColor Green
Write-Host "Now run: npm run desktop" -ForegroundColor Cyan
