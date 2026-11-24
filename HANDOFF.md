# Handoff operasional Postiz DKH

## Pembaruan 24 November 2026 — rencana pindah Hermes ke OpenBot

- Pemilik memilih **OpenBot desktop (openbot.run)** sebagai tempat agent berikutnya dan berencana menghentikan Hermes di Railway. **Belum ada layanan atau volume Railway yang dihapus.** OpenBot desktop perlu komputer menyala untuk pekerjaan yang dijalankan secara lokal; jadwal unggah tanpa komputer menyala memerlukan host yang selalu aktif atau worker terpisah.
- Di OpenBot, endpoint custom `ClassAI Router` sudah dibuat dengan URL `https://router.classai.id/v1` dan model `deepseek-v4.1-flash-1017` serta `minimax-m2.7`. ChatGPT `creatordkh@gmail.com` terhubung dan tetap menjadi provider default. API key ClassAI dari variabel Railway dipasang melalui UI OpenBot; UI menampilkan **API key saved** dan kedua model muncul di pemilih model. Tes langsung ke endpoint ClassAI dengan `minimax-m2.7` berhasil (`koneksi berhasil`, 74 token). Agent uji OpenBot **Tes ClassAI** telah dipilih memakai `ClassAI Router/MiniMax M2.7` dan membalas satu pesan. Kunci tidak disimpan di repo.
- Agent **Gustavo** sudah dibuat di OpenBot dengan jabatan **Head Agent DKH** dan model awal ChatGPT `GPT-6-Luna Medium`. Instruksi lokalnya berada di `C:\Users\mybam\OpenBot\Agents\agent-4888b9b0-bfec-45e5-81f0-0015a24f9cfe\AGENTS.md`; UI OpenBot menampilkan instruksi tersebut. Ia mengoordinasikan 7 brand, membaca hanya konsep ERP `Ready to post`, memvalidasi brand/video/kanal, mencegah posting ganda, dan melaporkan receipt per platform. Ini **belum** berarti Gustavo punya koneksi ERP, Drive, Postiz, atau agen brand di OpenBot.
- Lima arsip di `D:\hermes-dkh-backup` telah diperiksa dengan `tar -tzf`, dan **semuanya tidak valid/terpotong** akibat putusnya Railway SSH; jangan gunakan untuk pemulihan atau menghapus volume. Sebuah snapshot volume Railway dibuat pada 24 November 2026 (8,61 GB), tetapi snapshot itu belum menjadi ekspor portabel dan belum diuji restore.
- Panduan resmi OpenBot menyatakan profil Hermes yang berada di server lain dapat diimpor dengan ZIP ekspor Hermes. Profil membawa persona, memori, custom skills, dan job tertentu; **chat lama, kredensial, sesi login, dan pengaturan MCP tidak ikut**. Hubungkan ulang Postiz, ERP, Drive, dan provider sesuai kebutuhan setelah impor, kemudian jalankan uji baca dan satu tugas unggah terkontrol.
- `hermes-social`, `hermes-webapp-proxy`, dan `grok-hermes-bridge` saling bergantung. Mematikan Hermes memutus Ruang lama dan jalur Grok → Hermes; konektor Grok → Postiz langsung dan layanan Postiz berada di jalur terpisah. Pertahankan `threads-orchestrator`, `Postgres`, `keypp-master-api`, dan layanan lain sampai dependensinya diaudit satu per satu.
- Urutan pemutusan: selesaikan backup dan impor profil → pasang ulang koneksi → uji alur ERP `Ready to post` ke Postiz beserta receipt/writeback → arahkan Grok ke jalur baru → barulah hentikan layanan Hermes dan proxy; hapus volume hanya setelah backup dapat dipulihkan dan pemilik menyetujui penghapusan permanen.

## Pembaruan 20 November 2026 — audit boros token

