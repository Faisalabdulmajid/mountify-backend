# -*- coding: utf-8 -*-
"""
Fuzzy Engine Mountify - Google Colab Version (Lengkap)
- Semua membership function dan rules utama sudah diisi sesuai standar Mountify v5.0
- Data dummy/manual, siap untuk eksperimen dan visualisasi di Colab
"""

import numpy as np
import pandas as pd
import skfuzzy as fuzz
from skfuzzy import control as ctrl

# 1. Contoh Data Dummy (bisa diganti manual di Colab)
data = [
    # ketinggian, kesulitan, keamanan, fasilitas, kemah, pemandangan, waktu, lanskap, angin, air, komunikasi, insiden, variasi_jalur
    [2589, 3, 8, 5, 8, 7, 3, 5, 5, 5, 5, 5, 5],
    [2589, 5, 8, 6, 6, 8, 4, 5, 5, 5, 5, 5, 5],
    [3726, 7, 9, 7, 6, 9, 28, 9, 2, 5, 5, 6, 5],
    [1111, 0, 0, 0, 0, 0, 1, 5, 5, 5, 5, 5, 5],
]
kolom = [
    'ketinggian_puncak_mdpl', 'kesulitan_skala', 'keamanan_skala', 'kualitas_fasilitas_skala',
    'kualitas_kemah_skala', 'keindahan_pemandangan_skala', 'estimasi_waktu_jam', 'variasi_lanskap_skala',
    'perlindungan_angin_kemah_skala', 'ketersediaan_sumber_air_skala', 'jaringan_komunikasi_skala',
    'tingkat_insiden_skala', 'variasi_jalur_skala'
]
df = pd.DataFrame(data, columns=kolom)

# 2. Definisi Universe
ketinggian_univ = np.arange(0, 5501, 1)
skala_univ = np.arange(0, 11, 1)
waktu_univ = np.arange(0, 101, 1)
skor_univ = np.arange(0, 101, 1)

# 3. Definisi Antecedents & Consequent
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
    'ketersediaan_sumber_air_skala': ctrl.Antecedent(skala_univ, 'ketersediaan_sumber_air_skala'),
    'jaringan_komunikasi_skala': ctrl.Antecedent(skala_univ, 'jaringan_komunikasi_skala'),
    'tingkat_insiden_skala': ctrl.Antecedent(skala_univ, 'tingkat_insiden_skala'),
    'variasi_jalur_skala': ctrl.Antecedent(skala_univ, 'variasi_jalur_skala')
}
skor_rekomendasi = ctrl.Consequent(skor_univ, 'skor_rekomendasi')

# 4. Membership Function Lengkap
# Ketinggian Puncak
antecedents['ketinggian_puncak_mdpl']['rendah'] = fuzz.trapmf(ketinggian_univ, [0, 0, 1000, 1500])
antecedents['ketinggian_puncak_mdpl']['sedang'] = fuzz.trapmf(ketinggian_univ, [1500, 2000, 3000, 3500])
antecedents['ketinggian_puncak_mdpl']['tinggi'] = fuzz.trapmf(ketinggian_univ, [3500, 4000, 5500, 5500])
# Estimasi Waktu
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
# Kualitas Kemah
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
# Tingkat Insiden
antecedents['tingkat_insiden_skala']['tinggi'] = fuzz.trapmf(skala_univ, [0, 0, 2, 4])
antecedents['tingkat_insiden_skala']['sedang'] = fuzz.trapmf(skala_univ, [3, 5, 6, 8])
antecedents['tingkat_insiden_skala']['rendah'] = fuzz.trapmf(skala_univ, [8, 9, 10, 10])
# Variasi Jalur
antecedents['variasi_jalur_skala']['tunggal'] = fuzz.trapmf(skala_univ, [0, 0, 2, 3])
antecedents['variasi_jalur_skala']['beberapa'] = fuzz.trapmf(skala_univ, [4, 5, 6, 7])
antecedents['variasi_jalur_skala']['banyak'] = fuzz.trapmf(skala_univ, [8, 9, 10, 10])
# Output
skor_rekomendasi.automf(names=['sangat_rendah', 'rendah', 'sedang', 'tinggi', 'sangat_tinggi'])

