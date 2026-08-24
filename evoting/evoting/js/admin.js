/**
 * Dashboard panitia.
 *
 * PENTING soal keamanan: gerbang kata sandi di file ini HANYA untuk
 * mencegah orang iseng membuka dashboard secara tidak sengaja. Ini
 * BUKAN autentikasi yang aman — siapa pun yang membaca kode sumber bisa
 * melihat perbandingannya. Untuk penggunaan sungguhan, backend/api/results.php
 * WAJIB diproteksi dengan session/login panitia yang sesungguhnya
 * (lihat README.md bagian "Keamanan").
 */
const ADMIN_PASSWORD_HINT = 'ambalan2026'; // GANTI sebelum deploy — lihat README.

const gate = document.getElementById('gate');
const dashboard = document.getElementById('dashboard');
const gateBtn = document.getElementById('gateBtn');
const gateError = document.getElementById('gateError');

gateBtn.addEventListener('click', () => {
  const val = document.getElementById('adminPass').value;
  if (val === ambalan2026) {
    gate.style.display = 'none';
    dashboard.style.display = 'block';
    startPolling();
  } else {
    gateError.textContent = 'Kata sandi salah. Hubungi koordinator panitia.';
  }
});

const charts = {}; // categoryId -> Chart.js instance
let pollTimer = null;

function initCategoryPanels() {
  const container = document.getElementById('categoryPanels');
  container.innerHTML = CATEGORIES.map(cat => `
    <section class="panel stitch-border">
      <h2>${cat.label}</h2>
      <div class="sub">Perolehan suara langsung per kandidat</div>
      <div class="chart-wrap"><canvas id="chart-${cat.id}"></canvas></div>
      <ul class="leader-list" id="leader-${cat.id}"></ul>
    </section>
  `).join('');

  CATEGORIES.forEach(cat => {
    const ctx = document.getElementById(`chart-${cat.id}`);
    charts[cat.id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: cat.candidates.map(c => c.name),
        datasets: [{
          label: 'Jumlah Suara',
          data: cat.candidates.map(() => 0),
          backgroundColor: '#B98A2E',
          borderRadius: 6,
          maxBarThickness: 46,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#E3D5B8' } },
          x: { grid: { display: false } },
        },
      },
    });
  });
}

function renderResults(payload) {
  document.getElementById('statTotalVoters').textContent = payload.total_registered ?? '–';
  document.getElementById('statVoted').textContent = payload.total_voted ?? '–';
  const turnout = payload.total_registered
    ? Math.round((payload.total_voted / payload.total_registered) * 100)
    : 0;
  document.getElementById('statTurnout').textContent = `${turnout}%`;

  CATEGORIES.forEach(cat => {
    const results = payload.results?.[cat.id] || {};
    const counts = cat.candidates.map(c => results[c.id] || 0);
    const total = counts.reduce((a, b) => a + b, 0) || 1;

    charts[cat.id].data.datasets[0].data = counts;
    charts[cat.id].update('none');

    const leaderEl = document.getElementById(`leader-${cat.id}`);
    const rows = cat.candidates
      .map((c, i) => ({ name: c.name, count: counts[i] }))
      .sort((a, b) => b.count - a.count);

    leaderEl.innerHTML = rows.map(r => {
      const pct = Math.round((r.count / total) * 100);
      return `
        <li>
          <span style="min-width:110px;">${r.name}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
          <span class="pct">${pct}%</span>
        </li>
      `;
    }).join('');
  });

  document.getElementById('lastUpdated').textContent =
    `Diperbarui ${new Date().toLocaleTimeString('id-ID')}`;
}

async function fetchResults() {
  try {
    const res = await fetch('backend/api/results.php');
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    renderResults(data);
  } catch (err) {
    // Backend belum tersambung — tampilkan data contoh agar tata letak
    // dashboard tetap bisa ditinjau, dengan penanda jelas "MODE DEMO".
    document.getElementById('lastUpdated').textContent = 'Mode demo — backend belum tersambung';
    renderResults(buildDemoPayload());
  }
}

function buildDemoPayload() {
  // Angka contoh acak, HANYA untuk pratinjau tata letak. Tidak disimpan
  // di mana pun (tidak pakai localStorage) — dihitung ulang tiap panggilan.
  const results = {};
  CATEGORIES.forEach(cat => {
    results[cat.id] = {};
    cat.candidates.forEach(c => {
      results[cat.id][c.id] = Math.floor(Math.random() * 40) + 5;
    });
  });
  return { total_registered: 180, total_voted: 132, results };
}

function startPolling() {
  initCategoryPanels();
  fetchResults();
  pollTimer = setInterval(fetchResults, 10000);
}
