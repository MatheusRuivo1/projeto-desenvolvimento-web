-- Cria e seleciona o banco
CREATE DATABASE IF NOT EXISTS edusystem
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE edusystem;

-- Tabela de turmas
CREATE TABLE IF NOT EXISTS turmas (
  id       INT          NOT NULL AUTO_INCREMENT,
  nome     VARCHAR(10)  NOT NULL,
  ano      YEAR         NOT NULL,
  cadastro VARCHAR(10)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_turma_ano (nome, ano)
);

-- Dados de exemplo
INSERT INTO turmas (nome, ano, cadastro) VALUES
  ('1°A', 2026, '19/05/2026'),
  ('1°B', 2026, '19/05/2026'),
  ('2°A', 2026, '19/05/2026'),
  ('2°B', 2025, '19/05/2026'),
  ('3°A', 2025, '19/05/2026'),
  ('3°C', 2024, '19/05/2026');
