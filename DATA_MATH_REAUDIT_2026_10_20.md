# Audit ulang data dan matematika — 20 Oktober 2026 WIB

Audit ini dijalankan ulang pada sekitar 02:42–02:51 WIB. Kesimpulannya: tidak ditemukan selisih rumus pada cakupan perhitungan yang diuji secara independen. Ada perbaikan batas tanggal grafik dan pemeriksaan tanggal rilis. Data provider tidak seluruhnya identik ketika diminta ulang, dan bukti primer laporan keuangan belum lengkap. Karena itu laporan ini **tidak menyatakan semua angka terverifikasi 100% ke sumber primer**.

## Perbaikan yang diterapkan

1. Rentang tahun pada grafik pasar sebelumnya dapat menggeser ulang tahun 29 Februari menjadi 1 Maret di tahun nonkabisat. Batasnya sekarang 28 Februari. Grafik konteks makro diperbaiki dengan aturan yang sama. Observasi sumber tidak diubah.
2. Kuadran sekarang menolak tanggal rilis yang tidak dapat diuraikan, termasuk tanggal rilis observasi sebelumnya yang berada di masa depan. Ini menambah perlindungan di atas validator feed; tidak ditemukan catatan terbitan saat ini yang terkena celah tersebut.
3. Keterangan kuadran sebelumnya memakai tanggal tampilan dalam frasa “Checked against connected data as of”. Keterangan sekarang membedakan tanggal tampilan dari tanggal akuisisi/peninjauan sumber. Membuka halaman tidak dianggap verifikasi sumber baru.

## Data yang dicocokkan ulang

| Cakupan | Pemeriksaan aktual | Hasil dan batas |
|---|---|---|
| Semua 1.552 histori saham/ETF | 1.772.266 observasi selesai, 10.633.596 nilai: raw close, adjusted close, open, high, low, volume | Identitas, harga mentah, OHLC dan volume cocok dalam toleransi. Adjusted close memiliki selisih kecil yang dicatat di bawah. |
| 51 seri pasar panjang | 241.357 observasi historis tertutup dari 19 ETF obligasi, 27 komoditas/provider series, dan 5 indeks | Cocok dengan permintaan ulang Yahoo pada tanggal yang dibandingkan. Bar tanggal bursa berjalan dikecualikan. |
| Treasury | 21 CSV tahunan, 5.002 tanggal, 14 tenor | 58.434 angka dan 11.594 sel kosong cocok. Total 70.028 sel tidak berarti seluruhnya berisi angka. |
| Konteks makro | 293 seri, 68.987 observasi, 313 acara kalender BLS | Proyeksi sumber independen dan aritmetika likuiditas/spread cocok; tiga seri tanpa angka tetap kosong. |
| Rilis makro | 124 seri, 21.574 observasi | Cocok dengan sumber/proyeksi independen. Lima seri berstatus reviewed dibandingkan dengan file tinjauan tersimpan, bukan diklaim diperoleh otomatis dari situs resmi. Delapan seri tanpa angka tetap kosong. |
| Makro tambahan | 123 seri, 43.436 observasi | Audit Python terpisah cocok dengan sumber yang diambil ulang. |
| Makro dasar dan FX | 20 seri makro, 272 observasi; dua seri FX, 5.216 observasi | Proyeksi Python independen cocok. Dua seri BPS dasar dibandingkan dengan file tinjauan; empat angka kuadran juga diperiksa melalui sumber resmi web secara terpisah. |
| Katalog dan skema publik | 8.610 kutipan valid dari 8.630 entri; 1.552 file histori, 1.523 layak model | Lolos pemeriksaan identitas, mata uang, tanggal, struktur dan normalisasi. Ini berbeda dari verifikasi setiap fundamental ke laporan perusahaan. |

**Adjusted close tidak identik.** Pada permintaan ulang seluruh histori saham/ETF, 488.811 nilai adjusted close berbeda dari snapshot tersimpan. Selisih terbesar yang diukur, dibagi `max(1, abs(harga tersimpan))`, adalah `0.0000012239070268689462`: sekitar **0,0001224% atau 0,01224 basis poin**. Seluruhnya di bawah ambang audit `1e-5` pada skala tersebut. Harga mentah/OHLC/volume diperiksa dengan toleransi lebih ketat `1e-8` relatif atau absolut. Penyebab selisih adjusted close tidak dibuktikan oleh audit ini; tidak diasumsikan sebagai pemalsuan maupun dinyatakan identik. Snapshot dan studi tersimpan tidak ditimpa untuk menyembunyikan selisih.

Histori saham yang belum selesai atau berada pada tanggal bursa berjalan tidak dibandingkan sebagai bar final. Audit historis tidak menyatakan harga intraday masih sama saat laporan dibaca.

## Perhitungan independen

