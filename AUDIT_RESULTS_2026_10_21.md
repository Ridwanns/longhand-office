# Hasil audit Longhand Office — 21 Oktober 2026

Audit ini memisahkan pemeriksaan angka terhadap sumber dari pemeriksaan struktur, rumus, dan cakupan publikasi. Lolos audit tidak berarti seluruh instrumen memiliki data lengkap atau harga streaming dari bursa.

## Hasil yang sudah diperiksa

| Area | Pemeriksaan | Hasil |
|---|---|---|
| Macro Context, 46 ekonomi | 293 seri; 68.997 observasi dan aritmetika spread/liquidity | Cocok setelah snapshot lama diperbarui. Tiga seri agregat tanpa angka tetap ditandai kosong. |
| Rilis GDP/CPI regional | 125 seri; 21.604 observasi | Rekonsiliasi independen terhadap institusi sumber dan catatan tinjauan bertanggal lolos. |
| Policy/CPI/yield tambahan | 123 seri; 43.436 observasi | Rekonsiliasi Python independen lolos. |
| Macro dasar dan FX | 5.488 observasi | Cocok dengan sumber; hari FX yang belum selesai tidak masuk sejarah final. Catatan BPS manual mempertahankan tanggal review aslinya. |
| Indikator tambahan GEM | 1.328 observasi | YoY bulan yang sama tahun sebelumnya, konversi juta ke miliar USD, dan neraca perdagangan dari bulan yang cocok lolos. GEM retail belum menyediakan angka. |
| Sejarah indeks, ETF obligasi, komoditas dan energi | 51 instrumen; 241.372 penutupan hari selesai | Cocok dengan sumber Yahoo. Emas di sini adalah futures, bukan harga spot. Satuan kontrak dan mata uang dipertahankan. |
| Treasury | 21 berkas tahunan; 70.028 nilai tenor termasuk posisi kosong | Cocok dengan CSV US Treasury. Yield berbeda dari harga ETF obligasi. |
| Macro forecasting | 32.770 pemeriksaan independen, 12 kasus sumber | AR1, benchmark dengan target sama, kalibrasi error, band, dan batas cakupan lolos. Ini bukan bukti akurasi masa depan. |
| Model saham/ETF | 1.553 sejarah publik; 6.096 kombinasi raw/adjusted dan horizon 5/20 sesi | Seluruh kasus eligible pada publikasi 47f3eae lolos. Advanced publication: 16 instrumen lolos; ini tidak mengklaim semua ticker diuji ulang dengan seluruh model advanced. |
| Harga publik terbaru yang diaudit | 8.613 identitas; 8.590 mempunyai quote | Validasi kontrak dan 41.417 pemeriksaan tanggal/aritmetika independen lolos. Dua quote mempertahankan observasi sebelumnya; 23 tidak tersedia. Snapshot harga: 21 Oktober 2026, 04:57 WIB. |
| Pengujian aplikasi | 673 tes unit pada revisi lanjutan | Lolos; pemeriksaan browser meliputi navigasi, grafik, pembaruan harga, cakupan ETF, ukuran layar dan tema. |

Angka merupakan hasil audit bertanggal, bukan jumlah yang dijamin tetap pada publikasi berikutnya. Bukti numerik rinci disimpan di folder validation lokal; folder tersebut tidak dikirim ke website publik.

## Pemeriksaan sumber primer Indonesia

Delapan rilis Bank Indonesia dibuka kembali dan dibandingkan dengan catatan indikator: survei konsumen, retail, PMI-BI, kegiatan usaha Q2/Q3, uang beredar/kredit, cadangan devisa, dan komponen inflasi. Angka aktual dipisahkan dari ekspektasi survei. Contoh: [survei konsumen September](https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2821626.aspx), [cadangan devisa September](https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2821426.aspx), dan [M2 Agustus](https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2819526.aspx). Catatan review asli tetap bertanggal; membaca ulang berkas tidak memperbarui tanggal verifikasi data.

## Hal yang tetap terbatas

- Label ★★★ adalah prioritas editorial Office berdasarkan kategori berdampak tinggi, bukan rating acara berlisensi dari penyedia kalender. Data tahunan tetap diberi label sebagai latar belakang.
- WDI current account untuk Euro area/World dan reserves World tidak menyediakan angka pada snapshot ini. Tidak diganti dengan nol atau negara lain.
- Sejumlah warrants dan instrumen yang tidak memenuhi identitas saham/ETF tidak mempunyai quote yang diterima. Daftar lengkap ada dalam laporan aritmetika lokal; tidak dibuatkan harga substitusi.
- Katalog Pluang yang ditemukan berisi 211 fund; seluruhnya mempunyai harga dan sejarah pada publikasi yang diuji, 210 eligible untuk model. Keterbatasan pencarian penyedia membuat kelengkapan seluruh katalog Pluang tidak dapat disertifikasi.
- Publikasi fundamental yang diuji mempunyai 8.353 record: 8.330 berharga, 3.661 eligible earnings, dan 23 eligible FCFE/DCF; 1.193 perbedaan mata uang ditahan sesuai aturan. Ini validasi input/metode, bukan verifikasi manual seluruh laporan emiten terhadap dokumen aslinya.
- Quote Yahoo dan IDX tetap mempunyai tanggal, sesi, dan keterlambatan sumber. Pemeriksaan berkala tidak menjadi bukti real-time bursa. Histori model tidak otomatis diganti oleh quote intraday.
- Tidak ada data pribadi, portfolio, vault, atau transaksi pengguna yang dipakai sebagai data demonstrasi atau diunggah dalam audit.

