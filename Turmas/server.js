const express = require('express');
const cors    = require('cors');
const path    = require('path');
const mysql   = require('mysql2');

const app  = express();
const PORT = 3000;

const db = mysql.createConnection({
  host:     'localhost',
  user:     'root',
  password: '',
  database: 'edusystem'
});

db.connect((erro) => {
  if (erro) {
    console.error('Erro ao conectar ao MySQL:', erro.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao MySQL.');
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Listar todas as turmas
app.get('/api/turmas', (req, res) => {
  db.query('SELECT * FROM turmas ORDER BY id ASC', (erro, resultado) => {
    if (erro) {
      console.error('[GET /api/turmas]', erro.message);
      return res.status(500).json({ sucesso: false, mensagem: erro.message });
    }
    res.json({ sucesso: true, dados: resultado });
  });
});

// Buscar turma por ID
app.get('/api/turmas/:id', (req, res) => {
  db.query('SELECT * FROM turmas WHERE id = ?', [req.params.id], (erro, resultado) => {
    if (erro) {
      console.error('[GET /api/turmas/:id]', erro.message);
      return res.status(500).json({ sucesso: false, mensagem: erro.message });
    }
    if (!resultado.length) return res.status(404).json({ sucesso: false, mensagem: 'Turma não encontrada.' });
    res.json({ sucesso: true, dados: resultado[0] });
  });
});

// Criar nova turma
app.post('/api/turmas', (req, res) => {
  const { nome, ano } = req.body;

  if (!nome?.trim()) return res.status(400).json({ sucesso: false, mensagem: 'O nome da turma é obrigatório.' });
  if (!ano?.trim())  return res.status(400).json({ sucesso: false, mensagem: 'O ano letivo é obrigatório.' });

  db.query('SELECT id FROM turmas WHERE UPPER(nome) = UPPER(?) AND ano = ?', [nome.trim(), ano.trim()], (erro, resultado) => {
    if (erro) {
      console.error('[POST /api/turmas - duplicata]', erro.message);
      return res.status(500).json({ sucesso: false, mensagem: erro.message });
    }
    if (resultado.length) return res.status(409).json({ sucesso: false, mensagem: `Turma "${nome}" já cadastrada em ${ano}.` });

    const cadastro = new Date().toLocaleDateString('pt-BR');
    db.query('INSERT INTO turmas (nome, ano, cadastro) VALUES (?, ?, ?)', [nome.trim(), ano.trim(), cadastro], (erro, resultado) => {
      if (erro) {
        console.error('[POST /api/turmas - insert]', erro.message);
        return res.status(500).json({ sucesso: false, mensagem: erro.message });
      }

      db.query('SELECT * FROM turmas WHERE id = ?', [resultado.insertId], (erro, nova) => {
        if (erro) {
          console.error('[POST /api/turmas - select]', erro.message);
          return res.status(500).json({ sucesso: false, mensagem: erro.message });
        }
        res.status(201).json({ sucesso: true, dados: nova[0], mensagem: 'Turma cadastrada com sucesso!' });
      });
    });
  });
});

// Atualizar turma
app.put('/api/turmas/:id', (req, res) => {
  const { id }        = req.params;
  const { nome, ano } = req.body;

  if (!nome?.trim()) return res.status(400).json({ sucesso: false, mensagem: 'O nome da turma é obrigatório.' });
  if (!ano?.trim())  return res.status(400).json({ sucesso: false, mensagem: 'O ano letivo é obrigatório.' });

  db.query('SELECT id FROM turmas WHERE id = ?', [id], (erro, resultado) => {
    if (erro) {
      console.error('[PUT /api/turmas - select]', erro.message);
      return res.status(500).json({ sucesso: false, mensagem: erro.message });
    }
    if (!resultado.length) return res.status(404).json({ sucesso: false, mensagem: 'Turma não encontrada.' });

    db.query('UPDATE turmas SET nome = ?, ano = ? WHERE id = ?', [nome.trim(), ano.trim(), id], (erro) => {
      if (erro) {
        console.error('[PUT /api/turmas - update]', erro.message);
        return res.status(500).json({ sucesso: false, mensagem: erro.message });
      }

      db.query('SELECT * FROM turmas WHERE id = ?', [id], (erro, atualizada) => {
        if (erro) {
          console.error('[PUT /api/turmas - select final]', erro.message);
          return res.status(500).json({ sucesso: false, mensagem: erro.message });
        }
        res.json({ sucesso: true, dados: atualizada[0], mensagem: 'Turma atualizada com sucesso!' });
      });
    });
  });
});

// Excluir turma
app.delete('/api/turmas/:id', (req, res) => {
  db.query('SELECT * FROM turmas WHERE id = ?', [req.params.id], (erro, resultado) => {
    if (erro) {
      console.error('[DELETE /api/turmas - select]', erro.message);
      return res.status(500).json({ sucesso: false, mensagem: erro.message });
    }
    if (!resultado.length) return res.status(404).json({ sucesso: false, mensagem: 'Turma não encontrada.' });

    const turma = resultado[0];
    db.query('DELETE FROM turmas WHERE id = ?', [req.params.id], (erro) => {
      if (erro) {
        console.error('[DELETE /api/turmas]', erro.message);
        return res.status(500).json({ sucesso: false, mensagem: erro.message });
      }
      res.json({ sucesso: true, mensagem: `Turma "${turma.nome}" removida com sucesso!` });
    });
  });
});

// Estatísticas dos cards
app.get('/api/stats', (req, res) => {
  db.query('SELECT COUNT(*) AS total FROM turmas', (erro, r1) => {
    if (erro) {
      console.error('[GET /api/stats - total]', erro.message);
      return res.status(500).json({ sucesso: false, mensagem: erro.message });
    }

    db.query('SELECT COUNT(DISTINCT ano) AS total FROM turmas', (erro, r2) => {
      if (erro) {
        console.error('[GET /api/stats - anos]', erro.message);
        return res.status(500).json({ sucesso: false, mensagem: erro.message });
      }

      db.query('SELECT ano, COUNT(*) AS total FROM turmas GROUP BY ano ORDER BY ano DESC', (erro, r3) => {
        if (erro) {
          console.error('[GET /api/stats - porAno]', erro.message);
          return res.status(500).json({ sucesso: false, mensagem: erro.message });
        }

        res.json({
          sucesso: true,
          dados: {
            total:         r1[0].total,
            anosDistintos: r2[0].total,
            porAno:        r3
          }
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EduSystem rodando em http://localhost:${PORT}`);
});
