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
