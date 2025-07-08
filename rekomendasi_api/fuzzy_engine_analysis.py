# -*- coding: utf-8 -*-
"""
Fuzzy Engine Analisis Distribusi Skor & Kategori
File ini khusus untuk analisis distribusi skor/kategori hasil fuzzy engine Mountify.
"""

import sys
import json
import numpy as np
import pandas as pd
import skfuzzy as fuzz
from skfuzzy import control as ctrl
import psycopg2
import os
import traceback

# --- Import fungsi utama dari fuzzy_engine.py ---
from fuzzy_engine import get_data_jalur_from_database, proses_rekomendasi

def analisis_distribusi(preferensi_pengguna=None):
    df = get_data_jalur_from_database()
    rekomendasi_gunung, rekomendasi_jalur = proses_rekomendasi(df, preferensi_pengguna)
    
    print("\n===== ANALISIS DISTRIBUSI KATEGORI REKOMENDASI GUNUNG =====")
    if not rekomendasi_gunung.empty:
        distribusi = rekomendasi_gunung['kategori_rekomendasi'].value_counts()
        for kategori, jumlah in distribusi.items():
            persentase = (jumlah / len(rekomendasi_gunung)) * 100
            print(f"  • {kategori}: {jumlah} gunung ({persentase:.1f}%)")
        print("\nStatistik skor tertinggi:")
        print(rekomendasi_gunung[['nama_gunung','skor_tertinggi','kategori_rekomendasi']].head(10).to_string(index=False))
    else:
        print("Tidak ada gunung yang lolos filter preferensi.")
    print("\n===== ANALISIS DISTRIBUSI KATEGORI REKOMENDASI JALUR =====")
    if not rekomendasi_jalur.empty:
        distribusi_jalur = rekomendasi_jalur['kategori_rekomendasi'].value_counts()
        for kategori, jumlah in distribusi_jalur.items():
            persentase = (jumlah / len(rekomendasi_jalur)) * 100
            print(f"  • {kategori}: {jumlah} jalur ({persentase:.1f}%)")
        print("\nStatistik skor jalur tertinggi:")
        print(rekomendasi_jalur[['nama_jalur','nama_gunung','skor_rekomendasi','kategori_rekomendasi']].head(10).to_string(index=False))
    else:
        print("Tidak ada jalur yang lolos filter preferensi.")
    print("\nTotal gunung: ", len(rekomendasi_gunung))
    print("Total jalur: ", len(rekomendasi_jalur))

if __name__ == "__main__":
    # Contoh preferensi longgar agar test pasti lolos
    preferensi = {
        "max_kesulitan_skala": 7,
        "min_keamanan_skala": 5,
        "max_estimasi_waktu_jam": 30,
        "min_ketersediaan_air": 4,
        "max_ketinggian_mdpl": 4000
    }
    print("Preferensi untuk analisis distribusi:", preferensi)
    analisis_distribusi(preferensi)
    print("\nAnalisis tanpa filter preferensi:")
    analisis_distribusi(None)
