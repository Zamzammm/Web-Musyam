<?php
/**
 * Konfigurasi koneksi database.
 * GANTI nilai di bawah sesuai kredensial hosting/server Anda, atau lebih
 * baik lagi, muat dari environment variable saat deploy ke production.
 */
define('DB_HOST', getenv('EVOTING_DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('EVOTING_DB_NAME') ?: 'evoting_ambalan');
define('DB_USER', getenv('EVOTING_DB_USER') ?: 'root');
define('DB_PASS', getenv('EVOTING_DB_PASS') ?: 'inyong123');

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function json_response(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
