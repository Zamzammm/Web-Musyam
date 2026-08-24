/**
 * Logika halaman pemilihan.
 * - Menyimpan pilihan sementara di variabel JS (bukan localStorage),
 *   karena seluruh halaman ini berjalan dalam satu kali muat (single load).
 * - `sessionToken` didapat dari parameter URL yang dikirim oleh login.js.
 * - Saat "Kirim Suara" dikonfirmasi, seluruh pilihan dikirim sekaligus ke
 *   backend dalam satu request agar penguncian "sudah memilih" terjadi
 *   atomik di sisi server (lihat backend/api/vote.php).
 */

const params = new URLSearchParams(window.location.search);
const sessionToken = params.get('session');

if (!sessionToken) {
  // Tidak ada sesi login yang valid — kembalikan ke halaman masuk.
  window.location.href = 'index.html';
}

const selections = {}; // { categoryId: candidateId }
let activeCategoryIndex = 0;

const tabsEl = document.getElementById('tabs');
const panelEl = document.getElementById('categoryPanel');
const submitBtn = document.getElementById('submitBtn');

function renderTabs(){
  tabsEl.innerHTML = CATEGORIES.map((cat, i) => `
    <button class="tab ${i === activeCategoryIndex ? 'active' : ''} ${selections[cat.id] ? 'done' : ''}"
            data-index="${i}">
      <span class="dot"></span>${cat.short}
    </button>
  `).join('');

  tabsEl.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategoryIndex = Number(btn.dataset.index);
      renderTabs();
      renderPanel();
    });
  });
}

function renderPanel(){
  const cat = CATEGORIES[activeCategoryIndex];
  panelEl.innerHTML = `
    <h2 class="font-display" style="font-size:20px;margin-bottom:14px;">${cat.label}</h2>
    <div class="grid">
      ${cat.candidates.map(c => `
        <div class="stitch-border candidate ${selections[cat.id] === c.id ? 'selected' : ''}" data-cid="${c.id}">
          <span class="check-badge">✓</span>
          <div class="photo-frame">${initials(c.name)}</div>
          <div class="candidate-name">${c.name}</div>
          <div class="candidate-number">No. Urut ${c.id}</div>
        </div>
      `).join('')}
    </div>
  `;

  panelEl.querySelectorAll('.candidate').forEach(card => {
    card.addEventListener('click', () => {
      selections[cat.id] = card.dataset.cid;
      renderTabs();
      renderPanel();
      updateSubmitState();

      // Otomatis lanjut ke kategori berikutnya yang belum dipilih.
      const nextIndex = CATEGORIES.findIndex((c, i) => i > activeCategoryIndex && !selections[c.id]);
      if (nextIndex !== -1) {
        setTimeout(() => {
          activeCategoryIndex = nextIndex;
          renderTabs();
          renderPanel();
        }, 220);
      }
    });
  });
}

function updateSubmitState(){
  const allDone = CATEGORIES.every(cat => selections[cat.id]);
  submitBtn.disabled = !allDone;
}

function nameFor(catId, candId){
  const cat = CATEGORIES.find(c => c.id === catId);
  const cand = cat.candidates.find(c => c.id === candId);
  return cand ? cand.name : '—';
}

// --- Modal konfirmasi -------------------------------------------------
const modalOverlay = document.getElementById('modalOverlay');
const choiceSummary = document.getElementById('choiceSummary');
const cancelBtn = document.getElementById('cancelBtn');
const confirmBtn = document.getElementById('confirmBtn');

submitBtn.addEventListener('click', () => {
  choiceSummary.innerHTML = CATEGORIES.map(cat => `
    <div>${cat.short}: <b>${nameFor(cat.id, selections[cat.id])}</b></div>
  `).join('');
  modalOverlay.classList.add('open');
});

cancelBtn.addEventListener('click', () => {
  modalOverlay.classList.remove('open');
});

confirmBtn.addEventListener('click', async () => {
  confirmBtn.disabled = true;
  cancelBtn.disabled = true;
  confirmBtn.textContent = 'Mengirim…';

  try {
    const res = await fetch('backend/api/vote.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: sessionToken, selections }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || 'Gagal mengirim suara. Anda mungkin sudah pernah memilih.');
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      confirmBtn.textContent = 'Ya, Kirim';
      modalOverlay.classList.remove('open');
      return;
    }

    window.location.href = 'success.html';
  } catch (err) {
    alert('Tidak dapat menghubungi server. Pastikan backend sudah berjalan (lihat README.md).');
    confirmBtn.disabled = false;
    cancelBtn.disabled = false;
    confirmBtn.textContent = 'Ya, Kirim';
  }
});

renderTabs();
renderPanel();
updateSubmitState();
