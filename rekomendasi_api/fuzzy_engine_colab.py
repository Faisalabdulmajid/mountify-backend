# -*- coding: utf-8 -*-
"""
Fuzzy Engine Mountify - Google Colab Version

- Standalone, tidak ada koneksi database (gunakan data mock/manual)
- Mudah diubah untuk eksperimen membership function, rule, dan visualisasi
- Cocok untuk analisis, tuning, dan edukasi
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

# 4. Membership Function (bisa diubah di Colab)
antecedents['ketinggian_puncak_mdpl']['rendah'] = fuzz.trapmf(ketinggian_univ, [0, 0, 1000, 1500])
antecedents['ketinggian_puncak_mdpl']['sedang'] = fuzz.trapmf(ketinggian_univ, [1500, 2000, 3000, 3500])
antecedents['ketinggian_puncak_mdpl']['tinggi'] = fuzz.trapmf(ketinggian_univ, [3500, 4000, 5500, 5500])
# ... (lanjutkan definisi membership function lain sesuai fuzzy_engine.py) ...

# 5. Definisi Rules (bisa diubah di Colab)
rules = [
    ctrl.Rule(antecedents['keindahan_pemandangan_skala']['tinggi'] & antecedents['keamanan_skala']['aman'], skor_rekomendasi['sangat_tinggi']),
    # ... (tambahkan rules lain sesuai kebutuhan) ...
]

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