Python menghitung ulang dari input tersimpan; hasil aplikasi JavaScript menjadi keluaran yang dibandingkan, bukan sumber rumus Python.

| Cakupan | Hasil |
|---|---|
| Seluruh 8.348 valuasi otomatis yang memiliki harga | P/E, earnings yield, P/B, pertumbuhan, target EPS/harga, harga masuk terdiskonto, CAGR, dan tiga skenario cocok. |
| Seluruh 23 valuasi FCFE yang tersedia | FCFE per saham, diskonto arus kas, terminal tahun N+1, nilai sekarang terminal dan proporsi terminal cocok. |
| Seluruh 8.604 perubahan harga yang tersedia | Harga acuan, selisih absolut dan persentase cocok. Angka perubahan yang tidak tersedia tidak diciptakan. |
| 1.377 jendela grafik | Semua 51 seri × 9 rentang × 3 frekuensi cocok dengan kalender Python dan pemilihan penutupan aktual terakhir per minggu/bulan. |
| Total audit Decimal/kalender di atas | 365.915 pemeriksaan, tanpa kegagalan; toleransi `1e-9` relatif atau absolut, presisi Decimal 42 digit pada valuasi. |
| Quant pada histori publik AAPL, BBCA, BND | 102 pemeriksaan Python: volatilitas sampel, drawdown, VaR/ES, rolling/EWMA, prakiraan akhir AR1 dan Ridge dengan solver Cholesky terpisah, aritmetika skor dan kematangan label. Sampel ini bukan refit seluruh instrumen/model. |
| Model lanjutan | 39 pemeriksaan NumPy pada fixture sintetis berlabel: fitur, OLS/Ridge, KNN, GARCH, VaR/ES dan skor. Fixture bukan data pasar. |
| Studi Atlas tersimpan | 12.688 pemeriksaan independen pada 14 aset: sumber return, skor, urutan waktu, risiko, kovarians dan replay setelah biaya. Bukan fitting ulang semua model. |
| Kalkulator Atlas | 20 tes Python: unit saham/ADR, EPS, diskonto/terminal, dividen/IRR, dilusi, kurs, bobot dan biaya. |
| Kalkulator riset | 21 pemeriksaan Python pada 17 kasus: opsi, diskonto arus kas, pemulihan yield dan benchmark sumber. |
| Proyeksi cash flow | Empat tes Python: tanda capex, net borrowing wajib tersedia dan periode saham harus sama. |

Dua analisis tersimpan di lingkungan utama dan 140 di lingkungan uji juga dibaca tanpa penulisan dan lolos validator analisis saat ini. Itu pemeriksaan kompatibilitas, bukan perhitungan Python independen baru atas seluruh analisis tersebut.

## Arti ekonomi dan rumus

| Ukuran | Definisi yang diperiksa |
|---|---|
| Perubahan harga | `(harga / harga acuan − 1) × 100`. Acuan nonpositif pada futures menahan persentase; bukan membagi dengan nol. |
| Perubahan laju GDP/CPI | Laju YoY terbaru dikurangi laju YoY periode sebelumnya, dalam **poin persentase**. Bukan pertumbuhan level GDP bulanan atau inflasi MoM. |
| YoY dari level | `100 × (level periode ini / level periode sama tahun sebelumnya − 1)`. Penyesuaian musiman dan sumber tetap diberi label. |
| Spread Treasury | `(yield 10 tahun − yield 2 tahun) × 100` basis poin, karena yield sumber dalam persen. |
| FCFE per saham | `(CFO + capex bertanda negatif + net borrowing) / diluted average shares` dari periode tahunan sama. |
| DCF ekuitas | `Σ FCFE_t / (1+k_e)^t + [FCFE_N × (1+g)/(k_e−g)] / (1+k_e)^N`, dengan `k_e > g`. FCFE didiskontokan pada biaya ekuitas; utang tidak dikurangkan lagi seperti model enterprise value. |
| CAGR harga | `(harga terminal / harga awal)^(1/N) − 1`. Dividen tidak diam-diam dimasukkan ke CAGR harga. |
| Risiko historis | Return log; volatilitas sampel × `sqrt(252)`; drawdown dari puncak; VaR persentil interpolasi atas kerugian sederhana, ES rata-rata kerugian pada/di atas ambang. Konvensi ini dinyatakan, bukan dianggap jaminan peluang masa depan. |
| Kurs | Return aset dan perubahan kurs digabung secara perkalian; persentasenya tidak sekadar dijumlahkan. Mata uang berbeda tidak otomatis digabung menjadi nilai portofolio. |

Discount rate 12%, terminal growth 2% dan stress pertumbuhan/P/E bawaan adalah **asumsi mekanis yang ditampilkan**, bukan hasil estimasi ekonomi perusahaan. Reference memakai pertumbuhan EPS datar dan P/E tersirat dari harga saat ini; keluaran tersebut bukan estimasi fair value independen. Bank tidak diberi DCF CFO generik. Data kurang lengkap, tidak seunit, tidak semata uang atau FCFE tidak layak menahan hasil terkait.

