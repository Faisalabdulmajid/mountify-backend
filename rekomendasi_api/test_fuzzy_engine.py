import pytest
import pandas as pd
from fuzzy_engine import proses_rekomendasi, get_data_jalur_from_database

# Test dengan data asli dari database, bukan mock
def test_proses_rekomendasi_default():
    df = get_data_jalur_from_database()
    result = proses_rekomendasi(df)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    assert not rekomendasi_gunung.empty
    assert not rekomendasi_jalur.empty
    # Skor rekomendasi harus berada di rentang 0-100
    assert rekomendasi_jalur['skor_rekomendasi'].between(0, 100).all()

def test_proses_rekomendasi_with_preference():
    df = get_data_jalur_from_database()
    preferensi = {
        "max_kesulitan_skala": 5,
        "min_keamanan_skala": 7,
        "max_estimasi_waktu_jam": 20,
        "min_ketersediaan_air": 6,
        "max_ketinggian_mdpl": 3000
    }
    result = proses_rekomendasi(df, preferensi)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    assert not rekomendasi_gunung.empty
    assert not rekomendasi_jalur.empty
    # Semua jalur hasil filter harus sesuai preferensi
    if not rekomendasi_jalur.empty:
        assert (rekomendasi_jalur['kesulitan_skala'] <= 5).all()
        assert (rekomendasi_jalur['keamanan_skala'] >= 7).all()
        assert (rekomendasi_jalur['estimasi_waktu_jam'] <= 20).all()
        assert (rekomendasi_jalur['ketersediaan_sumber_air_skala'] >= 6).all()
        assert (rekomendasi_jalur['ketinggian_puncak_mdpl'] <= 3000).all()

# Test 3: Preferensi pemandangan tinggi, waktu panjang
def test_rekomendasi_pemandangan_tinggi():
    df = get_data_jalur_from_database()
    preferensi = {
        "min_keindahan_pemandangan_skala": 8,
        "max_estimasi_waktu_jam": 30
    }
    result = proses_rekomendasi(df, preferensi)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    assert not rekomendasi_gunung.empty
    assert not rekomendasi_jalur.empty
    if not rekomendasi_jalur.empty:
        assert (rekomendasi_jalur['keindahan_pemandangan_skala'] >= 8).all()
        assert (rekomendasi_jalur['estimasi_waktu_jam'] <= 30).all()

# Test 4: Preferensi jalur sulit, keamanan sedang
def test_rekomendasi_jalur_sulit():
    df = get_data_jalur_from_database()
    preferensi = {
        "min_kesulitan_skala": 7,
        "min_keamanan_skala": 5
    }
    result = proses_rekomendasi(df, preferensi)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    assert not rekomendasi_gunung.empty
    assert not rekomendasi_jalur.empty
    if not rekomendasi_jalur.empty:
        assert (rekomendasi_jalur['kesulitan_skala'] >= 7).all()
        assert (rekomendasi_jalur['keamanan_skala'] >= 5).all()

# Test 5: Preferensi air melimpah, fasilitas lengkap
def test_rekomendasi_air_fasilitas():
    df = get_data_jalur_from_database()
    preferensi = {
        "min_ketersediaan_air": 8,
        "min_kualitas_fasilitas_skala": 8
    }
    result = proses_rekomendasi(df, preferensi)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    assert not rekomendasi_gunung.empty
    assert not rekomendasi_jalur.empty
    if not rekomendasi_jalur.empty:
        assert (rekomendasi_jalur['ketersediaan_sumber_air_skala'] >= 8).all()
        assert (rekomendasi_jalur['kualitas_fasilitas_skala'] >= 8).all()

# Test 6: Preferensi komunikasi baik, insiden rendah
def test_rekomendasi_komunikasi_insiden():
    df = get_data_jalur_from_database()
    preferensi = {
        "min_jaringan_komunikasi": 8,
        "min_tingkat_keamanan_insiden": 8
    }
    result = proses_rekomendasi(df, preferensi)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    assert not rekomendasi_gunung.empty
    assert not rekomendasi_jalur.empty
    if not rekomendasi_jalur.empty:
        assert (rekomendasi_jalur['jaringan_komunikasi_skala'] >= 8).all()
        assert (rekomendasi_jalur['tingkat_insiden_skala'] >= 8).all()

# Test 7: Preferensi variasi lanskap tinggi, perlindungan angin tinggi
def test_rekomendasi_lanskap_angin():
    df = get_data_jalur_from_database()
    preferensi = {
        "min_variasi_lanskap": 8,
        "min_perlindungan_angin": 8
    }
    result = proses_rekomendasi(df, preferensi)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    assert not rekomendasi_gunung.empty
    assert not rekomendasi_jalur.empty
    if not rekomendasi_jalur.empty:
        assert (rekomendasi_jalur['variasi_lanskap_skala'] >= 8).all()
        assert (rekomendasi_jalur['perlindungan_angin_kemah_skala'] >= 8).all()

# Test 8: Preferensi ketinggian rendah, waktu pendek
def test_rekomendasi_ketinggian_waktu():
    df = get_data_jalur_from_database()
    preferensi = {
        "max_ketinggian_mdpl": 2500,
        "max_estimasi_waktu_jam": 10
    }
    result = proses_rekomendasi(df, preferensi)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    assert not rekomendasi_gunung.empty
    assert not rekomendasi_jalur.empty
    if not rekomendasi_jalur.empty:
        assert (rekomendasi_jalur['ketinggian_puncak_mdpl'] <= 2500).all()
        assert (rekomendasi_jalur['estimasi_waktu_jam'] <= 10).all()

# Test 9: Preferensi kemah baik, jalur bervariasi
def test_rekomendasi_kemah_variasi():
    df = get_data_jalur_from_database()
    preferensi = {
        "min_kualitas_kemah_skala": 8,
        "min_variasi_jalur_skala": 8
    }
    result = proses_rekomendasi(df, preferensi)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    assert not rekomendasi_gunung.empty
    assert not rekomendasi_jalur.empty
    if not rekomendasi_jalur.empty:
        assert (rekomendasi_jalur['kualitas_kemah_skala'] >= 8).all()
        assert (rekomendasi_jalur['variasi_jalur_skala'] >= 8).all()

# Test 10: Preferensi kombinasi ekstrem (semua tinggi)
def test_rekomendasi_kombinasi_ekstrem():
    df = get_data_jalur_from_database()
    preferensi = {
        "min_keamanan_skala": 9,
        "min_ketersediaan_air": 9,
        "min_kualitas_fasilitas_skala": 9,
        "min_kualitas_kemah_skala": 9,
        "min_keindahan_pemandangan_skala": 9,
        "min_variasi_lanskap": 9,
        "min_perlindungan_angin": 9,
        "min_jaringan_komunikasi": 9,
        "min_tingkat_keamanan_insiden": 9,
        "min_variasi_jalur_skala": 9
    }
    result = proses_rekomendasi(df, preferensi)
    assert result is not None
    rekomendasi_gunung, rekomendasi_jalur = result
    # Boleh kosong jika filter terlalu ketat, tapi tidak error
    assert rekomendasi_gunung is not None
    assert rekomendasi_jalur is not None
