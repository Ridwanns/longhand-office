# Kuadran terbaru dan riwayat pasar · 20 Oktober 2026 WIB

## Hasil yang terpasang

Indonesia: **Quad 3 — pertumbuhan melambat, inflasi meningkat**, berdasarkan perubahan laju YoY pada rilis terbaru. GDP Q2 2026: 5,29% dari 5,61% di Q1 (−0,32 pp); CPI September 2026: 3,28% dari 3,19% pada Agustus (+0,09 pp). GDP dan CPI memakai periode yang berbeda. Ini klasifikasi deskriptif aplikasi, bukan angka kuadran resmi BPS, nowcast kuartal berjalan, atau rekomendasi investasi.

Panel utama sekarang menampilkan status ini dengan kuadran berwarna, titik posisi, dua kartu bukti, dan tautan sumber rilis kini/sebelumnya. Kuadran tahunan World Bank tetap tersedia dalam Annual history, terpisah dari pembacaan rilis terbaru.

Sumber: [BI, GDP Q2/Q1](https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2815026.aspx), [BPS, CPI September](https://www.bps.go.id/id/pressrelease/2026/10/01/2623/inflasi-year-on-year--y-on-y--pada-september-2026-sebesar-3-28-persen-.html), [BI, CPI Agustus](https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2817626.aspx).

## Cakupan yang benar-benar berhasil diambil

**51 dari 51 seri berhasil:** 19 ETF obligasi, 27 komoditas (termasuk tujuh energi), dan lima indeks. Treasury resmi menambah **5002 tanggal observasi** dari 2006-10-19 hingga 2026-10-16, dari 21 berkas tahunan resmi. Tidak ada kegagalan akuisisi pada set ini.

Rentang grafik: 1/3/6 bulan, 1/3/5/10/20 tahun, serta seluruh data yang dimuat. Frekuensi harian, mingguan, bulanan memakai observasi penutupan terakhir dalam periode, bukan harga hasil interpolasi. Rentang 20 tahun tidak memperpanjang seri yang baru mulai lebih belakangan; aplikasi menampilkan batas tersebut.

Unit sumber dipertahankan. USX berarti kuotasi sen AS; tidak diubah diam-diam menjadi dolar. TTF tetap EUR/MWh. Harga ETF berbeda dari yield Treasury. MTF dan CT dikenali penyedia sebagai ALTSYMBOL dan ditampilkan sebagai provider series. Seri batubara berakhir 2025-12-26 dan tidak disebut harga terkini. Seri futures dapat berganti kontrak; bukan return investasi kontinu atau harga spot.

WTI 20 April 2020 sebesar sekitar **−37,63 USD/barrel** dipertahankan dari sumber, termasuk pada grafik 20 tahun. Harga nol/negatif futures tidak lagi dibuang. Persentase perubahan dari acuan nonpositif ditahan agar tidak menyesatkan. [EIA: kejadian harga WTI negatif](https://www.eia.gov/TODAYINENERGY/detail.php?id=43495).

Treasury lama belum memiliki tenor dua bulan: nilainya tetap null. Satu baris libur resmi 11 Oktober 2010 tidak memuat yield apa pun; tanggal kosong tersebut dicatat dalam acquisitions.omittedEmptyDates dan tidak menghapus seluruh tahun 2010. Nilai per tenor tidak diisi atau diproyeksikan. [Sumber Treasury](https://home.treasury.gov/resource-center-data-chart-center/interest-rates).

## Pemeriksaan

Audit independen mengambil ulang semua 51 seri pasar dan 21 CSV Treasury, lalu membandingkan **241,357 observasi pasar yang telah lewat** dan **70,028 sel yield (termasuk nilai kosong)**. Hasil: 0 selisih. Bar pada tanggal bursa berjalan dikecualikan dari rekonsiliasi karena dapat berubah intraday. Laporan: validation/long-market-independent-source-audit.json.

563 tes Node dan tujuh tes API lulus. Pemeriksaan browser khusus meliputi semua ETF/komoditas yang dimuat, sembilan rentang, tiga frekuensi, 14 tenor Treasury, tema terang/gelap, ukuran 320–1440 px, sumber kuadran, sejarah tahunan, dan retensi WTI negatif. Hasil akhir browser dicatat di validation/cycle-history-browser-results.json. Seluruh pengujian browser memakai konteks terpisah dan data publik.

Batas ukuran feed browser lama enam MB diperbaiki menjadi batas 16 MB untuk file 11 MB ini. Pengujian memastikan grafik memakai seluruh riwayat yang dimuat, bukan fallback 20 observasi. Tidak ada transaksi, keputusan investasi, model tersimpan, kunci storage, atau catatan pemilik yang diubah. Perubahan lokal dan artifact browser telah disiapkan; tidak ada push atau deployment.

## Daftar seluruh seri

| Kelompok | Instrumen | Simbol | Unit asli | Mulai | Akhir | Observasi |
| --- | --- | --- | --- | --- | --- | ---: |
| bonds | iShares Core US Aggregate Bond ETF | AGG | USD / ETF share | 2006-10-19 | 2026-10-19 | 5030 |
| bonds | SPDR 1–3 Month T-Bill ETF | BIL | USD / ETF share | 2007-05-30 | 2026-10-19 | 4879 |
| bonds | Vanguard Total Bond Market ETF | BND | USD / ETF share | 2007-04-10 | 2026-10-19 | 4914 |
| bonds | Vanguard Total International Bond ETF | BNDX | USD / ETF share | 2013-06-04 | 2026-10-19 | 3365 |
| bonds | iShares J.P. Morgan USD Emerging Markets Bond ETF | EMB | USD / ETF share | 2007-12-19 | 2026-10-19 | 4737 |
| bonds | VanEck J.P. Morgan EM Local Currency Bond ETF | EMLC | USD / ETF share | 2010-07-23 | 2026-10-19 | 4085 |
| bonds | iShares iBoxx $ High Yield Corporate Bond ETF | HYG | USD / ETF share | 2007-04-11 | 2026-10-19 | 4913 |
| bonds | iShares 7–10 Year Treasury Bond ETF | IEF | USD / ETF share | 2006-10-19 | 2026-10-19 | 5030 |
| bonds | iShares 3–7 Year Treasury Bond ETF | IEI | USD / ETF share | 2007-01-11 | 2026-10-19 | 4974 |
| bonds | SPDR Bloomberg High Yield Bond ETF | JNK | USD / ETF share | 2007-12-04 | 2026-10-19 | 4748 |
| bonds | iShares iBoxx $ Investment Grade Corporate Bond ETF | LQD | USD / ETF share | 2006-10-19 | 2026-10-19 | 5030 |
| bonds | iShares 0–3 Month Treasury Bond ETF | SGOV | USD / ETF share | 2020-06-01 | 2026-10-19 | 1605 |
| bonds | iShares 1–3 Year Treasury Bond ETF | SHY | USD / ETF share | 2006-10-19 | 2026-10-19 | 5030 |
| bonds | iShares 0–5 Year TIPS Bond ETF | STIP | USD / ETF share | 2010-12-03 | 2026-10-19 | 3992 |
| bonds | iShares TIPS Bond ETF | TIP | USD / ETF share | 2006-10-19 | 2026-10-19 | 5030 |
| bonds | iShares 10–20 Year Treasury Bond ETF | TLH | USD / ETF share | 2007-01-11 | 2026-10-19 | 4974 |
| bonds | iShares 20+ Year Treasury Bond ETF | TLT | USD / ETF share | 2006-10-19 | 2026-10-19 | 5030 |
| bonds | Vanguard Intermediate-Term Corporate Bond ETF | VCIT | USD / ETF share | 2009-11-23 | 2026-10-19 | 4251 |
| bonds | Vanguard Short-Term Corporate Bond ETF | VCSH | USD / ETF share | 2009-11-23 | 2026-10-19 | 4251 |
| Energy | Brent crude oil · futures | BZ=F | USD / barrel | 2007-07-30 | 2026-10-19 | 4785 |
| Agriculture | Cocoa · futures | CC=F | USD / metric tonne | 2006-10-19 | 2026-10-19 | 5026 |
| Energy | WTI crude oil · futures | CL=F | USD / barrel | 2006-10-19 | 2026-10-19 | 5030 |
| Agriculture | Cotton No. 2 · provider series | CT=F | US cents / pound | 2006-10-19 | 2026-10-19 | 5027 |
| Metals | Gold · futures | GC=F | USD / troy ounce | 2006-10-19 | 2026-10-19 | 5030 |
| Livestock | Feeder cattle · futures | GF=F | US cents / pound | 2006-10-19 | 2026-10-19 | 5016 |
| Livestock | Lean hogs · futures | HE=F | US cents / pound | 2006-10-19 | 2026-10-19 | 5029 |
| Metals | Copper · futures | HG=F | USD / pound | 2006-10-19 | 2026-10-19 | 5032 |
| Energy | NY Harbor ULSD / heating oil · futures | HO=F | USD / US gallon | 2006-10-19 | 2026-10-19 | 5030 |
| Agriculture | Coffee C · futures | KC=F | US cents / pound | 2006-10-19 | 2026-10-19 | 5026 |
| Livestock | Live cattle · futures | LE=F | US cents / pound | 2006-10-19 | 2026-10-19 | 5027 |
| Energy | API2 coal · provider series | MTF=F | USD / metric tonne | 2010-12-17 | 2025-12-26 | 3677 |
| Energy | Henry Hub natural gas · futures | NG=F | USD / MMBtu | 2006-10-19 | 2026-10-19 | 5031 |
| Agriculture | Frozen concentrated orange juice · futures | OJ=F | US cents / pound | 2006-10-19 | 2026-10-19 | 5027 |
| Metals | Palladium · futures | PA=F | USD / troy ounce | 2006-10-19 | 2026-10-19 | 4654 |
| Metals | Platinum · futures | PL=F | USD / troy ounce | 2006-10-19 | 2026-10-19 | 4584 |
| Energy | RBOB gasoline · futures | RB=F | USD / US gallon | 2006-10-19 | 2026-10-19 | 5032 |
| Agriculture | Sugar No. 11 · futures | SB=F | US cents / pound | 2006-10-19 | 2026-10-19 | 5027 |
| Metals | Silver · futures | SI=F | USD / troy ounce | 2006-10-19 | 2026-10-19 | 5029 |
| Energy | Dutch TTF natural gas · futures | TTF=F | EUR / MWh | 2017-10-23 | 2026-10-16 | 2260 |
| Agriculture | Corn · futures | ZC=F | US cents / bushel | 2006-10-19 | 2026-10-19 | 5028 |
| Agriculture | Soybean oil · futures | ZL=F | US cents / pound | 2006-10-19 | 2026-10-19 | 5030 |
| Agriculture | Soybean meal · futures | ZM=F | USD / short ton | 2006-10-19 | 2026-10-19 | 5030 |
| Agriculture | Oats · futures | ZO=F | US cents / bushel | 2006-10-19 | 2026-10-19 | 5030 |
| Agriculture | Rough rice · futures | ZR=F | USD / hundredweight | 2006-10-19 | 2026-10-19 | 5019 |
| Agriculture | Soybeans · futures | ZS=F | US cents / bushel | 2006-10-19 | 2026-10-19 | 5030 |
| Agriculture | Chicago SRW wheat · futures | ZW=F | US cents / bushel | 2006-10-19 | 2026-10-19 | 5030 |
| macro | Dow Jones Industrial Average | ^DJI | index points | 2006-10-19 | 2026-10-19 | 5030 |
| macro | S&P 500 | ^GSPC | index points | 2006-10-19 | 2026-10-19 | 5030 |
| macro | Nasdaq Composite | ^IXIC | index points | 2006-10-19 | 2026-10-19 | 5030 |
| macro | IHSG / IDX Composite | ^JKSE | index points | 2006-10-20 | 2026-10-16 | 4839 |
| macro | CBOE VIX | ^VIX | index points | 2006-10-19 | 2026-10-19 | 5032 |