ETF obligasi menampilkan harga per saham, sedangkan Treasury menampilkan annual par yield. Futures/provider series dapat berganti kontrak; grafiknya bukan harga spot atau total return investasi. Nilai negatif WTI April 2020 dipertahankan. Unit US cents, USD dan EUR tidak disamakan.

## Kuadran Indonesia

- GDP YoY: Q1 2026 **5,61%**, Q2 **5,29%** → **−0,32 poin persentase**. Keduanya dikonfirmasi oleh [rilis BI untuk Q2](https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2815026.aspx).
- CPI YoY: Agustus **3,19%**, September **3,28%** → **+0,09 poin persentase**. Sumber: [BI Agustus](https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2817626.aspx) dan [BPS September](https://www.bps.go.id/id/pressrelease/2026/10/01/2623/inflasi-year-on-year--y-on-y--pada-september-2026-sebesar-3-28-persen-.html).
- Dengan definisi arah perubahan di aplikasi, hasilnya **Quad 3**. Ini pembacaan dua rilis dengan periode berbeda, bukan klasifikasi resmi BPS, estimasi satu kuartal yang sama, atau bukti resesi. Pertumbuhan GDP tetap positif.
- File reviewed masih bertanggal **16 Oktober 2026**; pembandingan web pada audit ini tidak diam-diam mengganti metadata tinjauan tersebut.

Dasar FCFE/diskonto juga diperiksa terhadap [materi FCFE Aswath Damodaran, NYU Stern](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/lectures/fcfe.html).

## Batas yang masih ada

- **8.368 fundamental bukan berarti 8.368 laporan perusahaan primer sudah diverifikasi.** 8.348 memiliki harga untuk hitung ulang, 3.671 memenuhi syarat P/E, dan 23 memenuhi syarat FCFE otomatis. Pemeriksaan aritmetika membuktikan hasil sesuai input, bukan kebenaran setiap input Yahoo terhadap laporan emiten.
- **Delapan bukti SEC masih berstatus HTTP 403**, tanpa fakta pengganti. Audit ini tidak menyebutnya terverifikasi.
- **20 kutipan harga tidak tersedia**, tiga seri konteks dan delapan seri rilis tidak memiliki angka. Ada 29 histori dengan data tidak cukup untuk model. Semuanya tetap dilabeli sesuai kondisinya.
- Tidak semua seri memiliki histori 20 tahun sejak awal perdagangan. Grafik memakai tanggal pertama sumber; periode kosong tidak direkayasa.
- Tidak ada audit yang membuktikan prakiraan, probabilitas simulasi atau nilai ekonomi masa depan pasti benar. Refitting independen Quant memakai tiga instrumen; model lanjutan diuji menggunakan fixture serta studi tersimpan, bukan semua kombinasi instrumen dan asumsi.

## Verifikasi aplikasi dan bukti yang dapat dijalankan ulang

- **566 tes Node lulus**, **7 tes API lokal lulus**.
- Suite browser menyelesaikan 118 pemeriksaan kuadran/histori panjang, 33 monitor langsung, 40 permukaan makro, serta assertion keterbacaan kuadran tanpa page error. Setelah perbaikan batas kalender makro terakhir, suite keterbacaan dan 33 pemeriksaan monitor diulang dan lulus.
- Build lokal berhasil: versi aset `280ec8d9e9ebaca5`, 1.552 file histori. `git diff --check` lulus. Tidak ada publikasi eksternal.

Perintah audit utama:

```text
node scripts/audit-workspace-data.mjs
node scripts/audit-stock-history-sources.mjs
node scripts/audit-long-market-sources.mjs
node scripts/audit-macro-context.mjs
node scripts/audit-macro-releases.mjs
python scripts/audit-macro-extended.py
.tools/yfinance/Scripts/python.exe scripts/audit-macro-fx.py
python scripts/audit-independent-finance.py
node scripts/audit-published-quant.mjs
python tests/atlas-parity.py -v
python tests/research-reference.py
python scripts/reference-advanced.py
python scripts/verify-atlas-reference.py
.tools/yfinance/Scripts/python.exe tests/valuation-cashflows.py
```

Receipt JSON ada di `validation/`: `workspace-data-audit.json`, `stock-history-source-audit.json`, `long-market-independent-source-audit.json`, `macro-context-source-audit.json`, `macro-regional-source-audit.json`, `macro-extended-source-audit.json`, `macro-fx-independent-audit.json`, `independent-finance-audit.json`, `published-quant-audit.json`. Receipt memuat timestamp, cakupan dan pengecualian; data publik maupun catatan pribadi tidak diubah oleh skrip audit sumber.
