# Keputusan atas audit yang dilampirkan — 20 Oktober 2026

**Catatan lanjutan:** dokumen ini merekam penilaian awal terhadap `2c962be`. Implementasi yang disetujui kemudian dijelaskan dalam `RELEASE_2026_10_20.md`; server vault private belum diaktifkan karena pengguna masih menggunakan GitHub Pages.

Penilaian ini mencocokkan audit pengguna dengan source `2c962be` dan tiga halaman publik yang dibuka dalam browser uji terpisah: Records, Data Sources, dan Registered forecasts. Ketiganya terbuka tanpa page error. Ini evaluasi penambahan/pengurangan yang disarankan; bukan klaim seluruh fungsi diuji ulang atau seluruh roadmap sudah diterapkan.

## Koreksi terhadap gambaran audit

| Bagian audit | Kondisi yang ditemukan sekarang | Keputusan |
|---|---|---|
| Backup, recovery, status penyimpanan | Backup lengkap, enkripsi dengan password, restore ke workspace terpisah, dan Records & storage status sudah tersedia. | Perkuat cakupan dan kemudahan pemeriksaan; tidak perlu membuat sistem backup kedua. |
| Data-quality panel | Data Sources sudah memiliki inspeksi kualitas, tanggal observasi/akuisisi, sumber dan perbandingan dataset. Informasi makro juga tersedia, tetapi tersebar. | Tambahkan ringkasan kualitas yang konsisten di dekat angka utama, memakai validator yang sudah ada. |
| Synchronized macro regime belum tersedia | Ada pembanding historis Indonesia Q2 2026, memakai GDP kuartalan dan CPI YoY bulan terakhir kuartal. | Pertahankan sebagai referensi historis akhir kuartal. Belum sama dengan mesin rezim kuartalan umum untuk banyak negara. |
| Prospective model validation | Empat model inti AR1, Ridge, Mean, Zero sudah dapat dibekukan sebelum sesi hasil dimulai dan dicocokkan dengan harga berikutnya. | Bangun dashboard dari registrasi yang sudah ada. Model lanjutan belum terintegrasi ke registrasi ini. |
| Baseline dan coverage perlu ditambahkan | Model lanjutan sudah menampilkan perbandingan baseline, coverage dari prior errors, jumlah sampel dan status konvergensi. | Satukan bukti dan batasnya; coverage historis bukan bukti kalibrasi prospektif. |
| Auto valuation berpotensi dianggap fair value independen | Kode sudah menyatakan sensitivity arithmetic, EPS/P/E reference mekanis, dan required return sebagai asumsi. Judul utama masih “Auto valuation”. | Ubah hierarki penamaan agar batas tersebut langsung terbaca. |
| Portfolio performance accounting | Ledger sudah memisahkan cash flow, fee dan dividen. Investment return secara eksplisit ditahan karena TWR/MWR belum lengkap. | Tetap tahan return jika input belum cukup; bangun akuntansi performa sebagai pekerjaan tersendiri. |

Bukti source: `complete-backup.js`, `encrypted-backup.js`, `workspace-health.js`, `market-data-ui.js`, `macro-cycle.js`, `prediction-math.js`, `prediction-ui.js`, `advanced-ui.js`, `auto-valuation-ui.js`, dan `office-extensions.js`.

## Tambahan yang diprioritaskan

### P0 — Perjelas perlindungan catatan dan kualitas data

**1. Manifest cakupan backup.** Tampilkan apa yang termasuk, apa yang harus diekspor terpisah, tanggal ekspor, dan status pemeriksaan restore. Ada celah penamaan yang perlu dibereskan: Records memakai “Back up everything”, sementara Data Sources menyatakan dataset/studi sumber memakai arsip ekspor terpisah. Ini perlu dijelaskan pada halaman backup utama, bukan hanya di Data Sources.

Kriteria selesai: daftar cakupan sesuai isi file; arsip Data Sources disebutkan secara eksplisit; “export generated” tidak berubah menjadi klaim file sudah disimpan atau pemulihan sudah teruji. Restore tetap memvalidasi dan menjaga workspace aktif.

**2. Ringkasan kualitas pada indikator utama.** Gunakan empat informasi berbeda: periode observasi, tanggal rilis resmi bila tersedia, waktu akuisisi/peninjauan, serta status reported/derived/revised/missing/retained. “Tidak tersedia” tetap tampil jika tanggal rilis tidak diketahui. Waktu akuisisi tidak boleh dipakai sebagai tanggal rilis atau verifikasi resmi.

