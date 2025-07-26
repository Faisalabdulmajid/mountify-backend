import pandas as pd
from fuzzy_engine import proses_rekomendasi

# Load data ground truth
csv_path = r"D:/Skripsi/sistem_rekomendasi_gunung/dbgunung.csv"  # Path absolut agar pasti terbaca

df = pd.read_csv(csv_path)

# Jalankan fuzzy engine tanpa filter
_, rekomendasi_jalur = proses_rekomendasi(df, None)

# Mapping kategori ke label prediksi (1 = direkomendasikan, 0 = tidak)
def kategori_ke_label(kat):
    return 1 if kat in ["Direkomendasikan", "Sangat Direkomendasikan"] else 0

# Pastikan urutan id_jalur sama
rekomendasi_jalur = rekomendasi_jalur.set_index("id_jalur").sort_index()
df = df.set_index("id_jalur").sort_index()

rekomendasi_jalur["prediksi"] = rekomendasi_jalur["kategori_rekomendasi"].apply(kategori_ke_label)
benar = (rekomendasi_jalur["prediksi"] == df["ground_truth_label"]).sum()
total = len(df)
akurasi = benar / total if total > 0 else 0

print(f"Akurasi Fuzzy Engine: {akurasi:.2%} ({benar} dari {total} data)")

# (Opsional) Tampilkan confusion matrix
from sklearn.metrics import confusion_matrix, classification_report
print("\nConfusion Matrix:")
print(confusion_matrix(df["ground_truth_label"], rekomendasi_jalur["prediksi"]))
print("\nClassification Report:")
print(classification_report(df["ground_truth_label"], rekomendasi_jalur["prediksi"]))
