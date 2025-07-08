

# -*- coding: utf-8 -*-
"""
Fuzzy Engine Rekomendasi Pendakian (Versi Lengkap Sesuai Dokumen)

Deskripsi:
Kode ini mengimplementasikan sistem logika fuzzy untuk memberikan rekomendasi
jalur pendakian gunung, disesuaikan sepenuhnya dengan metrik dari dokumen
"detail standard fuzzy engine".

Versi ini mencakup 13 variabel input untuk penilaian yang komprehensif.

Cara Penggunaan:
1. Jalankan sel di atas untuk menginstal library yang dibutuhkan.
2. Jalankan sisa skrip ini di sel berikutnya.
"""

# 1. Import Library
import sys
import json
import numpy as np
import pandas as pd
import skfuzzy as fuzz
from skfuzzy import control as ctrl
import psycopg2
import os
import traceback

sys.stdout.reconfigure(encoding='utf-8')

# Hapus print statement yang mengacaukan JSON output

# 2. Koneksi Database dan Pengambilan Data Real
def get_data_jalur_from_database():
    """
    Menghubungkan ke database PostgreSQL dan mengambil data gabungan
    dari tabel jalur_pendakian dan gunung.
    """
    conn = None
    try:
        # Konfigurasi koneksi database
        conn_params = {
            "dbname": os.getenv("DB_NAME", "db_gunung2"),
            "user": os.getenv("DB_USER", "postgres"),
            "password": os.getenv("DB_PASSWORD", "postgres"),
            "host": os.getenv("DB_HOST", "localhost"),
            "port": os.getenv("DB_PORT", "5432")
        }
        conn = psycopg2.connect(**conn_params)
        # Query untuk mengambil semua data jalur dengan informasi gunung
        query = """
            SELECT 
                j.id_jalur,
                j.id_gunung,
                j.nama_jalur,
                g.nama_gunung,
                COALESCE(g.ketinggian_puncak_mdpl, 2000) as ketinggian_puncak_mdpl,
                COALESCE(g.variasi_jalur_skala, 5) as variasi_jalur_skala,
                COALESCE(j.kesulitan_skala, 5) as kesulitan_skala,
                COALESCE(j.keamanan_skala, 5) as keamanan_skala,
                COALESCE(j.kualitas_fasilitas_skala, 5) as kualitas_fasilitas_skala,
                COALESCE(j.kualitas_kemah_skala, 5) as kualitas_kemah_skala,
                COALESCE(j.keindahan_pemandangan_skala, 5) as keindahan_pemandangan_skala,
                COALESCE(j.estimasi_waktu_jam, 24) as estimasi_waktu_jam,
                COALESCE(j.variasi_lanskap_skala, 5) as variasi_lanskap_skala,
                COALESCE(j.perlindungan_angin_kemah_skala, 5) as perlindungan_angin_kemah_skala,
                COALESCE(j.ketersediaan_sumber_air_skala, 5) as ketersediaan_sumber_air_skala,
                COALESCE(j.jaringan_komunikasi_skala, 5) as jaringan_komunikasi_skala,
                COALESCE(j.tingkat_insiden_skala, 5) as tingkat_insiden_skala,
                j.status_jalur,
                COALESCE(j.deskripsi_jalur, '') as deskripsi_jalur,
                COALESCE(j.lokasi_pintu_masuk, '') as lokasi_pintu_masuk,
                COALESCE(g.lokasi_administratif, '') as lokasi_administratif,
                COALESCE(g.deskripsi_singkat, '') as deskripsi_singkat,
                COALESCE(g.url_thumbnail, '') as url_thumbnail
            FROM jalur_pendakian j
            JOIN gunung g ON j.id_gunung = g.id_gunung
            WHERE j.id_jalur IS NOT NULL
            ORDER BY g.nama_gunung, j.nama_jalur;
        """
        df = pd.read_sql_query(query, conn)
        print(f"✅ Berhasil mengambil {len(df)} data jalur dari database", file=sys.stderr)
        return df
    except Exception as error:
        print(f"❌ Database connection error: {error}", file=sys.stderr)
        # Tidak ada fallback ke data mock, langsung raise agar pengujian gagal
        raise
    finally:
        if conn:
            conn.close()

# 2.1 Fungsi fallback untuk data mock (jika database tidak tersedia)
def get_mock_data_jalur():
    """
    Fungsi fallback dummy dinonaktifkan agar tidak pernah dipakai.
    """
    raise RuntimeError("Fungsi get_mock_data_jalur() tidak boleh dipanggil pada mode produksi/pengujian!")

# 3. Fuzzy Engine
def cek_kolom(df, kolom):
    if kolom not in df.columns:
        print(f"❌ Kolom '{kolom}' tidak ditemukan di DataFrame!", file=sys.stderr)
        return False
    return True