## Perubahan pembaca audit

Pembaca CSV independen diperbaiki agar fingerprint RBA mempertahankan byte-order mark dan kolom berpetik tidak bergeser. Pemeriksaan FX hanya membandingkan hari historis yang sudah selesai; duplikasi bar hari berjalan tidak disalahartikan sebagai duplikasi sejarah final. Perubahan ini tidak mengganti angka sumber agar audit lolos.

## Perubahan tampilan

Jalur acak Monte Carlo dan distribusi terminal kini dua panel berbeda. Ada 120 jalur tampilan yang diulang dari seed asli, sementara statistik tetap memakai seluruh 5.000 draw advanced atau 1.000 draw core. Rekonsiliasi kedua mesin dan kedua horizon cocok persis dengan versi sebelum perubahan. Model yang dibuka dari arsip menampilkan identitas ticker sendiri.

Macro menampilkan maksimal enam prioritas per ekonomi; record lainnya dapat dicari tanpa memenuhi tampilan awal. Halaman saham mendahulukan watchlist, harga dan grafik. Penjelasan sumber, rincian katalog, sejarah exact dan hasil core tetap tersedia melalui detail yang dapat dibuka.


## Pemeriksaan lanjutan: duplikasi, hasil langsung terlihat, dan ruang kosong

Pengulangan kartu instrumen, navigasi alat, status selesai, dan tombol tesis diringkas. Arsip dikelompokkan per instrumen dengan semua versi asli tetap dapat dipilih. Forecast core 5/20 sesi ditampilkan langsung setelah penilaian model; grafik GDP/CPI juga langsung terlihat. Bukti annual SEC ditampilkan bila tersedia, sedangkan kegagalan sumber tetap terlihat sebagai tidak tersedia. Tidak ada nilai contoh yang diterbitkan sebagai fakta.

Grafik Monte Carlo tetap dipisahkan dari distribusi terminal. Pengukuran ulang saat panel dibuka memperbaiki kanvas yang sempat terlalu tinggi; identitas model tidak lagi mewarisi tinggi header halaman. Jarak antarbagiannya dipadatkan. Perubahan harga dari penyedia sudah dalam persen dan ditampilkan tanpa dikalikan 100 lagi. Seed, source history, hasil model, dan catatan privat tidak diubah.

Audit sumber lanjutan pada 21 Oktober 2026:

- Context: 293 seri di 46 ekonomi, 69.002 observasi; 314 pemeriksaan independen lolos. Tiga agregat WDI tanpa angka tetap kosong.
- Extended macro: 123 seri, 43.436 observasi; macro dasar/FX: 5.488 observasi; rekonsiliasi independen lolos.
- Rilis regional diperbarui dan direkonsiliasi: 125 seri, 21.605 observasi. [ONS D7G7](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23) menambahkan CPI September 2026 sebesar 3,5% pada 21 Oktober; 320 observasi sebelumnya tidak berubah.
- Sejarah pasar diperbarui setelah penyedia menarik beberapa bar futures 20 Oktober. Setelah pengambilan ulang, 51 seri dan 241.379 observasi hari selesai cocok; 21 berkas Treasury dan 70.028 posisi nilainya juga cocok. Bar null dihilangkan, tidak diisi nol atau diinterpolasi.
- Audit langsung 8.575 identitas quote unik mencatat 8.559 harga dengan timestamp yang sama cocok dan 15 timestamp penyedia lebih baru. Temuan yang memerlukan pengambilan ulang mencakup bar futures yang ditarik, satu bar TIPG yang kini null, ASGI-RI dengan harga sumber nol yang ditolak, serta MTF=F yang masih bertanggal Februari 2025. Ini tidak disamakan dengan harga terkini atau bukti real-time.

Bukti lokal: `validation/duplicate-context-source.log`, `duplicate-extended-source.log`, `duplicate-fx-source.log`, `duplicate-regional-refreshed-audit.log`, `duplicate-fresh-long-source.log`, dan `all-quotes-independent-source-audit.json`. Angka audit di atas bertanggal; penyedia dapat merevisi observasi setelah snapshot. Pengambilan ulang publikasi tetap menjalankan validasi dan mempertahankan status unavailable/retained bila sumber gagal.
