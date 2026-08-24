-- =====================================================================
-- Skema Database: E-Voting Musyawarah Ambalan 2026/2027
-- Engine: MySQL / MariaDB
-- =====================================================================

CREATE DATABASE IF NOT EXISTS evoting_ambalan
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE evoting_ambalan;

-- ---------------------------------------------------------------------
-- Peserta yang berhak memilih. `code` adalah NIS atau token unik yang
-- dibagikan panitia. `has_voted` menjadi sumber kebenaran tunggal untuk
-- mencegah double voting — dikunci lewat transaksi di vote.php.
-- ---------------------------------------------------------------------
CREATE TABLE voters (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120)        NOT NULL,
  code          VARCHAR(40)         NOT NULL UNIQUE,   -- NIS atau token
  has_voted     TINYINT(1)          NOT NULL DEFAULT 0,
  voted_at      DATETIME            NULL,
  created_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Sesi login sementara. Dibuat saat login.php memverifikasi kode,
-- ditukar sekali pakai saat vote.php memproses suara, lalu dihapus.
-- Mencegah pengiriman suara tanpa melalui proses login yang sah.
-- ---------------------------------------------------------------------
CREATE TABLE voting_sessions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  session_token  CHAR(64)        NOT NULL UNIQUE,
  voter_id       INT             NOT NULL,
  expires_at     DATETIME        NOT NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Kategori pemilihan (Pemangku Adat Putri/Putra, Pradana Putri/Putra, dst).
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id      VARCHAR(40)   PRIMARY KEY,   -- slug, mis. 'pradana_putra'
  label   VARCHAR(120)  NOT NULL,
  short   VARCHAR(60)   NOT NULL       -- nama singkat untuk UI bilik suara
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Kandidat per kategori.
-- ---------------------------------------------------------------------
CREATE TABLE candidates (
  id            VARCHAR(20)   PRIMARY KEY,   -- mis. 'PDPU-1'
  category_id   VARCHAR(40)   NOT NULL,
  name          VARCHAR(120)  NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Satu baris = satu suara sah untuk satu kategori dari satu voter.
-- UNIQUE(voter_id, category_id) adalah pengaman tingkat database
-- terhadap double voting per kategori, di atas pengecekan has_voted.
-- Suara TIDAK menyimpan urutan pemilih supaya kerahasiaan tetap terjaga
-- secara wajar (tabel votes tidak memiliki timestamp per-pemilih yang
-- bisa dikorelasikan balik ke voters lewat log aplikasi).
-- ---------------------------------------------------------------------
CREATE TABLE votes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  voter_id      INT           NOT NULL,
  category_id   VARCHAR(40)   NOT NULL,
  candidate_id  VARCHAR(20)   NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_voter_category (voter_id, category_id),
  FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Data awal kategori & kandidat sesuai daftar yang diberikan.
-- ---------------------------------------------------------------------
INSERT INTO categories (id, label, short) VALUES
  ('pemangku_putri', 'Pemangku Adat Putri', 'Adat Putri'),
  ('pemangku_putra', 'Pemangku Adat Putra', 'Adat Putra'),
  ('pradana_putri',  'Pradana Putri', 'Pradana Putri'),
  ('pradana_putra',  'Pradana Putra', 'Pradana Putra');

INSERT INTO candidates (id, category_id, name) VALUES
  ('PAP-1',  'pemangku_putri', 'Fradilla'),
  ('PAP-2',  'pemangku_putri', 'Echa'),
  ('PAPU-1', 'pemangku_putra', 'Catur'),
  ('PAPU-2', 'pemangku_putra', 'Bijar'),
  ('PDP-1',  'pradana_putri',  'Sabrina'),
  ('PDP-2',  'pradana_putri',  'Shaqira'),
  ('PDP-3',  'pradana_putri',  'Shifana'),
  ('PDPU-1', 'pradana_putra',  'Fino'),
  ('PDPU-2', 'pradana_putra',  'Nanda'),
  ('PDPU-3', 'pradana_putra',  'Alvin');

-- Contoh mengisi daftar peserta (panitia mengganti dengan data asli):
-- INSERT INTO voters (full_name, code) VALUES ('Contoh Nama', '2425-0001');
