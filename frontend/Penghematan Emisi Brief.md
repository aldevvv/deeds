# Menu Penghematan Emisi — Brief (Front‑Only, Tabel Informasi)

> **Tujuan:** Menyediakan **menu informatif** di website untuk menampilkan penghematan emisi karbon dari digitalisasi dokumen (paperless). **Tanpa backend**: data diisi manual via form/CSV dan dihitung di **client‑side** (opsional). Rumus disertakan agar AI agent dapat membuat logika perhitungan di front‑end (JS/TS) atau spreadsheet.

---

## 1) Ringkasan Fitur

* **Tabel periodik** (harian/mingguan/bulanan/tahunan) berisi dokumen, halaman, dan penghematan emisi (KgCO₂e).
* **Kartu ringkasan**: total halaman, total KgCO₂e dihemat, (opsional) konversi pohon.
* **Input manual** (form) & **unggah CSV** (opsional) → diolah langsung di browser.
* **Faktor emisi** dapat **diubah** (default dari contoh slide).
* **Ekspor** CSV/PDF (opsional) & **sort/filter** tabel.

> **Catatan:** Karena ini front‑only, semua perhitungan dilakukan di sisi klien (JavaScript). Tidak ada penyimpanan server. Jika perlu persist, gunakan `localStorage`/`IndexedDB` atau ekspor file.

---

## 2) Struktur Tabel (UI di Website)

| Periode  | Dokumen (n) | Halaman (n) | Metode | Faktor (lihat §4) | Penghematan Emisi (KgCO₂e) | Catatan         |
| -------- | ----------: | ----------: | ------ | ----------------: | -------------------------: | --------------- |
| Jan 2025 |          20 |       2.000 | SIMPLE |      0,144 Kg/hal |                     288,00 | Contoh baseline |
| Feb 2025 |          15 |       1.500 | SIMPLE |      0,144 Kg/hal |                     216,00 | Input manual    |

**Kartu Ringkasan:**

* **Total Halaman Dihemat**
* **Total Emisi Dihemat (KgCO₂e)**
* (Opsional) **Estimasi Pohon**
* (Opsional) **Capaian Target (%)**

---

## 3) Input Data

* **Form** minimal: `periode`, `dokumen`, `halaman`, `metode`, `faktor`, `catatan`.
* **CSV (opsional)**: kolom `date/docPeriod, documents, pages, method, factorPerPageKg, notes`.
* **Validasi:** angka ≥ 0; `pages ≥ documents` ketika `avgPages` digunakan.

> Jika hanya tahu `dokumen` & **rata‑rata halaman/dok**, sediakan field `avgPages` → `pages = documents × avgPages`.

---

## 4) Rumus Perhitungan

### 4.1 Metode **SIMPLE_PER_PAGE** (default)

**Baseline dari slide:** 2.000 halaman → **288 KgCO₂e** → `factorPerPageKg = 288/2000 = 0,144 (KgCO₂e/halaman)`

**Rumus:**

```
EmissionSavedKg = TotalPages × factorPerPageKg
```

**Contoh uji (harus match slide):** `2.000 × 0,144 = 288 KgCO₂e` ✅

**Implementasi (JS/TS):**

```ts
function calcSimple(totalPages: number, factorPerPageKg = 0.144) {
  return +(totalPages * factorPerPageKg).toFixed(2);
}
```

**Spreadsheet:** `=ROUND(Pages * 0.144, 2)`

---

### 4.2 Metode **MASS_BASED** (opsional, transparansi faktor)

Gunakan bila ingin memisahkan komponen produksi kertas, proses cetak, dan limbah dihindari. Semua faktor **opsional & dapat diubah**.

**Parameter:**

* `sheetWeightGram` (default **5,0 g/lembar** ≈ A4 80gsm)
* `factorPaperProductionKgPerKg` (KgCO₂e/Kg kertas)
* `factorPrintingKgPerPage` (KgCO₂e/hal)
* `factorWasteAvoidedKgPerKg` (KgCO₂e/Kg kertas)

**Langkah & Rumus:**

1. Berat kertas dihindari:

```
PaperWeightKg = (TotalPages × sheetWeightGram) / 1000
```

2. Komponen emisi:

```
E_paper = PaperWeightKg × factorPaperProductionKgPerKg
E_print = TotalPages × factorPrintingKgPerPage
E_waste = PaperWeightKg × factorWasteAvoidedKgPerKg
```

3. Total penghematan:

```
EmissionSavedKg = E_paper + E_print + E_waste
```

**Implementasi (JS/TS):**

