-- ============================================================
-- EDUSYSTEM — Criação do banco de dados MySQL
-- Como executar:
--   mysql -u root -p < banco.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS edusystem
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE edusystem;

-- ============================================================
-- TABELA: materias
-- ============================================================
CREATE TABLE IF NOT EXISTS materias (
  id           INT         NOT NULL,
  nome         VARCHAR(50) NOT NULL,
  id_professor INT         NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_nome CHECK (
    nome IN ('Matemática','Português','História','Geografia','Ciências')
  )
);

-- ============================================================
-- DADOS INICIAIS
-- INSERT IGNORE evita erro ao rodar o script mais de uma vez
-- ============================================================
INSERT IGNORE INTO materias (id, nome, id_professor) VALUES
  (101, 'Matemática', 2024001),
  (102, 'Português',  2024002);
