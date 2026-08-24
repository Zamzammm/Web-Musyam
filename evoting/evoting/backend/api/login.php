<?php
/**
 * POST /backend/api/login.php
 * Body: { "code": "NIS atau Token" }
 *
 * Memverifikasi bahwa kode terdaftar dan belum pernah dipakai memilih,
 * lalu menerbitkan session_token sekali pakai yang berlaku singkat
 * (default 20 menit) untuk dipakai di halaman pemilihan.
 */
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'message' => 'Metode tidak diizinkan.'], 405);
}

$body = read_json_body();
$code = trim($body['code'] ?? '');

if ($code === '') {
    json_response(['ok' => false, 'message' => 'Kode wajib diisi.'], 400);
}

$pdo = get_pdo();

$stmt = $pdo->prepare('SELECT id, has_voted FROM voters WHERE code = ? LIMIT 1');
$stmt->execute([$code]);
$voter = $stmt->fetch();

if (!$voter) {
    json_response(['ok' => false, 'message' => 'Kode NIS/Token tidak terdaftar.'], 404);
}

if ((int) $voter['has_voted'] === 1) {
    json_response(['ok' => false, 'message' => 'Kode ini sudah pernah digunakan untuk memilih.'], 409);
}

// Buat session token sekali-pakai yang kedaluwarsa singkat.
$sessionToken = bin2hex(random_bytes(32));
$expiresAt = (new DateTime('+20 minutes'))->format('Y-m-d H:i:s');

// Hapus sesi lama milik voter ini (jika ada) sebelum membuat yang baru.
$pdo->prepare('DELETE FROM voting_sessions WHERE voter_id = ?')->execute([$voter['id']]);

$stmt = $pdo->prepare(
    'INSERT INTO voting_sessions (session_token, voter_id, expires_at) VALUES (?, ?, ?)'
);
$stmt->execute([$sessionToken, $voter['id'], $expiresAt]);

json_response(['ok' => true, 'session_token' => $sessionToken]);
