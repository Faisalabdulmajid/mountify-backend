# Laporan Komprehensif Backend Mountify

## 1. Struktur Utama Backend

- **Entry Point:**

  - `server.js`: Titik masuk utama server, menjalankan Express app, logging, dan penanganan shutdown/exception.
  - `app.js`: Setup utama Express, middleware, konfigurasi CORS, CSRF, dan routing.

- **Konfigurasi:**

  - `config/database.js`: Konfigurasi database.
  - `config/jwt.js`: Konfigurasi JWT.
  - `config/multer.js`: Konfigurasi upload file.

- **Controller:**

  - `authController.js`: Logika autentikasi.
  - `userController.js`: Manajemen user.
  - `adminController.js`: Operasi admin.
  - `chatbotController.js`: Integrasi chatbot.
  - `recommendationController.js`: Sistem rekomendasi.
  - `mountainController.js`: Manajemen data gunung.
  - `publicController.js`: Endpoint publik.

- **Routes:**

  - `auth.js`, `users.js`, `admin.js`, `chatbot.js`, `recommendations.js`, `mountains.js`, `public.js`, dan berbagai routes admin.

- **Service:**

  - `dialogflowService.js`: Integrasi Dialogflow.
  - `recommendationService.js`: Logika sistem rekomendasi.

- **Middleware:**

  - `auth.js`: Middleware autentikasi.
  - `csrf.js`: Middleware proteksi CSRF.

- **Utilities:**
  - `helpers.js`: Fungsi-fungsi pembantu.

## 2. Fitur Keamanan

- **CSRF Protection:**  
  Implementasi token-based CSRF dengan session management menggunakan library `csrf` dan `express-session`.

  - Token di-generate per session, diverifikasi untuk semua request non-GET.
  - Mendukung header (`X-CSRF-Token`, `X-XSRF-Token`), body, dan query.
  - Endpoint tertentu di-whitelist (login, register, health, GET/HEAD/OPTIONS).

- **CORS:**  
  Konfigurasi whitelist origin yang aman, dapat diatur lewat environment variable.

- **Error Handling & Logging:**  
  Menggunakan Winston untuk logging, penanganan uncaught exception dan unhandled rejection.

## 3. Dependensi Utama

- **Express**: Framework utama backend.
- **Winston**: Logging.
- **JWT**: Autentikasi berbasis token.
- **Multer**: Upload file.
- **CSRF, express-session**: Proteksi CSRF.
- **Swagger-UI-Express, YAMLJS**: Dokumentasi API.
- **Dialogflow, axios, nodemailer, pg**: Integrasi eksternal dan database.
- **Jest, Supertest**: Testing.

## 4. Testing

- Menggunakan Jest dan Supertest.
- Script test tersedia di `package.json` dan dapat dijalankan dengan `npm test`.
- File setup test: `tests/setup.js`.

## 5. Dokumentasi & Standar

- Dokumentasi struktur server tersedia di `SERVER_STRUCTURE.md`.
- Panduan proteksi CSRF di `CSRF_PROTECTION_GUIDE.md`.
- Dokumentasi API tersedia via Swagger di `/api-docs`.

---

### Penjelasan Detail Tiap Komponen

#### server.js

- Menjalankan Express app pada port yang ditentukan.
- Logging startup, dokumentasi API, dan health check.
- Menangani graceful shutdown (SIGTERM, SIGINT).
- Menangani uncaught exception dan unhandled rejection.

#### app.js

- Setup Express, CORS, parsing JSON, dan static file.
- Setup session dan CSRF protection.
- Routing ke berbagai modul (auth, user, admin, dsb).
- Integrasi Swagger untuk dokumentasi API.

#### Struktur Folder Backend

- `/config`: Konfigurasi database, JWT, dan upload.
- `/controllers`: Logika bisnis untuk setiap fitur utama.
- `/middleware`: Middleware autentikasi dan CSRF.
- `/routes`: Routing endpoint untuk setiap fitur.
- `/services`: Integrasi eksternal (Dialogflow, rekomendasi).
- `/utils`: Fungsi pembantu.
- `/logs`: File log aplikasi.
- `/public/uploads`: Folder upload file.

#### Fitur Keamanan

- CSRF protection dengan session dan token.
- CORS whitelist.
- Rate limiting (jika diaktifkan di middleware).
- Sanitasi input (menggunakan dompurify, sanitize-html).

#### Testing

- Unit dan integration test dengan Jest & Supertest.
- Test environment di-setup di `tests/setup.js`.

#### Dependensi Penting (dari package.json)

- express, winston, jsonwebtoken, multer, csrf, express-session, swagger-ui-express, yamljs, @google-cloud/dialogflow, axios, nodemailer, pg, dompurify, sanitize-html, jest, supertest.

---

Laporan ini dapat dikembangkan lebih lanjut sesuai kebutuhan detail tiap modul atau endpoint.
