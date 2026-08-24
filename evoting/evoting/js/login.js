/**
 * Alur login:
 * 1. Peserta memasukkan NIS/Token.
 * 2. Kode dikirim ke backend (backend/api/login.php) untuk diverifikasi:
 *    - Apakah kode terdaftar?
 *    - Apakah kode SUDAH dipakai untuk memilih? (mencegah double voting)
 * 3. Jika valid, backend mengembalikan session-token sekali-pakai yang
 *    diteruskan ke halaman pemilihan lewat parameter URL. Validasi akhir
 *    (mengunci suara) tetap dilakukan lagi di backend saat submit vote,
 *    sehingga sisi klien tidak pernah menjadi satu-satunya penjaga aturan.
 *
 * Catatan: proyek ini sengaja TIDAK memakai localStorage/sessionStorage
 * di sisi klien. Status "sudah memilih" harus selalu menjadi kebenaran
 * milik server/database, bukan milik browser peserta.
 */
const form = document.getElementById('loginForm');
const nisInput = document.getElementById('nis');
const errorText = document.getElementById('errorText');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorText.textContent = '';
  const code = nisInput.value.trim();

  if (!code) {
    errorText.textContent = 'Mohon isi NIS atau Token terlebih dahulu.';
    return;
  }

  const submitBtn = form.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memeriksa…';

  try {
    const res = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      errorText.textContent = data.message || 'Kode tidak dikenali atau sudah pernah digunakan.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Lanjut ke Bilik Suara →';
      return;
    }

    // data.session_token dibuat backend, sekali pakai, kedaluwarsa singkat.
    window.location.href = `vote.html?session=${encodeURIComponent(data.session_token)}`;
  } catch (err) {
    // Backend belum tersambung — tampilkan pesan yang jelas ke panitia.
    errorText.textContent =
      'Tidak dapat menghubungi server. Pastikan backend (lihat README.md) sudah berjalan.';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Lanjut ke Bilik Suara →';
  }
});