Kriteria selesai: refresh gagal tetap memperlihatkan tanggal sumber asli; gap dan cakupan yang berbeda terlihat; hash disebut sebagai bukti integritas dataset, bukan bukti keaslian atau arsip point-in-time.

### P1 — Perjelas interpretasi dan pertanggungjawaban model

**3. Dua lapisan Macro dengan definisi eksplisit.** Lapisan pertama: “Latest release momentum”, dengan periode GDP dan CPI masing-masing terlihat. Lapisan kedua: “Quarter-end comparison”, hanya untuk periode yang datanya lengkap dan metodologinya diketahui. Snapshot Indonesia yang sudah ada bisa menjadi contoh awal. Jangan menamai CPI bulan terakhir kuartal sebagai CPI rata-rata kuartalan atau menyebut pembanding ini rezim resmi BPS.

Kriteria selesai: pilihan quarter-end versus quarterly-average tidak dicampur; rilis belum tersedia menahan hasil; perbandingan historis tetap bertanggal; dukungan negara baru menunggu data dan definisi yang kompatibel. Mesin ini belum merupakan nowcast atau sinyal investasi.

**4. Validation & accountability di Research Lab.** Gunakan satu tampilan ringkasan pada ruang Quant yang sudah ada, dengan empat kelompok bukti:

- Kelayakan data/model: sampel, cutoff, warm-up, alasan tidak tersedia, konvergensi.
- Evaluasi historis: RMSE/MAE dan baseline Mean/Zero pada target yang sama, termasuk hasil yang kalah dari baseline.
- Interval: target coverage, coverage teramati, jumlah observasi dan periode pengujian; tampilkan belum cukup bukti bila sampelnya kurang.
- Prediksi terdaftar: pending/settled, tanggal pembekuan, horizon, basis harga, hasil aktual, kegagalan settlement dan masalah revisi sumber.

Kriteria selesai: pisahkan hasil historis dari prospektif; jangan merata-ratakan skor dari cohort/horizon berbeda tanpa definisi; sebutkan overlap dan bias seleksi. Registrasi lokal pada browser belum merupakan timestamp pihak ketiga yang membuktikan prediksi tidak dapat diubah. Pencatatan prospektif untuk model lanjutan perlu versi kontrak tersendiri, bukan dimasukkan diam-diam ke kontrak empat model inti.

**5. Penamaan “Valuation sensitivity”.** Jadikan sifat skenario sebagai judul utama. Tampilkan asumsi required return/growth/terminal sebelum hasil diberi makna ekonomi. Pertahankan format studi lama dan alamat arsip; perubahan judul tidak memerlukan migrasi atau penghitungan ulang studi lama.

Pengembangan berikutnya boleh memasukkan driver perusahaan, normalisasi earnings dan biaya ekuitas yang dapat ditelusuri, tetapi harus menggunakan input bersumber dan bertanggal. Cash flow ekuitas dipasangkan dengan biaya ekuitas; ini sesuai prinsip [equity valuation NYU Stern](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/lectures/val.html). Model bank tetap terpisah dari FCFE CFO perusahaan nonkeuangan.

### Penyederhanaan visual dan akuntansi performa

**6. Grafik kuadran yang lebih mudah dibandingkan.** Tambahkan pilihan fixed/auto scale dengan unit poin persentase dan batas yang terlihat. Fixed scale harus sama untuk perbandingan yang sama; titik di luar rentang diberi keterangan nilai aktual, tidak diam-diam ditempatkan pada batas. Auto scale tetap boleh untuk inspeksi, dengan penjelasan keterbatasan perbandingan.

Zona terpilih mendapat warna; zona lain netral. Letakkan perubahan GDP/CPI dekat titik, dengan penempatan yang tidak menabrak label pada ponsel. Ubah garis putus-putus menjadi penghubung yang jelas berlabel “dari titik nol”; trajectory hanya dipakai bila memang ada urutan observasi historis.

