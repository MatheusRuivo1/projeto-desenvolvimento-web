
-- 1. Cria o banco de dados (caso não exista)
CREATE DATABASE IF NOT EXISTS escola_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE escola_db;

-- 2. Cria a tabela de notas
CREATE TABLE IF NOT EXISTS notas (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  aluno_id    VARCHAR(20)   NOT NULL,
  aluno_nome  VARCHAR(100)  NOT NULL,
  nota        DECIMAL(4,1)  NOT NULL CHECK (nota >= 0 AND nota <= 10),
  periodo     VARCHAR(30)   NOT NULL,
  criado_em   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Dados de exemplo para você já ver funcionando
INSERT INTO notas (aluno_id, aluno_nome, nota, periodo) VALUES
  ('2024001', 'Ana Luísa Ferreira', 9.2, '1º Semestre'),
  ('2024002', 'Bruno Costa',        7.5, '1º Semestre'),
  ('2024003', 'Camila Souza',       5.8, '2º Semestre'),
  ('2024004', 'Diego Almeida',      3.4, '2º Semestre');

-- 4. Confirma o que foi criado
SELECT 'Banco criado com sucesso!' AS status;
SELECT * FROM notas;