```ts
interface MassBasedArgs {
  pages: number;
  sheetWeightGram?: number; // default 5
  factorPaperProductionKgPerKg?: number; // opsional
  factorPrintingKgPerPage?: number;       // opsional
  factorWasteAvoidedKgPerKg?: number;     // opsional
}

function calcMass({
  pages,
  sheetWeightGram = 5,
  factorPaperProductionKgPerKg = 0,
  factorPrintingKgPerPage = 0,
  factorWasteAvoidedKgPerKg = 0,
}: MassBasedArgs) {
  const paperWeightKg = (pages * sheetWeightGram) / 1000;
  const E_paper = paperWeightKg * factorPaperProductionKgPerKg;
  const E_print = pages * factorPrintingKgPerPage;
  const E_waste = paperWeightKg * factorWasteAvoidedKgPerKg;
  return {
    paperWeightKg: +paperWeightKg.toFixed(3),
    components: {
      paper: +E_paper.toFixed(2),
      print: +E_print.toFixed(2),
      waste: +E_waste.toFixed(2),
    },
    emissionSavedKg: +(E_paper + E_print + E_waste).toFixed(2),
  };
}
```

**Contoh sanity‑check:**

* `pages = 500`, `sheetWeightGram = 5` → `paperWeightKg = 2,5 Kg`
* Misal faktor: `1,00` (paper), `0,002` (print), `0,20` (waste) →

  * `E_paper = 2,5 × 1,00 = 2,50`
  * `E_print = 500 × 0,002 = 1,00`
  * `E_waste = 2,5 × 0,20 = 0,50`
  * **Total = 4,00 KgCO₂e**

---

## 5) Konfigurasi (Client‑Side)

* **Metode default**: `SIMPLE_PER_PAGE`.
* **Faktor SIMPLE**: `factorPerPageKg` default **0,144** (bisa diubah di UI).
* **Faktor MASS_BASED**: `sheetWeightGram` default 5 g/lembar; tiga faktor lainnya default 0 (nonaktif) hingga admin mengisi.
* **Konversi pohon (opsional)**: `TreesSaved = EmissionSavedKg / factorKgPerTree` (biarkan `factorKgPerTree` dapat diisi admin; default kosong).
* **Riwayat faktor**: tampilkan di modal/info (opsional) agar transparan.

---

## 6) UX & Interaksi

* **Header:** "Penghematan Emisi (Paperless)"
* **Subheader:** "Estimasi pengurangan jejak karbon dari digitalisasi dokumen."
* **Toolbar:** Filter periode, tombol tambah baris, unggah CSV, ekspor CSV/PDF.
* **Tabel:** sort kolom, pencarian teks, pagination/virtualized list untuk ≥10k baris.
* **Tooltip faktor:** jelaskan bahwa faktor dapat dikalibrasi.
* **Empty state:** "Belum ada data. Tambahkan baris atau unggah CSV."

---

## 7) CSV Template (opsional)

```
docPeriod,documents,pages,method,factorPerPageKg,notes
2025-01,20,2000,SIMPLE,0.144,Contoh baseline slide
2025-02,15,1500,SIMPLE,0.144,Input manual
```

---

## 8) Quality Checks (Skenario Uji)

1. **Match baseline slide:** `20 dokumen × 100 halaman = 2.000` → SIMPLE `0,144` ⇒ **288,00 KgCO₂e**.
2. **MASS sanity:** lihat contoh §4.2 (hasil **4,00 KgCO₂e**) agar konsisten.
3. **Validasi:** faktor negatif ditolak; halaman kosong = 0; pembulatan 2 desimal.
4. **Performa:** 10.000 baris CSV tetap lancar (virtualization aktif).

---

## 9) Catatan Implementasi (Front‑Only)

* Semua state disimpan di memori; gunakan `localStorage` untuk menyimpan konfigurasi faktor & baris tabel.
* Gunakan **Intl.NumberFormat** untuk format angka lokal (ID): `1.234,56`.
* Hindari dependensi berat; gunakan tabel ringan (shadcn Table + virtualization) jika perlu.

---

## 10) Copy Siap Pakai

* **Judul:** Penghematan Emisi (Paperless)
* **Subjudul:** Estimasi pengurangan jejak karbon melalui digitalisasi dokumen.
* **Catatan bawah:** Nilai adalah estimasi dan dapat dikalibrasi sesuai kebijakan organisasi.

---

### Ringkas Rumus Kunci

* **SIMPLE:** `KgCO₂e = Halaman × 0,144`
* **MASS:** `KgCO₂e = (KgKertas × fp) + (Halaman × fp_print) + (KgKertas × fp_waste)`

  * dengan `KgKertas = Halaman × 5 g ÷ 1000`

