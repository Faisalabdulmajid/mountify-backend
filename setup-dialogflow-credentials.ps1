# Script PowerShell untuk setup file kunci Dialogflow dengan aman
# Jalankan script ini setelah mendapatkan file service account dari Google Cloud

Write-Host "=================================================" -ForegroundColor Green
Write-Host "SETUP KUNCI DIALOGFLOW - SISTEM REKOMENDASI GUNUNG" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Cek apakah file kunci lama ada
if (Test-Path "kunci-rahasia-dialogflow.json") {
    Write-Host "File kunci DialogFlow ditemukan: kunci-rahasia-dialogflow.json" -ForegroundColor Yellow
    
    # Buat direktori jika belum ada
    if (!(Test-Path "config/credentials")) {
        Write-Host "Membuat direktori credentials..." -ForegroundColor Blue
        New-Item -ItemType Directory -Path "config/credentials" -Force | Out-Null
    }
    
    # Pindahkan ke lokasi yang aman
    Write-Host "Memindahkan file kunci ke lokasi yang aman..." -ForegroundColor Blue
    Move-Item "kunci-rahasia-dialogflow.json" "config/credentials/dialogflow-service-account.json" -Force
    
    Write-Host "File berhasil dipindahkan ke: config/credentials/dialogflow-service-account.json" -ForegroundColor Green
} else {
    Write-Host "File kunci-rahasia-dialogflow.json tidak ditemukan" -ForegroundColor Red
    Write-Host "Silakan download file service account dari Google Cloud Console" -ForegroundColor Yellow
    Write-Host "dan letakkan di: config/credentials/dialogflow-service-account.json" -ForegroundColor Yellow
}

# Cek file kunci kedua jika ada
if (Test-Path "kunci-rahasia-dialogflow-2.json") {
    Write-Host "File kunci DialogFlow kedua ditemukan: kunci-rahasia-dialogflow-2.json" -ForegroundColor Yellow
    Write-Host "Menghapus file duplikat untuk keamanan..." -ForegroundColor Blue
    Remove-Item "kunci-rahasia-dialogflow-2.json" -Force
    Write-Host "File duplikat berhasil dihapus" -ForegroundColor Green
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "SETUP SELESAI!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "Selanjutnya:" -ForegroundColor Cyan
Write-Host "   1. Pastikan file .env sudah dikonfigurasi dengan benar" -ForegroundColor White
Write-Host "   2. Set GOOGLE_APPLICATION_CREDENTIALS=./config/credentials/dialogflow-service-account.json" -ForegroundColor White
Write-Host "   3. Set DIALOGFLOW_PROJECT_ID sesuai project ID Anda" -ForegroundColor White
Write-Host ""
Write-Host "PENTING:" -ForegroundColor Red
Write-Host "   - Jangan commit file credentials ke git repository!" -ForegroundColor White
Write-Host "   - File .gitignore sudah dikonfigurasi untuk mengabaikan file credentials" -ForegroundColor White
Write-Host "   - Backup file credentials di tempat yang aman" -ForegroundColor White
Write-Host "=================================================" -ForegroundColor Green