- Dashboard Classai menunjukkan saldo sekitar **133 juta kredit** (≈ Rp19.965). Dalam tujuh hari, API key `Default` yang juga dipakai Hermes mencatat **868 request, 99,6 juta input token, 503 ribu output token, dan 866 juta kredit**. Ini belum tentu semuanya dari Hermes karena key dapat dipakai layanan lain. Banyak request terakhir membawa **200–300 ribu input token**; cache hit 95% tetap menimbulkan biaya.
- Log Railway `hermes-social` memperlihatkan panggilan tambahan `thread=bg-review` dengan model berbayar `deepseek-v4.1-flash-1017`. Kode Hermes upstream menjelaskan review otomatis setelah turn dapat membaca ulang konteks percakapan. Kontribusi nominalnya belum dapat dipisahkan dari tagihan key bersama.
- Pada Railway Console, `auxiliary.background_review.enabled: false` disetel dan **diverifikasi pada 12 config** di volume persisten `/opt/data` (utama dan 11 profil). Ini menghentikan review otomatis; memori dan chat lama tetap ada, pembaruan pengetahuan manual tetap dapat dilakukan. Prosedur untuk profil baru ada di [`ops/hermes-cost-guard/README.md`](ops/hermes-cost-guard/README.md). Tidak ada posting uji yang dibuat.
- Railway deployment `hermes-social` `fca4f702-4a95-4e99-8365-e96bfb0c0269` berstatus `SUCCESS`. Start command telah dikembalikan ke `/usr/local/bin/ruang-hermes-entrypoint.sh`; percobaan pembatas via start command tidak mengubah config dan tidak digunakan.
- Variabel Railway `HERMES_INFERENCE_MODEL` mengarah ke model gratis, tetapi **log runtime** menampilkan `deepseek-v4.1-flash-1017` berbayar. Ini bisa berasal dari override sesi/profil; jangan mengklaim semua penggunaan Hermes gratis sampai model aktual per run diverifikasi. Perubahan ini mengurangi panggilan review, bukan batas keras kredit. Bandingkan input token dan kredit per pekerjaan berikutnya di Classai.

## Pembaruan 20 November 2026 — penghematan token Hermes

- Classai Router untuk akun DKH menampilkan sekitar **133 juta kredit** (≈ Rp19.965) saat diperiksa 20 Nov. Ini saldo **bersama semua API key**, bukan saldo khusus Hermes. Dalam tujuh hari sebelumnya tercatat 867 juta kredit untuk 872 request, 99,6 juta token input dan 504 ribu token output. Beberapa request terakhir membawa lebih dari 200 ribu token input. Angka ini dapat berubah; lihat dashboard Classai sebelum membuat proyeksi biaya baru.
- Railway Function `grok-hermes-bridge` di proyek `Lead & hermes` kini memberi **sesi Hermes tersendiri untuk setiap `task_id`** (`dkh:grok:upload:<task_id>`). Sebelumnya semua tugas memakai sesi bersama `dkh:grok:uploader`, sehingga riwayat upload sebelumnya dapat ikut terkirim lagi. Idempotency key tetap `grok-<task_id>` dan mekanisme claim serta writeback ERP tidak diubah.
- Deployment Railway `68827158-ac95-4da7-b9e6-057eedbb32c4` berstatus `SUCCESS`; `GET /health` mengembalikan `{"bridge":"ok","erpWriteback":true}`. Snapshot kode produksi ada di [`ops/grok-hermes-bridge/index.ts`](ops/grok-hermes-bridge/index.ts) dan prosedur pembaruan di [`ops/grok-hermes-bridge/README.md`](ops/grok-hermes-bridge/README.md). Repo ini **tidak otomatis men-deploy** Function tersebut.
- **Belum terukur penghematan nyata per upload.** Belum ada tugas publikasi baru yang dijalankan hanya untuk uji biaya, dan perubahan ini hanya mengenai jalur Grok → Hermes. Perintah langsung di webapp Hermes atau grup agen masih dapat membawa riwayat panjang. Pantau token input per run di Classai setelah pekerjaan berikutnya.
- Alur ideal selanjutnya: konsep ERP `Ready To post` berisi metadata final → validasi dan claim deterministik → Postiz/kanal resmi → receipt per platform → writeback ERP. Panggil model AI hanya untuk kasus pengecualian. Bridge saat ini **masih memulai satu run AI per tugas upload**; jangan mengklaim uploader tanpa AI sudah selesai.

Pembaruan infrastruktur terakhir: **20 November 2026 (WIB)**. Status kanal di bawah terakhir diperiksa **14 November 2026**. Dokumen ini mencatat keadaan yang terlihat saat pemeriksaan, bukan janji bahwa token platform akan berlaku selamanya. Periksa kembali status kanal sebelum membuat antrean baru.

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
