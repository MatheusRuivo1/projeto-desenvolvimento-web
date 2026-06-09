// Importação das bibliotecas necessárias
const express = require("express");
const cors    = require("cors");
const mysql   = require("mysql2");

// Criação do servidor Express
const app = express();

// Definição da porta do servidor
const port = 3000;

// Configurações do Express
app.use(express.json());

// Configuração do CORS
app.use(cors());

// ============================================================
// CONEXÃO COM O BANCO DE DADOS MySQL
// Altere user e password conforme o seu ambiente local
// ============================================================
const db = mysql.createConnection({
  host:     "localhost",
  user:     "root",  // seu usuário MySQL
  password: "",      // sua senha MySQL
  database: "edusystem",
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL:", err.message);
    process.exit(1);
  }
  console.log("Conectado ao banco de dados MySQL — edusystem");
});

// ============================================================
// GET /materias/stats
// Retorna os contadores para os cards do frontend
// ⚠️ Deve ficar ANTES de /materias/:id
// ============================================================
app.get("/materias/stats", (req, res) => {
  console.log("get stats");

  const sql = `
    SELECT
      COUNT(*)                                     AS total,
      SUM(nome = 'Matemática')                     AS matematica,
      SUM(nome = 'Português')                      AS portugues,
      SUM(nome NOT IN ('Matemática','Português'))  AS outras,
      COUNT(DISTINCT id_professor)                 AS professores
    FROM materias
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar stats:", err.message);
      return res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
    res.json(results[0]);
  });
});

// ============================================================
// GET /materias
// Retorna a lista de todas as matérias
// ============================================================
app.get("/materias", (req, res) => {
  console.log("get");

  db.query("SELECT * FROM materias", (err, results) => {
    if (err) {
      console.error("Erro ao listar matérias:", err.message);
      return res.status(500).json({ message: "Erro ao buscar matérias" });
    }
    res.json(results);
  });
});

// ============================================================
// GET /materias/:id
// Retorna uma matéria pelo ID
// ============================================================
app.get("/materias/:id", (req, res) => {
  console.log("get by id");

  const id = parseInt(req.params.id);

  db.query("SELECT * FROM materias WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar matéria:", err.message);
      return res.status(500).json({ message: "Erro ao buscar matéria" });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: "Matéria não encontrada" });
    }
  });
});

// ============================================================
// POST /materias
// Cria uma nova matéria
// Body: { id, nome, id_professor }
// ============================================================
app.post("/materias", (req, res) => {
  console.log("post");

  const newMateria = req.body;

  // Valida campos obrigatórios
  if (!newMateria.id || !newMateria.nome || !newMateria.id_professor) {
    return res.status(400).json({ message: "Campos id, nome e id_professor são obrigatórios" });
  }

  // Valida nome (espelha o <select> do frontend)
  const nomesValidos = ["Matemática", "Português", "História", "Geografia", "Ciências"];
  if (!nomesValidos.includes(newMateria.nome)) {
    return res.status(400).json({ message: `Nome inválido. Use: ${nomesValidos.join(", ")}` });
  }

  const sql    = "INSERT INTO materias (id, nome, id_professor) VALUES (?, ?, ?)";
  const valores = [newMateria.id, newMateria.nome, newMateria.id_professor];

  db.query(sql, valores, (err) => {
    if (err) {
      // Erro 1062 = PRIMARY KEY duplicada no MySQL
      if (err.errno === 1062) {
        return res.status(409).json({ message: "Já existe uma matéria com esse ID" });
      }
      console.error("Erro ao criar matéria:", err.message);
      return res.status(500).json({ message: "Erro ao criar matéria" });
    }
    res.status(201).json(newMateria);
  });
});

// ============================================================
// PUT /materias/:id
// Atualiza uma matéria existente
// Body: { nome, id_professor }
// ============================================================
app.put("/materias/:id", (req, res) => {
  console.log("put");

  const idOriginal = parseInt(req.params.id);
  const { id: novoId, nome, id_professor } = req.body;

  // Valida campos obrigatórios
  if (!novoId || !nome || !id_professor) {
    return res.status(400).json({ message: "Campos id, nome e id_professor são obrigatórios" });
  }

  // Valida nome
  const nomesValidos = ["Matemática", "Português", "História", "Geografia", "Ciências"];
  if (!nomesValidos.includes(nome)) {
    return res.status(400).json({ message: `Nome inválido. Use: ${nomesValidos.join(", ")}` });
  }

  // Verifica se o registro original existe
  db.query("SELECT * FROM materias WHERE id = ?", [idOriginal], (err, results) => {
    if (err) {
      console.error("Erro ao buscar matéria:", err.message);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Matéria não encontrada" });
    }

    // Se o ID não mudou, faz UPDATE simples
    if (parseInt(novoId) === idOriginal) {
      const sql    = "UPDATE materias SET nome = ?, id_professor = ? WHERE id = ?";
      const valores = [nome, parseInt(id_professor), idOriginal];

      db.query(sql, valores, (err) => {
        if (err) {
          console.error("Erro ao atualizar:", err.message);
          return res.status(500).json({ message: "Erro ao atualizar matéria" });
        }
        res.json({ id: idOriginal, nome, id_professor: parseInt(id_professor) });
      });

    } else {
      // Se o ID mudou: verifica se o novo ID já existe
      db.query("SELECT * FROM materias WHERE id = ?", [parseInt(novoId)], (err, results) => {
        if (err) {
          console.error("Erro ao verificar novo ID:", err.message);
          return res.status(500).json({ message: "Erro interno do servidor" });
        }
        if (results.length > 0) {
          return res.status(409).json({ message: "Já existe uma matéria com esse novo ID" });
        }

        // Deleta o registro antigo e insere com o novo ID
        db.query("DELETE FROM materias WHERE id = ?", [idOriginal], (err) => {
          if (err) {
            console.error("Erro ao deletar registro antigo:", err.message);
            return res.status(500).json({ message: "Erro ao atualizar matéria" });
          }

          const sql    = "INSERT INTO materias (id, nome, id_professor) VALUES (?, ?, ?)";
          const valores = [parseInt(novoId), nome, parseInt(id_professor)];

          db.query(sql, valores, (err) => {
            if (err) {
              console.error("Erro ao inserir novo registro:", err.message);
              return res.status(500).json({ message: "Erro ao atualizar matéria" });
            }
            res.json({ id: parseInt(novoId), nome, id_professor: parseInt(id_professor) });
          });
        });
      });
    }
  });
});

// ============================================================
// DELETE /materias/:id
// Remove uma matéria pelo ID
// ============================================================
app.delete("/materias/:id", (req, res) => {
  console.log("delete");

  const id = parseInt(req.params.id);

  // Busca antes de deletar para devolver o objeto removido
  db.query("SELECT * FROM materias WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar matéria:", err.message);
      return res.status(500).json({ message: "Erro ao remover matéria" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Matéria não encontrada" });
    }

    const materiaRemovida = results[0];

    db.query("DELETE FROM materias WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Erro ao deletar matéria:", err.message);
        return res.status(500).json({ message: "Erro ao remover matéria" });
      }
      res.json(materiaRemovida);
    });
  });
});

// ============================================================
// Inicia o servidor
// ============================================================
app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});