def proses_rekomendasi(df_jalur=None, preferensi_pengguna=None):
    """Fungsi utama yang melakukan seluruh proses: fetch data, filter dan kalkulasi skor."""
    
    # Jika df_jalur tidak diberikan, ambil dari database
    if df_jalur is None:
        df_jalur = get_data_jalur_from_database()
    
    if df_jalur.empty:
        print("❌ Tidak ada data jalur yang tersedia", file=sys.stderr)
        return pd.DataFrame(), pd.DataFrame()
    # Definisi Universe Variabel (Rentang Nilai)
    ketinggian_univ = np.arange(0, 5501, 1)
    skala_univ = np.arange(0, 11, 1)
    waktu_univ = np.arange(0, 101, 1)
    skor_univ = np.arange(0, 101, 1)

    # Definisi Variabel Input (Antecedents) sesuai dokumentasi
    antecedents = {
        'ketinggian_puncak_mdpl': ctrl.Antecedent(ketinggian_univ, 'ketinggian_puncak_mdpl'),
        'kesulitan_skala': ctrl.Antecedent(skala_univ, 'kesulitan_skala'),
        'keamanan_skala': ctrl.Antecedent(skala_univ, 'keamanan_skala'),
        'kualitas_fasilitas_skala': ctrl.Antecedent(skala_univ, 'kualitas_fasilitas_skala'),
        'kualitas_kemah_skala': ctrl.Antecedent(skala_univ, 'kualitas_kemah_skala'),
        'keindahan_pemandangan_skala': ctrl.Antecedent(skala_univ, 'keindahan_pemandangan_skala'),
        'estimasi_waktu_jam': ctrl.Antecedent(waktu_univ, 'estimasi_waktu_jam'),
        'variasi_lanskap_skala': ctrl.Antecedent(skala_univ, 'variasi_lanskap_skala'),
        'perlindungan_angin_kemah_skala': ctrl.Antecedent(skala_univ, 'perlindungan_angin_kemah_skala'),
        # Variabel baru dari dokumentasi
        'ketersediaan_sumber_air_skala': ctrl.Antecedent(skala_univ, 'ketersediaan_sumber_air_skala'),
        'jaringan_komunikasi_skala': ctrl.Antecedent(skala_univ, 'jaringan_komunikasi_skala'),
        'tingkat_insiden_skala': ctrl.Antecedent(skala_univ, 'tingkat_insiden_skala'),
        'variasi_jalur_skala': ctrl.Antecedent(skala_univ, 'variasi_jalur_skala')
    }

    # Definisi Variabel Output (Consequent)
    skor_rekomendasi = ctrl.Consequent(skor_univ, 'skor_rekomendasi')

    # PEMBUATAN FUNGSI KEANGGOTAAN (MEMBERSHIP FUNCTIONS)
    # Disesuaikan sepenuhnya dengan dokumen "detail standard fuzzy engine".
    # Format trapmf: [awal_kiri, puncak_kiri, puncak_kanan, akhir_kanan]

    # Ketinggian Puncak
    antecedents['ketinggian_puncak_mdpl']['rendah'] = fuzz.trapmf(ketinggian_univ, [0, 0, 1000, 1500])
    antecedents['ketinggian_puncak_mdpl']['sedang'] = fuzz.trapmf(ketinggian_univ, [1500, 2000, 3000, 3500])
    antecedents['ketinggian_puncak_mdpl']['tinggi'] = fuzz.trapmf(ketinggian_univ, [3500, 4000, 5500, 5500])

    # Estimasi Waktu, ditambahkan 'ekspedisi'
    antecedents['estimasi_waktu_jam']['pendek'] = fuzz.trapmf(waktu_univ, [0, 0, 10, 14])
    antecedents['estimasi_waktu_jam']['sedang'] = fuzz.trapmf(waktu_univ, [12, 18, 30, 36])
    antecedents['estimasi_waktu_jam']['panjang'] = fuzz.trapmf(waktu_univ, [34, 40, 80, 100])
    antecedents['estimasi_waktu_jam']['ekspedisi'] = fuzz.trapmf(waktu_univ, [90, 100, 101, 101])

    # Tingkat Kesulitan
    antecedents['kesulitan_skala']['mudah'] = fuzz.trapmf(skala_univ, [0, 0, 2, 4])
    antecedents['kesulitan_skala']['sedang'] = fuzz.trapmf(skala_univ, [3, 4, 5, 7])
    antecedents['kesulitan_skala']['sulit'] = fuzz.trapmf(skala_univ, [6, 8, 10, 10])

    # Keamanan Jalur
    antecedents['keamanan_skala']['berbahaya'] = fuzz.trapmf(skala_univ, [0, 0, 2, 4])
    antecedents['keamanan_skala']['cukup_aman'] = fuzz.trapmf(skala_univ, [3, 4, 5, 7])
    antecedents['keamanan_skala']['aman'] = fuzz.trapmf(skala_univ, [6, 8, 10, 10])

    # Kualitas Fasilitas
    antecedents['kualitas_fasilitas_skala']['minim'] = fuzz.trapmf(skala_univ, [0, 0, 2, 4])
    antecedents['kualitas_fasilitas_skala']['cukup'] = fuzz.trapmf(skala_univ, [3, 4, 5, 7])
    antecedents['kualitas_fasilitas_skala']['lengkap'] = fuzz.trapmf(skala_univ, [6, 8, 10, 10])

    # Kualitas Area Kemah
    antecedents['kualitas_kemah_skala']['buruk'] = fuzz.trapmf(skala_univ, [0, 0, 2, 4])
    antecedents['kualitas_kemah_skala']['cukup'] = fuzz.trapmf(skala_univ, [3, 4, 5, 7])
    antecedents['kualitas_kemah_skala']['baik'] = fuzz.trapmf(skala_univ, [6, 8, 10, 10])

    # Keindahan Pemandangan
    antecedents['keindahan_pemandangan_skala']['biasa'] = fuzz.trapmf(skala_univ, [0, 0, 2, 4])
    antecedents['keindahan_pemandangan_skala']['indah'] = fuzz.trapmf(skala_univ, [3, 5, 6, 7])
    antecedents['keindahan_pemandangan_skala']['istimewa'] = fuzz.trapmf(skala_univ, [6, 8, 10, 10])

    # Variasi Lanskap
    antecedents['variasi_lanskap_skala']['monoton'] = fuzz.trapmf(skala_univ, [0, 0, 2, 4])
    antecedents['variasi_lanskap_skala']['cukup_bervariasi'] = fuzz.trapmf(skala_univ, [3, 4, 5, 7])
    antecedents['variasi_lanskap_skala']['sangat_bervariasi'] = fuzz.trapmf(skala_univ, [6, 8, 10, 10])

    # Perlindungan Angin
    antecedents['perlindungan_angin_kemah_skala']['sangat_terekspos'] = fuzz.trapmf(skala_univ, [0, 0, 2, 4])
    antecedents['perlindungan_angin_kemah_skala']['cukup_terlindungi'] = fuzz.trapmf(skala_univ, [3, 4, 5, 7])
    antecedents['perlindungan_angin_kemah_skala']['terlindungi'] = fuzz.trapmf(skala_univ, [6, 8, 10, 10])

    # Ketersediaan Sumber Air
    antecedents['ketersediaan_sumber_air_skala']['langka'] = fuzz.trapmf(skala_univ, [0, 0, 1, 3])
    antecedents['ketersediaan_sumber_air_skala']['terbatas'] = fuzz.trapmf(skala_univ, [2, 4, 5, 7])
    antecedents['ketersediaan_sumber_air_skala']['melimpah'] = fuzz.trapmf(skala_univ, [6, 8, 10, 10])

    # Jaringan Komunikasi
    antecedents['jaringan_komunikasi_skala']['tidak_ada'] = fuzz.trapmf(skala_univ, [0, 0, 1, 2])
    antecedents['jaringan_komunikasi_skala']['terbatas'] = fuzz.trapmf(skala_univ, [2, 4, 5, 7])
    antecedents['jaringan_komunikasi_skala']['baik'] = fuzz.trapmf(skala_univ, [6, 8, 10, 10])

    # Tingkat Insiden (Skor tinggi berarti lebih aman/jarang insiden)
    antecedents['tingkat_insiden_skala']['tinggi'] = fuzz.trapmf(skala_univ, [0, 0, 2, 4]) # Artinya insiden sering terjadi (berisiko)
    antecedents['tingkat_insiden_skala']['sedang'] = fuzz.trapmf(skala_univ, [3, 5, 6, 8])
    antecedents['tingkat_insiden_skala']['rendah'] = fuzz.trapmf(skala_univ, [8, 9, 10, 10]) # Artinya insiden jarang terjadi (aman)

    # Variasi Jalur
    antecedents['variasi_jalur_skala']['tunggal'] = fuzz.trapmf(skala_univ, [0, 0, 2, 3])
    antecedents['variasi_jalur_skala']['beberapa'] = fuzz.trapmf(skala_univ, [4, 5, 6, 7])
    antecedents['variasi_jalur_skala']['banyak'] = fuzz.trapmf(skala_univ, [8, 9, 10, 10])

    # Variabel Output: Skor Rekomendasi
    skor_rekomendasi.automf(names=['sangat_rendah', 'rendah', 'sedang', 'tinggi', 'sangat_tinggi'])

    # DEFINISI ATURAN FUZZY (RULES) SESUAI STANDAR DOKUMENTASI
    # Aturan dirancang berdasarkan prioritas dan kriteria yang tercantum dalam 
    # "detail standard fuzzy engine" dengan fokus pada keamanan, kenyamanan, dan pengalaman.
    rules = [
        # === ATURAN PRIORITAS SANGAT TINGGI (SANGAT POSITIF) ===
        # Kombinasi ideal: Pemandangan istimewa + Keamanan tinggi + Insiden rendah
        ctrl.Rule(antecedents['keindahan_pemandangan_skala']['istimewa'] &
                  antecedents['keamanan_skala']['aman'] &
                  antecedents['tingkat_insiden_skala']['rendah'],
                  skor_rekomendasi['sangat_tinggi']),
        
        # Kombinasi ideal: Lanskap bervariasi + Fasilitas lengkap + Air melimpah
        ctrl.Rule(antecedents['variasi_lanskap_skala']['sangat_bervariasi'] &
                  antecedents['kualitas_fasilitas_skala']['lengkap'] &
                  antecedents['ketersediaan_sumber_air_skala']['melimpah'] &
                  antecedents['tingkat_insiden_skala']['rendah'],
                  skor_rekomendasi['sangat_tinggi']),

        # === ATURAN PRIORITAS TINGGI ===
        # Fokus pada keamanan dan kenyamanan logistik
        ctrl.Rule(antecedents['keamanan_skala']['aman'] &
                  antecedents['tingkat_insiden_skala']['rendah'] &
                  (antecedents['kesulitan_skala']['mudah'] | antecedents['kesulitan_skala']['sedang']),
                  skor_rekomendasi['tinggi']),
        
        # Kualitas kemah dan perlindungan yang baik
        ctrl.Rule(antecedents['kualitas_kemah_skala']['baik'] &
                  antecedents['perlindungan_angin_kemah_skala']['terlindungi'] &
                  antecedents['ketersediaan_sumber_air_skala']['melimpah'],
                  skor_rekomendasi['tinggi']),
        
        # Pengalaman visual yang istimewa dengan keamanan memadai
        ctrl.Rule(antecedents['keindahan_pemandangan_skala']['istimewa'] &
                  antecedents['variasi_lanskap_skala']['sangat_bervariasi'] &
                  antecedents['keamanan_skala']['aman'],
                  skor_rekomendasi['tinggi']),
        
        # Fasilitas lengkap dan komunikasi baik (penting untuk keamanan)
        ctrl.Rule(antecedents['kualitas_fasilitas_skala']['lengkap'] &
                  antecedents['jaringan_komunikasi_skala']['baik'] &
                  antecedents['tingkat_insiden_skala']['rendah'],
                  skor_rekomendasi['tinggi']),

        # === ATURAN PRIORITAS SEDANG ===
        # Kondisi cukup baik dengan beberapa tantangan
        ctrl.Rule(antecedents['kesulitan_skala']['sedang'] &
                  antecedents['keamanan_skala']['cukup_aman'] &
                  antecedents['tingkat_insiden_skala']['sedang'],
                  skor_rekomendasi['sedang']),
        
        # Waktu menantang tapi fasilitas mendukung
        ctrl.Rule((antecedents['estimasi_waktu_jam']['panjang'] | antecedents['ketinggian_puncak_mdpl']['tinggi']) &
                  antecedents['kualitas_fasilitas_skala']['lengkap'] &
                  antecedents['keamanan_skala']['aman'],
                  skor_rekomendasi['sedang']),
        
        # Banyak pilihan jalur dengan kualitas cukup
        ctrl.Rule(antecedents['variasi_jalur_skala']['banyak'] &
                  antecedents['keamanan_skala']['cukup_aman'],
                  skor_rekomendasi['sedang']),
        
        # Pemandangan indah meski fasilitas terbatas
        ctrl.Rule(antecedents['keindahan_pemandangan_skala']['indah'] &
                  antecedents['variasi_lanskap_skala']['cukup_bervariasi'] &
                  antecedents['keamanan_skala']['cukup_aman'],
                  skor_rekomendasi['sedang']),

        # === ATURAN PRIORITAS RENDAH (PENALTI) ===
        # Masalah logistik dan kenyamanan
        ctrl.Rule(antecedents['kualitas_fasilitas_skala']['minim'] &
                  antecedents['kualitas_kemah_skala']['buruk'],
                  skor_rekomendasi['rendah']),
        
        # Masalah perlindungan dan sumber daya
        ctrl.Rule(antecedents['perlindungan_angin_kemah_skala']['sangat_terekspos'] &
                  antecedents['ketersediaan_sumber_air_skala']['terbatas'],
                  skor_rekomendasi['rendah']),
        
        # Komunikasi buruk dan insiden sedang
        ctrl.Rule(antecedents['jaringan_komunikasi_skala']['tidak_ada'] &
                  antecedents['tingkat_insiden_skala']['sedang'],
                  skor_rekomendasi['rendah']),
        
        # Kesulitan tinggi tanpa dukungan fasilitas
        ctrl.Rule(antecedents['kesulitan_skala']['sulit'] &
                  antecedents['kualitas_fasilitas_skala']['minim'] &
                  antecedents['keamanan_skala']['cukup_aman'],
                  skor_rekomendasi['rendah']),

        # === ATURAN PRIORITAS SANGAT RENDAH (SANGAT NEGATIF) ===
        # Masalah keamanan kritis
        ctrl.Rule(antecedents['keamanan_skala']['berbahaya'] |
                  antecedents['tingkat_insiden_skala']['tinggi'],
                  skor_rekomendasi['sangat_rendah']),
        
        # Kombinasi berbahaya: Kesulitan tinggi + Insiden tinggi
        ctrl.Rule(antecedents['kesulitan_skala']['sulit'] &
                  antecedents['tingkat_insiden_skala']['tinggi'],
                  skor_rekomendasi['sangat_rendah']),
        
        # Krisis logistik: Air langka + Fasilitas minim + Komunikasi tidak ada
        ctrl.Rule(antecedents['ketersediaan_sumber_air_skala']['langka'] &
                  antecedents['kualitas_fasilitas_skala']['minim'] &
                  antecedents['jaringan_komunikasi_skala']['tidak_ada'],
                  skor_rekomendasi['sangat_rendah']),
        
        # Kondisi ekstrem: Ekspedisi + Berbahaya + Air langka
        ctrl.Rule(antecedents['estimasi_waktu_jam']['ekspedisi'] &
                  antecedents['keamanan_skala']['berbahaya'] &
                  antecedents['ketersediaan_sumber_air_skala']['langka'],
                  skor_rekomendasi['sangat_rendah'])
    ]

    # === RULE FALLBACK ===
    # Jika tidak ada rule lain yang match, set skor ke 'sedang' (catch-all)
    # Fallback: gunakan OR semua antecedent utama pada kondisi "normal" (misal: sedang)
    fallback_condition = (
        (antecedents['keamanan_skala']['cukup_aman'] |
         antecedents['kesulitan_skala']['sedang'] |
         antecedents['ketersediaan_sumber_air_skala']['terbatas'] |
         antecedents['kualitas_fasilitas_skala']['cukup'] |
         antecedents['kualitas_kemah_skala']['cukup'] |
         antecedents['keindahan_pemandangan_skala']['indah'] |
         antecedents['variasi_lanskap_skala']['cukup_bervariasi'] |
         antecedents['perlindungan_angin_kemah_skala']['cukup_terlindungi'] |
         antecedents['jaringan_komunikasi_skala']['terbatas'] |
         antecedents['tingkat_insiden_skala']['sedang'] |
         antecedents['variasi_jalur_skala']['beberapa'] |
         antecedents['estimasi_waktu_jam']['sedang'] |
         antecedents['ketinggian_puncak_mdpl']['sedang'])
    )
    rules.append(ctrl.Rule(fallback_condition, skor_rekomendasi['sedang']))

    # Sistem Kontrol dan Simulasi
    sistem_kontrol = ctrl.ControlSystem(rules)
    simulasi = ctrl.ControlSystemSimulation(sistem_kontrol)

    # Filter data berdasarkan preferensi pengguna jika ada
    if preferensi_pengguna:
        df_filtered = df_jalur.copy()
        filter_applied = []
        # Filter kesulitan maksimal
        if preferensi_pengguna.get('max_kesulitan_skala') is not None and cek_kolom(df_filtered, 'kesulitan_skala'):
            df_filtered = df_filtered[df_filtered['kesulitan_skala'] <= preferensi_pengguna['max_kesulitan_skala']]
            filter_applied.append(f"Kesulitan ≤ {preferensi_pengguna['max_kesulitan_skala']}")
        # Filter keamanan minimal
        if preferensi_pengguna.get('min_keamanan_skala') is not None and cek_kolom(df_filtered, 'keamanan_skala'):
            df_filtered = df_filtered[df_filtered['keamanan_skala'] >= preferensi_pengguna['min_keamanan_skala']]
            filter_applied.append(f"Keamanan ≥ {preferensi_pengguna['min_keamanan_skala']}")
        # Filter waktu maksimal (dalam jam)
        if preferensi_pengguna.get('max_estimasi_waktu_jam') is not None and cek_kolom(df_filtered, 'estimasi_waktu_jam'):
            df_filtered = df_filtered[df_filtered['estimasi_waktu_jam'] <= preferensi_pengguna['max_estimasi_waktu_jam']]
            filter_applied.append(f"Waktu ≤ {preferensi_pengguna['max_estimasi_waktu_jam']} jam")
        # Filter ketinggian maksimal
        if preferensi_pengguna.get('max_ketinggian_mdpl') is not None and cek_kolom(df_filtered, 'ketinggian_puncak_mdpl'):
            df_filtered = df_filtered[df_filtered['ketinggian_puncak_mdpl'] <= preferensi_pengguna['max_ketinggian_mdpl']]
            filter_applied.append(f"Ketinggian ≤ {preferensi_pengguna['max_ketinggian_mdpl']} mdpl")
        # Filter ketersediaan air minimal
        if preferensi_pengguna.get('min_ketersediaan_air') is not None and cek_kolom(df_filtered, 'ketersediaan_sumber_air_skala'):
            df_filtered = df_filtered[df_filtered['ketersediaan_sumber_air_skala'] >= preferensi_pengguna['min_ketersediaan_air']]
            filter_applied.append(f"Air ≥ {preferensi_pengguna['min_ketersediaan_air']}")
        # Filter pemandangan minimal
        if preferensi_pengguna.get('min_keindahan_pemandangan_skala') is not None and cek_kolom(df_filtered, 'keindahan_pemandangan_skala'):
            df_filtered = df_filtered[df_filtered['keindahan_pemandangan_skala'] >= preferensi_pengguna['min_keindahan_pemandangan_skala']]
            filter_applied.append(f"Pemandangan ≥ {preferensi_pengguna['min_keindahan_pemandangan_skala']}")
        # Filter jaringan komunikasi minimal
        if preferensi_pengguna.get('min_jaringan_komunikasi') is not None and cek_kolom(df_filtered, 'jaringan_komunikasi_skala'):
            df_filtered = df_filtered[df_filtered['jaringan_komunikasi_skala'] >= preferensi_pengguna['min_jaringan_komunikasi']]
            filter_applied.append(f"Jaringan Komunikasi ≥ {preferensi_pengguna['min_jaringan_komunikasi']}")
        # Filter kualitas fasilitas minimal
        if preferensi_pengguna.get('min_kualitas_fasilitas_skala') is not None and cek_kolom(df_filtered, 'kualitas_fasilitas_skala'):
            df_filtered = df_filtered[df_filtered['kualitas_fasilitas_skala'] >= preferensi_pengguna['min_kualitas_fasilitas_skala']]
            filter_applied.append(f"Fasilitas ≥ {preferensi_pengguna['min_kualitas_fasilitas_skala']}")
        # Filter kualitas kemah minimal
        if preferensi_pengguna.get('min_kualitas_kemah_skala') is not None and cek_kolom(df_filtered, 'kualitas_kemah_skala'):
            df_filtered = df_filtered[df_filtered['kualitas_kemah_skala'] >= preferensi_pengguna['min_kualitas_kemah_skala']]
            filter_applied.append(f"Kemah ≥ {preferensi_pengguna['min_kualitas_kemah_skala']}")
        # Filter perlindungan angin minimal
        if preferensi_pengguna.get('min_perlindungan_angin') is not None and cek_kolom(df_filtered, 'perlindungan_angin_kemah_skala'):
            df_filtered = df_filtered[df_filtered['perlindungan_angin_kemah_skala'] >= preferensi_pengguna['min_perlindungan_angin']]
            filter_applied.append(f"Perlindungan Angin ≥ {preferensi_pengguna['min_perlindungan_angin']}")
        # Filter tingkat keamanan insiden minimal
        if preferensi_pengguna.get('min_tingkat_keamanan_insiden') is not None and cek_kolom(df_filtered, 'tingkat_insiden_skala'):
            df_filtered = df_filtered[df_filtered['tingkat_insiden_skala'] >= preferensi_pengguna['min_tingkat_keamanan_insiden']]
            filter_applied.append(f"Tingkat Keamanan Insiden ≥ {preferensi_pengguna['min_tingkat_keamanan_insiden']}")
        # Filter variasi lanskap minimal
        if preferensi_pengguna.get('min_variasi_lanskap') is not None and cek_kolom(df_filtered, 'variasi_lanskap_skala'):
            df_filtered = df_filtered[df_filtered['variasi_lanskap_skala'] >= preferensi_pengguna['min_variasi_lanskap']]
            filter_applied.append(f"Variasi Lanskap ≥ {preferensi_pengguna['min_variasi_lanskap']}")
        print(f"✅ Filter diterapkan: {', '.join(filter_applied) if filter_applied else 'Tidak ada'}", file=sys.stderr)
        print(f"✅ Jalur tersisa setelah filter: {len(df_filtered)} dari {len(df_jalur)}", file=sys.stderr)
        df_jalur = df_filtered
    if df_jalur.empty:
        return pd.DataFrame(), pd.DataFrame()

    # Hitung skor untuk setiap jalur yang tersisa dengan sistem bobot
    skor_list = []
    kriteria_weights = {
        # Bobot berdasarkan prioritas dari dokumentasi standar
        'keamanan_skala': 0.15,  # Prioritas tertinggi - keselamatan
        'tingkat_insiden_skala': 0.12,  # Sangat penting - track record keamanan
        'kesulitan_skala': 0.10,  # Penting untuk kesesuaian level pendaki
        'ketersediaan_sumber_air_skala': 0.10,  # Krusial untuk logistik
        'kualitas_fasilitas_skala': 0.08,  # Penting untuk kenyamanan
        'keindahan_pemandangan_skala': 0.08,  # Pengalaman visual
        'kualitas_kemah_skala': 0.07,  # Kenyamanan bermalam
        'variasi_lanskap_skala': 0.07,  # Keragaman pengalaman
        'estimasi_waktu_jam': 0.06,  # Perencanaan logistik
        'ketinggian_puncak_mdpl': 0.05,  # Risiko altitude sickness
        'perlindungan_angin_kemah_skala': 0.05,  # Kenyamanan kemah
        'jaringan_komunikasi_skala': 0.04,  # Keamanan komunikasi
        'variasi_jalur_skala': 0.03   # Fleksibilitas pilihan
    }
    
    for idx, row in df_jalur.iterrows():
        try:
            # Debug: print input ke fuzzy engine
            print(f"[DEBUG] Input fuzzy baris {idx}: {{}}".format({k: row[k] for k in antecedents}), file=sys.stderr)
            # Debug: print degree of membership untuk setiap input
            for key, ant in antecedents.items():
                memberships = {label: fuzz.interp_membership(ant.universe, ant[label].mf, row[key]) for label in ant.terms}
                print(f"[DEBUG] Membership {key}: {memberships}", file=sys.stderr)
            # Cek NaN pada input
            for key in antecedents:
                if pd.isna(row[key]):
                    print(f"[ERROR] Nilai {key} pada baris {idx} adalah NaN!", file=sys.stderr)
                simulasi.input[key] = row[key]
            # Menjalankan komputasi fuzzy
            simulasi.compute()
            # Tangani KeyError pada output
            if 'skor_rekomendasi' in simulasi.output:
                skor_fuzzy = simulasi.output['skor_rekomendasi']
            else:
                print(f"[ERROR] Fuzzy output tidak menghasilkan skor_rekomendasi pada baris {idx}! Output: {simulasi.output}", file=sys.stderr)
                skor_fuzzy = 0
            # Hitung weighted score berdasarkan kriteria individual
            weighted_score = 0
            total_weight = 0
            for kriteria, weight in kriteria_weights.items():
                if kriteria in row and pd.notna(row[kriteria]):
                    if kriteria == 'estimasi_waktu_jam':
                        normalized_value = max(0, 100 - (row[kriteria] / 100 * 100))
                    elif kriteria == 'ketinggian_puncak_mdpl':
                        normalized_value = min(100, (row[kriteria] / 5500) * 100)
                    else:
                        normalized_value = (row[kriteria] / 10) * 100
                    weighted_score += normalized_value * weight
                    total_weight += weight
            if total_weight > 0:
                final_score = (skor_fuzzy * 0.7) + (weighted_score * 0.3)
            else:
                final_score = skor_fuzzy
            skor_list.append(final_score)
        except Exception as e:
            print(f"❌ Error saat menghitung skor pada baris index {idx}: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            skor_list.append(0)
    df_jalur['skor_rekomendasi'] = skor_list

    # Agregasi hasil per gunung dan pengurutan dengan metadata tambahan
    df_gunung = df_jalur.groupby(['id_gunung', 'nama_gunung']).agg(
        skor_tertinggi=('skor_rekomendasi', 'max'),
        skor_rata_rata=('skor_rekomendasi', 'mean'),
        jumlah_jalur=('id_jalur', 'count'),
        jalur_terbaik=('nama_jalur', lambda x: df_jalur.loc[df_jalur.loc[x.index, 'skor_rekomendasi'].idxmax(), 'nama_jalur']),
        kesulitan_terendah=('kesulitan_skala', 'min'),
        kesulitan_tertinggi=('kesulitan_skala', 'max'),
        keamanan_rata_rata=('keamanan_skala', 'mean'),
        ketinggian=('ketinggian_puncak_mdpl', 'first'),
        # Tambahan metadata untuk analisis
        lokasi_administratif=('lokasi_administratif', 'first'),
        deskripsi_singkat=('deskripsi_singkat', 'first'),
        url_thumbnail=('url_thumbnail', 'first')
    ).reset_index()
    
    # Tambahkan kategori rekomendasi berdasarkan skor
    def kategorikan_rekomendasi(skor):
        if skor >= 80:
            return "Sangat Direkomendasikan"
        elif skor >= 65:
            return "Direkomendasikan"
        elif skor >= 50:
            return "Cukup Direkomendasikan"
        elif skor >= 35:
            return "Kurang Direkomendasikan"
        else:
            return "Tidak Direkomendasikan"
    
    df_gunung['kategori_rekomendasi'] = df_gunung['skor_tertinggi'].apply(kategorikan_rekomendasi)
    df_gunung = df_gunung.sort_values(by='skor_tertinggi', ascending=False)

    # Tambahkan kategori untuk jalur individual
    df_jalur['kategori_rekomendasi'] = df_jalur['skor_rekomendasi'].apply(kategorikan_rekomendasi)
    df_jalur_ranked = df_jalur.sort_values(by='skor_rekomendasi', ascending=False)

    return df_gunung, df_jalur_ranked

# 4. Eksekusi dan Simulasi
def jalankan_simulasi():
    """Fungsi untuk menjalankan simulasi dan menampilkan hasilnya dengan berbagai skenario."""
    df_data = get_data_jalur_from_database()

    print("\n" + "="*100)
    print("🏔️  SIMULASI SISTEM REKOMENDASI FUZZY ENGINE (Sesuai Standar Dokumentasi)")
    print("="*100)

    # Skenario 1: Pendaki Pemula
    print("\n📍 SKENARIO 1: PENDAKI PEMULA")
    print("-" * 50)
    preferensi_pemula = {
        "max_kesulitan_skala": 5,  # Hindari jalur sulit
        "min_keamanan_skala": 7,   # Prioritas keamanan tinggi
        "max_estimasi_waktu_jam": 20,  # Maksimal 20 jam (2D1N)
        "min_ketersediaan_air": 6,  # Air harus cukup tersedia
        "max_ketinggian_mdpl": 3000  # Hindari gunung sangat tinggi
    }
    
    print(f"Preferensi: {preferensi_pemula}")
    rekomendasi_gunung, rekomendasi_jalur = proses_rekomendasi(df_data.copy(), preferensi_pemula)
    
    if not rekomendasi_gunung.empty:
        print("\n🏆 TOP 3 REKOMENDASI GUNUNG UNTUK PEMULA:")
        top_pemula = rekomendasi_gunung.head(3)[['nama_gunung', 'jalur_terbaik', 'skor_tertinggi', 'kategori_rekomendasi', 'ketinggian', 'kesulitan_terendah']]
        print(top_pemula.to_string(index=False))

    # Skenario 2: Pendaki Berpengalaman
    print("\n\n📍 SKENARIO 2: PENDAKI BERPENGALAMAN")
    print("-" * 50)
    preferensi_berpengalaman = {
        "min_keindahan_pemandangan": 8,  # Mengutamakan pemandangan istimewa
        "min_keamanan_skala": 5,         # Bisa terima risiko sedang
        "max_kesulitan_skala": 10        # Tidak masalah dengan kesulitan tinggi
    }
    
    print(f"Preferensi: {preferensi_berpengalaman}")
    rekomendasi_gunung2, rekomendasi_jalur2 = proses_rekomendasi(df_data.copy(), preferensi_berpengalaman)
    
    if not rekomendasi_gunung2.empty:
        print("\n🏆 TOP 3 REKOMENDASI GUNUNG UNTUK PENDAKI BERPENGALAMAN:")
        top_berpengalaman = rekomendasi_gunung2.head(3)[['nama_gunung', 'jalur_terbaik', 'skor_tertinggi', 'kategori_rekomendasi', 'ketinggian', 'kesulitan_tertinggi']]
        print(top_berpengalaman.to_string(index=False))

    # Skenario 3: Tanpa Filter (Semua Data)
    print("\n\n📍 SKENARIO 3: REKOMENDASI UMUM (TANPA FILTER)")
    print("-" * 50)
    rekomendasi_gunung_full, rekomendasi_jalur_full = proses_rekomendasi(df_data.copy())
    
    if not rekomendasi_gunung_full.empty:
        print("\n🏆 TOP 5 REKOMENDASI GUNUNG SECARA UMUM:")
        top_umum = rekomendasi_gunung_full.head(5)[['nama_gunung', 'jalur_terbaik', 'skor_tertinggi', 'kategori_rekomendasi', 'jumlah_jalur', 'keamanan_rata_rata']]
        print(top_umum.to_string(index=False))
        
        print("\n📊 ANALISIS DISTRIBUSI KATEGORI:")
        distribusi = rekomendasi_gunung_full['kategori_rekomendasi'].value_counts()
        for kategori, jumlah in distribusi.items():
            persentase = (jumlah / len(rekomendasi_gunung_full)) * 100
            print(f"  • {kategori}: {jumlah} gunung ({persentase:.1f}%)")

    print("\n" + "="*100)
    print("✅ SIMULASI SELESAI - Engine telah disesuaikan dengan standar dokumentasi")
    print("✅ Menggunakan 13 variabel input sesuai laporan Database Mountify v5.0")
    print("✅ Aturan fuzzy mengikuti prioritas dalam 'detail standard fuzzy engine'")
    print("✅ Sistem bobot diterapkan berdasarkan tingkat kepentingan kriteria")
    print("="*100)


# 5. Fungsi Main untuk Integrasi dengan Node.js
def main():
    print("[PYTHON DEBUG] Mulai main()", file=sys.stderr)
    preferensi_pengguna = None
    
    # Parse command line arguments dari Node.js
    if len(sys.argv) > 1:
        try:
            # Ambil string JSON dari argumen baris perintah
            preferensi_json = sys.argv[1]
            # Ubah string JSON menjadi dictionary Python
            preferensi_pengguna = json.loads(preferensi_json)
            print(f"✅ Menerima preferensi: {preferensi_pengguna}", file=sys.stderr)
        except json.JSONDecodeError as e:
            # Jika JSON tidak valid, kirim pesan error ke stderr dan keluar
            print(f"❌ Error: Invalid JSON format received as argument: {e}", file=sys.stderr)
            sys.exit(1)

    try:
        print("[PYTHON DEBUG] Sebelum proses_rekomendasi", file=sys.stderr)
        # 1. Jalankan proses utama dengan data dari database
        rekomendasi_gunung, rekomendasi_jalur = proses_rekomendasi(None, preferensi_pengguna)
        print("[PYTHON DEBUG] Setelah proses_rekomendasi", file=sys.stderr)
        
        print("[PYTHON DEBUG] Sebelum konversi DataFrame ke JSON", file=sys.stderr)
        # 2. Hitung statistik tambahan untuk metadata
        if not rekomendasi_gunung.empty:
            distribusi_kategori = rekomendasi_gunung['kategori_rekomendasi'].value_counts().to_dict()
            skor_tertinggi = rekomendasi_gunung['skor_tertinggi'].max()
            skor_terendah = rekomendasi_gunung['skor_tertinggi'].min()
            skor_rata_rata = rekomendasi_gunung['skor_tertinggi'].mean()
        else:
            distribusi_kategori = {}
            skor_tertinggi = skor_terendah = skor_rata_rata = 0
        
        # 3. Siapkan hasil dalam format dictionary agar bisa dikonversi ke JSON
        hasil_akhir = {
            "rekomendasi_gunung": json.loads(rekomendasi_gunung.to_json(orient='records')),
            "rekomendasi_jalur": json.loads(rekomendasi_jalur.to_json(orient='records')),
            "metadata": {
                "total_gunung": len(rekomendasi_gunung),
                "total_jalur": len(rekomendasi_jalur),
                "preferensi_diterapkan": preferensi_pengguna is not None,
                "preferensi_detail": preferensi_pengguna if preferensi_pengguna else {},
                "statistik_skor": {
                    "tertinggi": float(skor_tertinggi),
                    "terendah": float(skor_terendah),
                    "rata_rata": float(skor_rata_rata)
                },
                "distribusi_kategori": distribusi_kategori,
                "engine_info": {
                    "versi": "5.0 - Sesuai Standar Dokumentasi",
                    "total_variabel": 13,
                    "sistem_bobot": True,
                    "database_integration": True
                }
            }
        }
        print("[PYTHON DEBUG] Setelah konversi DataFrame ke JSON", file=sys.stderr)

        # 4. Cetak hasil akhir sebagai satu string JSON ke output standar
        # Inilah yang akan ditangkap oleh server.js
        print(json.dumps(hasil_akhir, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"❌ Error in fuzzy engine: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        # Return error response yang bisa diparse oleh Node.js
        error_response = {
            "error": True,
            "message": str(e),
            "rekomendasi_gunung": [],
            "rekomendasi_jalur": [],
            "metadata": {
                "total_gunung": 0,
                "total_jalur": 0,
                "preferensi_diterapkan": False,
                "engine_info": {
                    "versi": "5.0 - Error State",
                    "error_detail": str(e)
                }
            }
        }
        print(json.dumps(error_response))
        sys.exit(1)


if __name__ == "__main__":
    # Jika dipanggil dengan argumen (dari Node.js), jalankan main()
    # Jika tidak ada argumen, jalankan simulasi untuk testing
    if len(sys.argv) > 1:
        main()
    else:
        jalankan_simulasi()