> **Siap tempel:** brief ini dapat langsung dipakai AI agent untuk membuat komponen tabel informatif (tanpa backend) plus opsi perhitungan di client‑side.# Menu Penghematan Emisi — Brief (Front‑Only, Tabel Informasi)

> **Tujuan:** Menyediakan **menu informatif** di website untuk menampilkan penghematan emisi karbon dari digitalisasi dokumen (paperless). **Tanpa backend**: data diisi manual via form/CSV dan dihitung di **client‑side** (opsional). Rumus disertakan agar AI agent dapat membuat logika perhitungan di front‑end (JS/TS) atau spreadsheet.

---

## 1) Ringkasan Fitur

* **Tabel periodik** (harian/mingguan/bulanan/tahunan) berisi dokumen, halaman, dan penghematan emisi (KgCO₂e).
* **Kartu ringkasan**: total halaman, total KgCO₂e dihemat, (opsional) konversi pohon.
* **Input manual** (form) & **unggah CSV** (opsional) → diolah langsung di browser.
* **Faktor emisi** dapat **diubah** (default dari contoh slide).
* **Ekspor** CSV/PDF (opsional) & **sort/filter** tabel.

> **Catatan:** Karena ini front‑only, semua perhitungan dilakukan di sisi klien (JavaScript). Tidak ada penyimpanan server. Jika perlu persist, gunakan `localStorage`/`IndexedDB` atau ekspor file.

---

## 2) Struktur Tabel (UI di Website)

| Periode  | Dokumen (n) | Halaman (n) | Metode | Faktor (lihat §4) | Penghematan Emisi (KgCO₂e) | Catatan         |
| -------- | ----------: | ----------: | ------ | ----------------: | -------------------------: | --------------- |
| Jan 2025 |          20 |       2.000 | SIMPLE |      0,144 Kg/hal |                     288,00 | Contoh baseline |
| Feb 2025 |          15 |       1.500 | SIMPLE |      0,144 Kg/hal |                     216,00 | Input manual    |

**Kartu Ringkasan:**

* **Total Halaman Dihemat**
* **Total Emisi Dihemat (KgCO₂e)**
* (Opsional) **Estimasi Pohon**
* (Opsional) **Capaian Target (%)**

---

## 3) Input Data

* **Form** minimal: `periode`, `dokumen`, `halaman`, `metode`, `faktor`, `catatan`.
* **CSV (opsional)**: kolom `date/docPeriod, documents, pages, method, factorPerPageKg, notes`.
* **Validasi:** angka ≥ 0; `pages ≥ documents` ketika `avgPages` digunakan.

> Jika hanya tahu `dokumen` & **rata‑rata halaman/dok**, sediakan field `avgPages` → `pages = documents × avgPages`.

---

## 4) Rumus Perhitungan

### 4.1 Metode **SIMPLE_PER_PAGE** (default)

**Baseline dari slide:** 2.000 halaman → **288 KgCO₂e** → `factorPerPageKg = 288/2000 = 0,144 (KgCO₂e/halaman)`

**Rumus:**

```
EmissionSavedKg = TotalPages × factorPerPageKg
```

**Contoh uji (harus match slide):** `2.000 × 0,144 = 288 KgCO₂e` ✅

**Implementasi (JS/TS):**

```ts
function calcSimple(totalPages: number, factorPerPageKg = 0.144) {
  return +(totalPages * factorPerPageKg).toFixed(2);
}
```

**Spreadsheet:** `=ROUND(Pages * 0.144, 2)`

---

### 4.2 Metode **MASS_BASED** (opsional, transparansi faktor)

Gunakan bila ingin memisahkan komponen produksi kertas, proses cetak, dan limbah dihindari. Semua faktor **opsional & dapat diubah**.

**Parameter:**

* `sheetWeightGram` (default **5,0 g/lembar** ≈ A4 80gsm)
* `factorPaperProductionKgPerKg` (KgCO₂e/Kg kertas)
* `factorPrintingKgPerPage` (KgCO₂e/hal)
* `factorWasteAvoidedKgPerKg` (KgCO₂e/Kg kertas)

**Langkah & Rumus:**

1. Berat kertas dihindari:

```
PaperWeightKg = (TotalPages × sheetWeightGram) / 1000
```

2. Komponen emisi:

```
E_paper = PaperWeightKg × factorPaperProductionKgPerKg
E_print = TotalPages × factorPrintingKgPerPage
E_waste = PaperWeightKg × factorWasteAvoidedKgPerKg
```

3. Total penghematan:

```
EmissionSavedKg = E_paper + E_print + E_waste
```

**Implementasi (JS/TS):**

