const express = require("express");
const cors = require("cors");
const mysql = require("mysql2"); // Utiliza o mysql2 para o Workbench

const app = express();
const port = 3001; // Porta do seu servidor back-end

app.use(express.json());
app.use(cors());

console.log("1. Iniciando conexão com MySQL Workbench...");

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // COLOQUE A SUA SENHA DO WORKBENCH AQUI SE TIVER (Ex: '1234' ou 'root')
    database: 'escola', // Nome do banco de dados do Workbench
    port: 3306
});

console.log("2. Tentando conectar...");

connection.connect(error => {
    if (error) {
        console.log("3. ERRO DE CONEXÃO:", error.message);
        return;
    }
    console.log("3. Conectado ao MySQL Workbench com sucesso (Banco: escola)!");
});

console.log("4. Configurando rotas...");

// Rota para listar todos os alunos (GET)
app.get("/alunos", (req, res) => {
    const sql = "SELECT * FROM alunos";
    connection.query(sql, (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        console.log("GET - Retornando", results.length, "alunos");
        res.json(results);
    });
});

// Rota para obter um aluno por ID (GET)
app.get("/alunos/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM alunos WHERE id = ?";
    connection.query(sql, [id], (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ message: "Aluno não encontrado" });
        }
    });
});

// Rota para adicionar um novo aluno (POST)
app.post("/alunos", (req, res) => {
    const dados = {
        nome: req.body.nome,
        idade: req.body.idade,
        email: req.body.email,
        id_turma: req.body.id_turma
    };
    console.log("POST - Cadastrando aluno:", dados);
    
    const sql = "INSERT INTO alunos SET ?";
    connection.query(sql, dados, (error, results) => {
        if (error) {
            console.error("Erro no INSERT:", error);
            return res.status(500).json({ error: error.message });
        }
        console.log("POST - Cadastrado com ID:", results.insertId);
        // Retorna o objeto com o ID gerado pelo Workbench
        res.status(201).json({ id: results.insertId, ...dados });
    });
});

// Rota para atualizar um aluno (PUT)
app.put("/alunos/:id", (req, res) => {
    const id = req.params.id;
    const dados = {
        nome: req.body.nome,
        idade: req.body.idade,
        email: req.body.email,
        id_turma: req.body.id_turma
    };
    console.log("PUT - Atualizando Aluno ID:", id, dados);
    
    const sql = "UPDATE alunos SET ? WHERE id = ?";
    connection.query(sql, [dados, id], (error, result) => {
        if (error) return res.status(500).json({ error: error.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Aluno não encontrado" });
        }
        
        console.log("PUT - Linhas afetadas:", result.affectedRows);
        res.json({ id: Number(id), ...dados });
    });
});

// Rota para remover um aluno (DELETE)
app.delete("/alunos/:id", (req, res) => {
    const id = req.params.id;
    console.log("DELETE - Tentando remover Aluno ID:", id);
    
    const sql = "DELETE FROM alunos WHERE id = ?";
    connection.query(sql, [id], (error, result) => {
        if (error) {
            console.error("DELETE - Erro:", error);
            return res.status(500).json({ error: error.message });
        }
        
        if (result.affectedRows === 0) {
            console.log("DELETE - ID não encontrado:", id);
            return res.status(404).json({ error: "Aluno não encontrado" });
        }
        
        console.log("DELETE - Aluno removido com sucesso!");
        res.json({ message: "Aluno removido com sucesso", id: Number(id) });
    });
});

console.log("5. Iniciando servidor...");

app.listen(port, () => {
    console.log("6. Servidor rodando na porta " + port);
});

console.log("7. Código finalizado, aguardando...");