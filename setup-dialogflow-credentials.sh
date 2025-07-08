#!/bin/bash

# Script untuk setup file kunci Dialogflow dengan aman
# Jalankan script ini setelah mendapatkan file service account dari Google Cloud

echo "================================================="
echo "🔐 SETUP KUNCI DIALOGFLOW - SISTEM REKOMENDASI GUNUNG"
echo "================================================="

# Cek apakah file kunci lama ada
if [ -f "kunci-rahasia-dialogflow.json" ]; then
    echo "📁 File kunci DialogFlow ditemukan: kunci-rahasia-dialogflow.json"
    
    # Pindahkan ke lokasi yang aman
    echo "🔄 Memindahkan file kunci ke lokasi yang aman..."
    mv kunci-rahasia-dialogflow.json config/credentials/dialogflow-service-account.json
    
    echo "✅ File berhasil dipindahkan ke: config/credentials/dialogflow-service-account.json"
else
    echo "❌ File kunci-rahasia-dialogflow.json tidak ditemukan"
    echo "📥 Silakan download file service account dari Google Cloud Console"
    echo "   dan letakkan di: config/credentials/dialogflow-service-account.json"
fi

# Cek file kunci kedua jika ada
if [ -f "kunci-rahasia-dialogflow-2.json" ]; then
    echo "📁 File kunci DialogFlow kedua ditemukan: kunci-rahasia-dialogflow-2.json"
    echo "🗑️  Menghapus file duplikat untuk keamanan..."
    rm kunci-rahasia-dialogflow-2.json
    echo "✅ File duplikat berhasil dihapus"
fi

# Cek apakah direktori credentials sudah ada
if [ ! -d "config/credentials" ]; then
    echo "📂 Membuat direktori credentials..."
    mkdir -p config/credentials
fi

# Set permission yang aman untuk direktori credentials
echo "🔒 Mengatur permission yang aman untuk direktori credentials..."
chmod 700 config/credentials
chmod 600 config/credentials/*.json 2>/dev/null || true

echo ""
echo "================================================="
echo "✅ SETUP SELESAI!"
echo "================================================="
echo "🔧 Selanjutnya:"
echo "   1. Pastikan file .env sudah dikonfigurasi dengan benar"
echo "   2. Set GOOGLE_APPLICATION_CREDENTIALS=./config/credentials/dialogflow-service-account.json"
echo "   3. Set DIALOGFLOW_PROJECT_ID sesuai project ID Anda"
echo ""
echo "⚠️  PENTING:"
echo "   - Jangan commit file credentials ke git repository!"
echo "   - File .gitignore sudah dikonfigurasi untuk mengabaikan file credentials"
echo "   - Backup file credentials di tempat yang aman"
echo "================================================="
