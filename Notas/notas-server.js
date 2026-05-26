const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = 3000;

// ── Middlewares ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve o index.html na raiz

// ── Conexão com o MySQL ──────────────────────────────────────
// ⚠️  Altere user/password conforme seu MySQL local
const pool = mysql.createPool({
  host     : 'localhost',
  user     : 'root',       // seu usuário MySQL
  password : '',           // sua senha MySQL (deixe vazio se não tiver)
  database : 'escola_db',
  waitForConnections: true,
  connectionLimit: 10,
});

// Testa a conexão ao iniciar
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅  Conectado ao MySQL — banco: escola_db');
    conn.release();
  } catch (err) {
    console.error('❌  Erro ao conectar no MySQL:', err.message);
    console.error('    → Verifique user/password em server.js e se o banco foi criado via banco.sql');
  }
})();

// ── ROTAS CRUD ───────────────────────────────────────────────

// GET /notas — Lista todas as notas
app.get('/notas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notas ORDER BY criado_em DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// POST /notas — Cria uma nova nota
app.post('/notas', async (req, res) => {
  const { aluno_id, aluno_nome, nota, periodo } = req.body;

  if (!aluno_id || !aluno_nome || nota === undefined || !periodo) {
    return res.status(400).json({ ok: false, erro: 'Todos os campos são obrigatórios.' });
  }
  if (nota < 0 || nota > 10) {
    return res.status(400).json({ ok: false, erro: 'Nota deve estar entre 0 e 10.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO notas (aluno_id, aluno_nome, nota, periodo) VALUES (?, ?, ?, ?)',
      [aluno_id, aluno_nome, nota, periodo]
    );
    const [rows] = await pool.query('SELECT * FROM notas WHERE id = ?', [result.insertId]);
    res.status(201).json({ ok: true, mensagem: 'Nota criada com sucesso!', data: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// PUT /notas/:id — Atualiza uma nota existente
app.put('/notas/:id', async (req, res) => {
  const { id } = req.params;
  const { aluno_nome, nota, periodo } = req.body;

  if (!aluno_nome || nota === undefined || !periodo) {
    return res.status(400).json({ ok: false, erro: 'Todos os campos são obrigatórios.' });
  }
  if (nota < 0 || nota > 10) {
    return res.status(400).json({ ok: false, erro: 'Nota deve estar entre 0 e 10.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE notas SET aluno_nome = ?, nota = ?, periodo = ? WHERE id = ?',
      [aluno_nome, nota, periodo, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, erro: 'Nota não encontrada.' });
    }
    const [rows] = await pool.query('SELECT * FROM notas WHERE id = ?', [id]);
    res.json({ ok: true, mensagem: 'Nota atualizada com sucesso!', data: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// DELETE /notas/:id — Remove uma nota
app.delete('/notas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM notas WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, erro: 'Nota não encontrada.' });
    }
    res.json({ ok: true, mensagem: 'Nota excluída com sucesso!' });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ── Inicia o servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋  Acesse o sistema em http://localhost:${PORT}/index.html`);
});