**7. Performa portofolio sebagai modul akuntansi terpisah.** Dahulukan kelengkapan arus kas eksternal, fee/dividen, valuasi bertanggal dan kebijakan FX. TWR/MWR hanya ditampilkan jika syarat metode yang dipilih terpenuhi; jangan mengganti data yang hilang dengan return nol atau memakai net profit dibagi deposit sebagai return investasi. [GIPS Standards](https://www.gipsstandards.org/standards/gips-standards-for-firms/) dapat menjadi rujukan metodologi, tanpa mengklaim aplikasi patuh atau tersertifikasi GIPS.

## Perluasan rencana berdasarkan lima arahan pengguna

Kelima arahan berikut diterima sebagai lingkup yang perlu direncanakan. Penilaiannya dibedakan antara pekerjaan yang bisa memakai fondasi saat ini dan pekerjaan yang membutuhkan data atau arsitektur baru.

| Arahan | Keputusan | Fondasi dan syarat utama | Bukti selesai |
|---|---|---|---|
| Prospective forecasting validation dan accountability dashboard | Prioritas awal. Perluas registrasi empat model inti yang sudah ada menjadi satu tampilan pertanggungjawaban. Integrasi advanced dilakukan sesudah kontrak registrasinya ditetapkan. | Prediksi, versi model, input, cutoff dan waktu pembekuan harus dipertahankan; cohort pengujian dan aturan settlement ditentukan sebelum hasilnya tersedia. | Prediksi lama tidak berubah saat model diperbarui; pending/settled/failed terlihat; baseline, sampel dan coverage dihitung ulang secara independen. |
| Perombakan UI/UX menyeluruh | Cakup seluruh alur pengguna, tetapi rilis bertahap per alur. Fondasi tipografi, komponen dan navigasi dimulai bersama dashboard validasi. | Inventaris halaman, tugas utama, aksesibilitas, desain mobile dan keadaan loading/empty/error/stale/unsaved. | Alur mencari instrumen → membaca bukti → membuat keputusan → mereview hasil → backup/restore diuji dari awal sampai akhir, termasuk keyboard dan ponsel. |
| TWR/MWR dan rekonsiliasi FX | Prioritas berikutnya setelah kontrak valuasi dan arus kas cukup. Kualitas input menentukan apakah hasil boleh ditampilkan. | Ledger bertanggal, valuasi pada batas arus kas, fee/dividen, kebijakan transfer internal, mata uang pelaporan serta FX bertanggal. | Hasil cocok dengan perhitungan independen; deposit tidak menciptakan keuntungan; transaksi/dividen/fee tidak terhitung dua kali; gap input menahan hasil. |
| Backup dan sinkronisasi private vault lintas perangkat | Jadikan workstream arsitektur tersendiri. Rancangan keamanan/recovery dimulai sejak awal; peluncurannya menunggu pengujian dua perangkat dan konflik. | Layanan penyimpanan private, autentikasi, otorisasi per vault, pengelolaan kunci, recovery, revisi dan dukungan offline. | Perubahan dua perangkat tidak hilang atau mengganda, data pengguna terisolasi, pemulihan diuji, dan backup mandiri tetap dapat diekspor. |
| Macro nowcasting atau synchronized quarterly regime otomatis | Kerjakan quarterly comparison otomatis lebih dahulu. Nowcasting menjadi tahap riset terpisah sesudah arsip informasi menurut tanggal tersedia. | Definisi indikator yang konsisten, data resmi yang dapat diambil, kalender rilis, missing-data policy dan source vintages. | Kuartal baru hanya muncul saat input lengkap/valid; output dapat direproduksi dari data yang tersedia saat itu. Nowcast dinilai terhadap rilis aktual dan baseline. |

### 1. Dashboard: bedakan pelaporan model dari pembuktian kemampuan prediksi

Dashboard sebaiknya menjawab: model apa yang berjalan, input dan versinya apa, kapan prediksi dibekukan, apakah model mengalahkan baseline, dan apa yang terjadi setelahnya. Pisahkan hasil historis, prediksi prospektif dan skenario Monte Carlo dalam tampilan serta agregasinya.

Tampilkan MAE/RMSE, jumlah hasil matang, coverage dan jumlah interval yang dinilai, serta cohort menurut horizon/basis/model. Hindari satu skor gabungan yang menyembunyikan model gagal, horizon berbeda atau sampel tumpang tindih. Pada sampel kecil, tampilkan jumlah dan batas interpretasinya. Penilaian biaya transaksi membutuhkan definisi strategi dan eksekusi tersendiri; akurasi prakiraan harga belum menjadi backtest keuntungan strategi.

Registrasi browser tetap berguna, tetapi belum membuktikan waktu pembekuan secara independen dari pemilik perangkat. Bila bukti waktu independen diperlukan, rancang komitmen hash bertimestamp atau pencatatan append-only pada layanan private. Itu tidak mengharuskan publikasi isi portofolio atau penelitian pribadi.

### 2. UI/UX: menyeluruh pada alur, bertahap pada rilis

Bangun satu sistem komponen dan status yang dipakai Markets, Research, Portfolio dan Records. Prioritaskan hierarki angka, periode, sumber, alasan unavailable, serta tindakan berikutnya. Gunakan mode detail untuk metode/arsip, sehingga informasi yang jarang dipakai tidak bersaing dengan bukti utama.

Inventaris fitur yang dipertahankan harus mencakup deep link, saved studies, mode Paper/Real, akses keyboard, reduced motion, pemulihan kegagalan simpan dan ekspor. Sebuah halaman dianggap selesai setelah alurnya diuji, bukan hanya setelah screenshot tampak lebih menarik. Perubahan navigasi tidak perlu mengganti ID catatan atau kunci penyimpanan.

### 3. Performa: tetapkan kebijakan akuntansi sebelum menampilkan persentase

Untuk true TWR, nilai subperiode pada batas arus kas eksternal dihitung lalu dihubungkan secara geometris. MWR memakai waktu serta besaran arus kas dengan definisi IRR yang konsisten; periode lebih pendek harus diberi label annualized bila hasilnya disetahunkan. Rujukan metode: [GIPS Standards Handbook, calculation methodology](https://www.gipsstandards.org/standards/gips-standards-for-firms/gips-standards-handbook-for-firms/). Rujukan ini tidak berarti Office memenuhi standar pelaporan GIPS.

Sebelum implementasi, tetapkan perlakuan arus kas awal/akhir hari, pajak, fee, dividen, transfer internal dan scope portofolio. MWR harus menangani hasil tidak konvergen, tidak ada solusi atau kemungkinan lebih dari satu solusi; aplikasi tidak boleh memilih persentase diam-diam. Jika memakai metode perkiraan karena valuasi tidak cukup, label metode perkiraannya harus berbeda dari true TWR.

Untuk FX, simpan nilai dan mata uang transaksi asli, kurs eksekusi bila ada, nilai mata uang pelaporan, fee/spread serta tanggal yang relevan. Kurs untuk valuasi historis harus bertanggal sesuai kebijakan as-of; kurs hari ini tidak mengganti kurs historis yang hilang. Rekonsiliasi harus memisahkan perubahan nilai aset, pengaruh FX dan biaya, lalu mencocokkan kas/posisi dengan bukti transaksi. Transfer antara akun sendiri perlu diklasifikasikan sesuai scope laporan, sehingga tidak menggandakan kontribusi. Mata uang dasar dipilih secara eksplisit; data asli dipertahankan.

### 4. Private vault: backup terenkripsi dan sinkronisasi adalah kemampuan berbeda

Saat ini ekspor backup dapat dilindungi password, tetapi browser/SQLite aktif belum otomatis menjadi vault terenkripsi lintas perangkat. GitHub Pages dapat tetap menjadi frontend; autentikasi, otorisasi dan penyimpanan sinkron private membutuhkan layanan lain.

Pilihan arsitektur yang disarankan untuk dibahas adalah server menyimpan ciphertext dan klien membuka data dengan kunci yang dikelola secara sengaja. Pemulihan kunci, penambahan/pencabutan perangkat, perubahan password dan logout harus dirancang bersama. Memakai primitif enkripsi tidak otomatis menyelesaikan keamanan seluruh sistem; batas pengelolaan kunci dan eksekusi script juga dibahas dalam [W3C Web Cryptography, Security considerations](https://www.w3.org/TR/webcrypto/#security-considerations).

Sinkronisasi perlu revisi, idempotensi, antrian offline dan penyelesaian konflik. Jangan menggunakan file snapshot yang saling menimpa sebagai mekanisme penggabungan transaksi keuangan. Uji minimal: dua perangkat mengedit bersamaan, koneksi terputus saat menyimpan, operasi dikirim ulang, perangkat hilang, salah password, recovery, serta backup lama yang dipulihkan ke workspace terpisah. Sync tidak menggantikan backup yang menyimpan riwayat pemulihan.

Hosting, lokasi data, biaya operasional, siapa yang dapat membuka data, dan kebijakan recovery perlu diputuskan sebelum layanan diaktifkan. Mempertimbangkan arsitektur ini tidak mengaktifkan akun, biaya atau unggahan catatan pribadi.

### 5. Macro: automasi perbandingan kuartalan lebih dahulu

Definisikan targetnya dengan tepat. Untuk pilihan quarter-end, gunakan laju YoY pada bulan terakhir kuartal yang sama dengan GDP. Untuk inflasi berbasis rata-rata indeks CPI kuartalan, dibutuhkan level indeks bulanan yang kompatibel pada kuartal ini dan kuartal sama tahun sebelumnya; rata-rata sederhana tiga angka YoY bulanan tidak otomatis identik dengan ukuran tersebut.

Pilih kuartal terakhir yang memenuhi seluruh input. Jika GDP kuartal baru belum dirilis, CPI bulan baru tidak menjadikan kuartal tersebut lengkap. Simpan data asli, rilis/revisi, waktu pengambilan dan versi definisi. Sumber yang tidak dapat diakses menahan pembaruan atau mempertahankan snapshot bertanggal; status otomatis tidak boleh menggantikan peninjauan manual yang belum dilakukan.

Nowcasting perlu target tersendiri, misalnya GDP YoY atau GDP QoQ yang tidak boleh dipertukarkan, kumpulan indikator frekuensi campuran, kalender rilis dan evaluasi menurut informasi yang tersedia pada tiap tanggal prakiraan. [New York Fed Staff Nowcast](https://www.newyorkfed.org/research/policy/nowcast) menjadi contoh pemakaian data yang datang bertahap untuk memperkirakan GDP; model dan definisi AS tersebut tidak otomatis berlaku untuk Indonesia. Tahap awal Office harus tetap berlabel penelitian, mempertahankan snapshot prediksi, dan memperlihatkan perbandingan dengan baseline serta rilis GDP sesudahnya.

### Urutan yang direkomendasikan setelah perluasan scope

1. Lengkapi cakupan backup, kontrak data/tanggal dan rancangan keamanan vault.
2. Bangun dashboard accountability bersama fondasi UI/UX; rapikan alur utama secara bertahap.
3. Bangun ledger performa TWR/MWR/FX dan quarterly comparison otomatis setelah input masing-masing siap. Keduanya bisa menjadi workstream terpisah.
4. Aktifkan private vault lintas perangkat setelah pengujian recovery, otorisasi dan konflik selesai.
5. Masuk ke nowcasting eksperimental setelah arsip vintages dan protokol evaluasi tersedia.

Urutan ini memperbarui urutan awal di atas. Desain vault dan persiapan data makro dapat dimulai lebih awal tanpa menunggu seluruh perubahan visual selesai. Tidak ada estimasi biaya atau durasi yang dibuat sebelum pilihan hosting, cakupan data dan kebutuhan perangkat ditentukan.

## Yang dikurangi atau ditahan

- Kurangi panel warna yang sama-sama dominan, pengulangan menu/arsip, dan metode panjang pada tampilan awal. Tetap sediakan rincian melalui disclosure dan deep link.
- Hindari membuat halaman backup, sumber data atau registrasi prediksi baru yang menduplikasi fitur saat ini. Rapikan pintu masuk dan cakupannya.
- Tahan tambahan model forecasting baru, animasi berat, skor “confidence” tanpa kalibrasi, serta sinyal beli/jual otomatis. Kebutuhan saat ini adalah bukti yang lebih jelas.
- Hindari label fair value independen pada sensitivity mekanis dan label economic regime pada HMM volatilitas statistik.
- Jangan menghapus model yang berguna hanya karena belum eligible untuk ticker tertentu. Tampilkan alasan dan syarat kelayakannya.

## Yang dipertahankan

Identitas visual Office, Data Sources, arsip analisis yang dapat direproduksi, ekspor/restore, perbandingan baseline, sumber bertanggal, status unavailable, pemisahan mata uang, serta aturan tidak mengubah portofolio dari hasil analisis.

Gunakan urutan pada bagian perluasan lima arahan sebagai rencana terbaru. Cakupan backup dan kualitas data tetap menjadi fondasi untuk mengurangi risiko kehilangan catatan dan salah tafsir.

Dokumen ini tidak mengubah kode produk, catatan pribadi, rumus tersimpan, atau deployment. Audit masukan digunakan sebagai bahan evaluasi; rekomendasinya tidak otomatis dianggap instruksi untuk menerapkan seluruh roadmap sekaligus.
