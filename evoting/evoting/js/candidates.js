/**
 * Data kandidat & kategori — Musyawarah Ambalan Masa Bakti 2026/2027
 * Ubah / tambah kandidat cukup dengan mengedit array di bawah ini.
 * Di produksi, data ini sebaiknya diambil dari API backend
 * (GET /backend/api/candidates.php) agar tidak perlu deploy ulang
 * setiap kali daftar kandidat berubah.
 */
const CATEGORIES = [
  {
    id: 'pemangku_putri',
    label: 'Pemangku Adat Putri',
    short: 'Adat Putri',
    candidates: [
      { id: 'PAP-1', name: 'Fradilla' },
      { id: 'PAP-2', name: 'Echa' },
    ],
  },
  {
    id: 'pemangku_putra',
    label: 'Pemangku Adat Putra',
    short: 'Adat Putra',
    candidates: [
      { id: 'PAPU-1', name: 'Catur' },
      { id: 'PAPU-2', name: 'Bijar' },
    ],
  },
  {
    id: 'pradana_putri',
    label: 'Pradana Putri',
    short: 'Pradana Putri',
    candidates: [
      { id: 'PDP-1', name: 'Sabrina' },
      { id: 'PDP-2', name: 'Shaqira' },
      { id: 'PDP-3', name: 'Shifana' },
    ],
  },
  {
    id: 'pradana_putra',
    label: 'Pradana Putra',
    short: 'Pradana Putra',
    candidates: [
      { id: 'PDPU-1', name: 'Fino' },
      { id: 'PDPU-2', name: 'Nanda' },
      { id: 'PDPU-3', name: 'Alvin' },
    ],
  },
];

function initials(name){
  return name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
}
