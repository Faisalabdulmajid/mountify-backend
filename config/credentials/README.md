# Credentials Directory

Direktori ini adalah tempat untuk menyimpan file-file kredensial yang sensitif.

## PENTING: KEAMANAN

❌ **JANGAN PERNAH** commit file kredensial ke git repository!
✅ **SELALU** pastikan file-file berikut ini ada di .gitignore

## File yang harus ada di direktori ini:

### 1. dialogflow-service-account.json

File service account Google Cloud untuk Dialogflow.

Dapatkan file ini dari:

1. Google Cloud Console → IAM & Admin → Service Accounts
2. Pilih service account Dialogflow
3. Keys → Add Key → Create new key → JSON

### 2. Cara menggunakan:

1. Letakkan file kredensial di direktori ini
2. Update environment variable `GOOGLE_APPLICATION_CREDENTIALS` di file .env
3. Pastikan path mengarah ke file yang benar

### Contoh .env:

```
GOOGLE_APPLICATION_CREDENTIALS=./config/credentials/dialogflow-service-account.json
DIALOGFLOW_PROJECT_ID=your-project-id
```

## Catatan Keamanan:

- File-file di direktori ini akan diabaikan oleh git (melalui .gitignore)
- Jangan share file kredensial melalui email atau chat
- Gunakan sistem manajemen secret yang aman untuk production
- Backup file kredensial di tempat yang aman dan terenkripsi