# 5. Rules Lengkap (contoh utama, bisa ditambah di Colab)
rules = [
    ctrl.Rule(antecedents['keindahan_pemandangan_skala']['istimewa'] & antecedents['keamanan_skala']['aman'] & antecedents['tingkat_insiden_skala']['rendah'], skor_rekomendasi['sangat_tinggi']),
    ctrl.Rule(antecedents['variasi_lanskap_skala']['sangat_bervariasi'] & antecedents['kualitas_fasilitas_skala']['lengkap'] & antecedents['ketersediaan_sumber_air_skala']['melimpah'] & antecedents['tingkat_insiden_skala']['rendah'], skor_rekomendasi['sangat_tinggi']),
    ctrl.Rule(antecedents['keamanan_skala']['aman'] & antecedents['tingkat_insiden_skala']['rendah'] & (antecedents['kesulitan_skala']['mudah'] | antecedents['kesulitan_skala']['sedang']), skor_rekomendasi['tinggi']),
    ctrl.Rule(antecedents['kualitas_kemah_skala']['baik'] & antecedents['perlindungan_angin_kemah_skala']['terlindungi'] & antecedents['ketersediaan_sumber_air_skala']['melimpah'], skor_rekomendasi['tinggi']),
    ctrl.Rule(antecedents['keindahan_pemandangan_skala']['istimewa'] & antecedents['variasi_lanskap_skala']['sangat_bervariasi'] & antecedents['keamanan_skala']['aman'], skor_rekomendasi['tinggi']),
    ctrl.Rule(antecedents['kualitas_fasilitas_skala']['lengkap'] & antecedents['jaringan_komunikasi_skala']['baik'] & antecedents['tingkat_insiden_skala']['rendah'], skor_rekomendasi['tinggi']),
    ctrl.Rule(antecedents['kesulitan_skala']['sedang'] & antecedents['keamanan_skala']['cukup_aman'] & antecedents['tingkat_insiden_skala']['sedang'], skor_rekomendasi['sedang']),
    ctrl.Rule((antecedents['estimasi_waktu_jam']['panjang'] | antecedents['ketinggian_puncak_mdpl']['tinggi']) & antecedents['kualitas_fasilitas_skala']['lengkap'] & antecedents['keamanan_skala']['aman'], skor_rekomendasi['sedang']),
    ctrl.Rule(antecedents['variasi_jalur_skala']['banyak'] & antecedents['keamanan_skala']['cukup_aman'], skor_rekomendasi['sedang']),
    ctrl.Rule(antecedents['keindahan_pemandangan_skala']['indah'] & antecedents['variasi_lanskap_skala']['cukup_bervariasi'] & antecedents['keamanan_skala']['cukup_aman'], skor_rekomendasi['sedang']),
    ctrl.Rule(antecedents['kualitas_fasilitas_skala']['minim'] & antecedents['kualitas_kemah_skala']['buruk'], skor_rekomendasi['rendah']),
    ctrl.Rule(antecedents['perlindungan_angin_kemah_skala']['sangat_terekspos'] & antecedents['ketersediaan_sumber_air_skala']['terbatas'], skor_rekomendasi['rendah']),
    ctrl.Rule(antecedents['jaringan_komunikasi_skala']['tidak_ada'] & antecedents['tingkat_insiden_skala']['sedang'], skor_rekomendasi['rendah']),
    ctrl.Rule(antecedents['kesulitan_skala']['sulit'] & antecedents['kualitas_fasilitas_skala']['minim'] & antecedents['keamanan_skala']['cukup_aman'], skor_rekomendasi['rendah']),
    ctrl.Rule(antecedents['keamanan_skala']['berbahaya'] | antecedents['tingkat_insiden_skala']['tinggi'], skor_rekomendasi['sangat_rendah']),
    ctrl.Rule(antecedents['kesulitan_skala']['sulit'] & antecedents['tingkat_insiden_skala']['tinggi'], skor_rekomendasi['sangat_rendah']),
    ctrl.Rule(antecedents['ketersediaan_sumber_air_skala']['langka'] & antecedents['kualitas_fasilitas_skala']['minim'] & antecedents['jaringan_komunikasi_skala']['tidak_ada'], skor_rekomendasi['sangat_rendah']),
    ctrl.Rule(antecedents['estimasi_waktu_jam']['ekspedisi'] & antecedents['keamanan_skala']['berbahaya'] & antecedents['ketersediaan_sumber_air_skala']['langka'], skor_rekomendasi['sangat_rendah'])
]
# Fallback rule
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

# 6. Sistem Kontrol & Simulasi
sistem_kontrol = ctrl.ControlSystem(rules)
simulasi = ctrl.ControlSystemSimulation(sistem_kontrol)

# 7. Contoh eksekusi fuzzy untuk semua data
def run_fuzzy(df):
    hasil = []
    for idx, row in df.iterrows():
        for key in antecedents:
            simulasi.input[key] = row[key]
        simulasi.compute()
        hasil.append(simulasi.output['skor_rekomendasi'])
    df['skor_rekomendasi'] = hasil
    return df

# 8. Jalankan dan tampilkan hasil
df_hasil = run_fuzzy(df)
display(df_hasil)

# 9. Visualisasi (opsional, bisa pakai matplotlib di Colab)
# import matplotlib.pyplot as plt
# df_hasil['skor_rekomendasi'].plot(kind='bar')
# plt.show()
