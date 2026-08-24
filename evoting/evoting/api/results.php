<?php
/**
 * GET /api/results.php
 *
 * Mengembalikan rekap suara per kategori/kandidat serta statistik
 * partisipasi, untuk dikonsumsi dashboard panitia (admin.html + Chart.js).
 *
 * ⚠️ PRODUKSI: endpoint ini WAJIB dilindungi autentikasi panitia
 * sungguhan (misal session PHP setelah login admin, atau token API),
 * bukan hanya gerbang kata sandi di sisi klien (js/admin.js). Tambahkan
 * pengecekan session di sini sebelum query dijalankan.
 */
require_once __DIR__ . '/../backend/config.php';

// require_admin_session(); // <-- aktifkan setelah autentikasi panitia dibuat

$pdo = get_pdo();

$totalRegistered = (int) $pdo->query('SELECT COUNT(*) c FROM voters')->fetch()['c'];
$totalVoted = (int) $pdo->query('SELECT COUNT(*) c FROM voters WHERE has_voted = 1')->fetch()['c'];

$rows = $pdo->query(
    'SELECT category_id, candidate_id, COUNT(*) AS votes
     FROM votes
     GROUP BY category_id, candidate_id'
)->fetchAll();

$results = [];
foreach ($rows as $row) {
    $results[$row['category_id']][$row['candidate_id']] = (int) $row['votes'];
}

json_response([
    'ok' => true,
    'total_registered' => $totalRegistered,
    'total_voted' => $totalVoted,
    'results' => $results,
]);
