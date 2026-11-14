# Handoff operasional Postiz DKH

Terakhir diperiksa: **14 November 2026 (WIB)**. Dokumen ini mencatat keadaan yang terlihat saat pemeriksaan, bukan janji bahwa token platform akan berlaku selamanya. Periksa kembali status kanal sebelum membuat antrean baru.

## Ringkasan perubahan terbaru

- Postiz DKH berjalan di `https://postiz-dkh.up.railway.app/`.
- Grok Bot memiliki konektor khusus **DKH Postiz Langsung** ke endpoint MCP `https://postiz-dkh.up.railway.app/api/mcp` dengan header `Authorization: Bearer <API key Postiz>`. Kunci tersimpan di Grok Bot dan **tidak disimpan di repo**. Konektor ini tersedia bagi bot dalam akun Grok Bot dan memiliki kemampuan Postiz sesuai API key akun tersebut.
- DUM-E (Upload & Analitics) berhasil menjalankan uji baca `integrationList` melalui konektor itu. Saat uji tersebut, ia melihat 28 kanal (7 Facebook, 7 Instagram, 7 Threads, 7 YouTube). Uji hanya membaca; tidak membuat, menjadwalkan, mengubah, atau menghapus posting.
- Setelah uji DUM-E, kanal Instagram **Selxzi** ditambahkan di Postiz. Halaman Postiz menampilkan `Channel Added` dan daftar kanal Instagram kini memuat Selxzi. Daftar sebelumnya memuat Rhieky Nugraha; daftar terbaru yang terlihat memuat Selxzi sebagai gantinya. **Jalankan `integrationList` lagi** untuk mengambil ID dan status terbaru sebelum publikasi.
- Di editor Postiz, Facebook **Selxzi** dan Instagram **Selxzi** berhasil dipilih bersamaan sebagai dua target. Itu membuktikan keduanya tersedia untuk penyusunan posting. **Belum dilakukan uji publikasi Selxzi** pada pemeriksaan ini.
- Meta Business Suite menampilkan Page Selxzi terhubung dengan `@selxzi.official`. Editor Reel Meta menampilkan tujuan `Selxzi dan selxzi.official`. Ini adalah pilihan penerbitan bersamaan di Meta Business Suite; jangan berasumsi posting Facebook yang dikirim **melalui Postiz** akan otomatis tercermin ke Instagram.

## Kanal yang terlihat di Postiz

| Platform | Status pada 14 Nov 2026 | Nama kanal yang terlihat |
| --- | --- | --- |
| Facebook | 7 | Mybamus; Yoenik Apparel; Siselyo; Selxzi; MYG Reseller & Grosir; Key Photo Production; Key Clothing Production |
| Instagram | 7 | Mybamus Official; Yoenik Apparel; Siselyo Official; MYG Reseller & Grosir; Jasa Foto Video Produk Katalog; Konveksi Baju Wanita Bandung; Selxzi |
| Threads | 7 | `mybamus`; `yoenik.apparel`; `siselyo.official`; `selxzi.official`; `key.photopro`; `key.clothingpro`; `myg.reseller` |
| YouTube | 7 | Mybamus Official; Yoenik Apparel; Siselyo Official; Selxzi Official; MYG Reseller & Grosir; Key Photo Production; Key Clothing Production |

Nama tampilan Instagram KEYPP dan KEYCP berbeda dari nama brand. Cocokkan **handle dan integration ID**, bukan nama tampilan saja, sebelum menerbitkan video. Tidak ada kanal Shopee dalam daftar Postiz ini; alur Shopee terpisah.

## Aturan unggah FB dan IG

1. Ambil brand, video, caption, dan jadwal dari konsep ERP yang berstatus **Ready to post**. Jangan mengarang data yang belum tersedia.
2. Panggil `integrationList` dan cocokkan kanal tujuan dengan brand. Untuk unggah ke Facebook dan Instagram, pilih **dua integration ID** milik brand yang sama di Postiz.
3. Buat atau jadwalkan konten untuk kedua kanal tersebut. Jangan mengandalkan "mirror" dari satu posting Facebook Postiz.
4. Periksa hasil publikasi **Facebook dan Instagram secara terpisah**. Simpan tautan/ID dan status masing-masing; tandai ERP `Posted` hanya menurut aturan status ERP yang berlaku setelah semua platform tujuan berhasil.
5. Jika salah satu kanal gagal, jangan menggandakan posting di kanal yang sudah berhasil. Lanjutkan hanya kanal yang gagal setelah memeriksa antrean dan posting yang telah tayang.

Untuk Selxzi, dua kanal sudah bisa dipilih di editor Postiz, tetapi belum ada posting uji dalam sesi ini. Jika koneksi Instagram Selxzi bermasalah saat eksekusi, Meta Business Suite dapat membuat Reel untuk Page Selxzi dan `@selxzi.official` bersamaan; tetap verifikasi kedua hasil tayang.

## Pekerjaan berikutnya

- Segarkan daftar `integrationList` di DUM-E agar ia melihat kanal Instagram Selxzi dan ID terkini. Uji baca tidak perlu membuat posting.
- Simpan aturan FB+IG di instruksi kerja DUM-E/Grok Bot. Upaya mengirim aturan lewat jendela Grok Bot pada sesi ini **tidak berhasil terkirim** karena jendela sedang dipakai bersamaan. Jangan menganggap DUM-E sudah menerima SOP terbaru hanya dari dokumen ini.
- Saat ada konten uji yang disetujui, uji publikasi ke pasangan Facebook dan Instagram Selxzi, lalu verifikasi kedua hasilnya dan bersihkan konten uji sesuai instruksi pemilik.
- Cek ulang hubungan kanal dan izin apabila suatu platform meminta login ulang atau tokennya kedaluwarsa.

## Keamanan

Jangan menaruh API key Postiz, token OAuth, kata sandi, OTP, atau URL callback yang berisi `code=` di issue, log, chat, atau repo. Konektor Grok memakai API key akun Postiz yang berwenang atas seluruh kanal terhubung; batasi penggunaan tool tulis sesuai tugas pemilik.