```ts
interface MassBasedArgs {
  pages: number;
  sheetWeightGram?: number; // default 5
  factorPaperProductionKgPerKg?: number; // opsional
  factorPrintingKgPerPage?: number;       // opsional
  factorWasteAvoidedKgPerKg?: number;     // opsional
}

function calcMass({
  pages,
  sheetWeightGram = 5,
  factorPaperProductionKgPerKg = 0,
  factorPrintingKgPerPage = 0,
  factorWasteAvoidedKgPerKg = 0,
}: MassBasedArgs) {
  const paperWeightKg = (pages * sheetWeightGram) / 1000;
  const E_paper = paperWeightKg * factorPaperProductionKgPerKg;
  const E_print = pages * factorPrintingKgPerPage;
  const E_waste = paperWeightKg * factorWasteAvoidedKgPerKg;
  return {
    paperWeightKg: +paperWeightKg.toFixed(3),
    components: {
      paper: +E_paper.toFixed(2),
      print: +E_print.toFixed(2),
      waste: +E_waste.toFixed(2),
    },
    emissionSavedKg: +(E_paper + E_print + E_waste).toFixed(2),
  };
}
```

**Contoh sanity‑check:**

* `pages = 500`, `sheetWeightGram = 5` → `paperWeightKg = 2,5 Kg`
* Misal faktor: `1,00` (paper), `0,002` (print), `0,20` (waste) →

  * `E_paper = 2,5 × 1,00 = 2,50`
  * `E_print = 500 × 0,002 = 1,00`
  * `E_waste = 2,5 × 0,20 = 0,50`
  * **Total = 4,00 KgCO₂e**

---

## 5) Konfigurasi (Client‑Side)

* **Metode default**: `SIMPLE_PER_PAGE`.
* **Faktor SIMPLE**: `factorPerPageKg` default **0,144** (bisa diubah di UI).
* **Faktor MASS_BASED**: `sheetWeightGram` default 5 g/lembar; tiga faktor lainnya default 0 (nonaktif) hingga admin mengisi.
* **Konversi pohon (opsional)**: `TreesSaved = EmissionSavedKg / factorKgPerTree` (biarkan `factorKgPerTree` dapat diisi admin; default kosong).
* **Riwayat faktor**: tampilkan di modal/info (opsional) agar transparan.

---

## 6) UX & Interaksi

* **Header:** "Penghematan Emisi (Paperless)"
* **Subheader:** "Estimasi pengurangan jejak karbon dari digitalisasi dokumen."
* **Toolbar:** Filter periode, tombol tambah baris, unggah CSV, ekspor CSV/PDF.
* **Tabel:** sort kolom, pencarian teks, pagination/virtualized list untuk ≥10k baris.
* **Tooltip faktor:** jelaskan bahwa faktor dapat dikalibrasi.
* **Empty state:** "Belum ada data. Tambahkan baris atau unggah CSV."

---

## 7) CSV Template (opsional)

```
docPeriod,documents,pages,method,factorPerPageKg,notes
2025-01,20,2000,SIMPLE,0.144,Contoh baseline slide
2025-02,15,1500,SIMPLE,0.144,Input manual
```

---

## 8) Quality Checks (Skenario Uji)

1. **Match baseline slide:** `20 dokumen × 100 halaman = 2.000` → SIMPLE `0,144` ⇒ **288,00 KgCO₂e**.
2. **MASS sanity:** lihat contoh §4.2 (hasil **4,00 KgCO₂e**) agar konsisten.
3. **Validasi:** faktor negatif ditolak; halaman kosong = 0; pembulatan 2 desimal.
4. **Performa:** 10.000 baris CSV tetap lancar (virtualization aktif).

---

## 9) Catatan Implementasi (Front‑Only)

* Semua state disimpan di memori; gunakan `localStorage` untuk menyimpan konfigurasi faktor & baris tabel.
* Gunakan **Intl.NumberFormat** untuk format angka lokal (ID): `1.234,56`.
* Hindari dependensi berat; gunakan tabel ringan (shadcn Table + virtualization) jika perlu.

---

## 10) Copy Siap Pakai

* **Judul:** Penghematan Emisi (Paperless)
* **Subjudul:** Estimasi pengurangan jejak karbon melalui digitalisasi dokumen.
* **Catatan bawah:** Nilai adalah estimasi dan dapat dikalibrasi sesuai kebijakan organisasi.

---

### Ringkas Rumus Kunci

* **SIMPLE:** `KgCO₂e = Halaman × 0,144`
* **MASS:** `KgCO₂e = (KgKertas × fp) + (Halaman × fp_print) + (KgKertas × fp_waste)`

  * dengan `KgKertas = Halaman × 5 g ÷ 1000`

> **Siap tempel:** brief ini dapat langsung dipakai AI agent untuk membuat komponen tabel informatif (tanpa backend) plus opsi perhitungan di client‑side.
