<?php
/**
 * POST /backend/api/vote.php
 * Body: {
 *   "session_token": "...",
 *   "selections": { "pemangku_putri": "PAP-1", "pradana_putra": "PDPU-2", ... }
 * }
 *
 * Memvalidasi sesi, memastikan seluruh kategori terisi, lalu menyimpan
 * suara dan mengunci voter (has_voted = 1) dalam SATU transaksi database
 * agar tidak mungkin terjadi race condition / double voting walau
 * permintaan datang bersamaan.
 */
require_once __DIR__ . '/../backend/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'message' => 'Metode tidak diizinkan.'], 405);
}

$body = read_json_body();
$sessionToken = trim($body['session_token'] ?? '');
$selections = $body['selections'] ?? [];

if ($sessionToken === '' || !is_array($selections)) {
    json_response(['ok' => false, 'message' => 'Permintaan tidak lengkap.'], 400);
}

$requiredCategories = ['pemangku_putri', 'pemangku_putra', 'pradana_putri', 'pradana_putra'];
foreach ($requiredCategories as $catId) {
    if (empty($selections[$catId])) {
        json_response(['ok' => false, 'message' => "Kategori \"$catId\" belum dipilih."], 400);
    }
}

$pdo = get_pdo();

try {
    $pdo->beginTransaction();

    // 1. Validasi sesi masih berlaku dan kunci baris voter (FOR UPDATE)
    //    supaya dua request bersamaan tidak lolos bersamaan.
    $stmt = $pdo->prepare(
        'SELECT vs.voter_id, vs.expires_at, v.has_voted
         FROM voting_sessions vs
         JOIN voters v ON v.id = vs.voter_id
         WHERE vs.session_token = ?
         FOR UPDATE'
    );
    $stmt->execute([$sessionToken]);
    $session = $stmt->fetch();

    if (!$session) {
        throw new RuntimeException('Sesi tidak ditemukan. Silakan login ulang.', 401);
    }
    if (strtotime($session['expires_at']) < time()) {
        throw new RuntimeException('Sesi sudah kedaluwarsa. Silakan login ulang.', 401);
    }
    if ((int) $session['has_voted'] === 1) {
        throw new RuntimeException('Kode ini sudah pernah digunakan untuk memilih.', 409);
    }

    $voterId = (int) $session['voter_id'];

    // 2. Validasi tiap kandidat benar-benar milik kategorinya (anti-manipulasi payload).
    $validate = $pdo->prepare('SELECT 1 FROM candidates WHERE id = ? AND category_id = ?');
    foreach ($selections as $categoryId => $candidateId) {
        $validate->execute([$candidateId, $categoryId]);
        if (!$validate->fetch()) {
            throw new RuntimeException('Pilihan kandidat tidak valid.', 400);
        }
    }

    // 3. Simpan seluruh suara.
    $insertVote = $pdo->prepare(
        'INSERT INTO votes (voter_id, category_id, candidate_id) VALUES (?, ?, ?)'
    );
    foreach ($selections as $categoryId => $candidateId) {
        $insertVote->execute([$voterId, $categoryId, $candidateId]);
    }

    // 4. Kunci voter agar tidak bisa memilih lagi, lalu hapus sesi.
    $pdo->prepare('UPDATE voters SET has_voted = 1, voted_at = NOW() WHERE id = ?')
        ->execute([$voterId]);
    $pdo->prepare('DELETE FROM voting_sessions WHERE session_token = ?')
        ->execute([$sessionToken]);

    $pdo->commit();
    json_response(['ok' => true]);

} catch (RuntimeException $e) {
    $pdo->rollBack();
    json_response(['ok' => false, 'message' => $e->getMessage()], (int) $e->getCode() ?: 400);
} catch (Throwable $e) {
    $pdo->rollBack();
    json_response(['ok' => false, 'message' => 'Terjadi kesalahan pada server.'], 500);
}
