const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const fs = require("fs");
const app = express();
require("dotenv").config();

// Permite receber dados em JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pasta dos arquivos HTML, CSS e JS
app.use(express.static(path.join(__dirname, "public")));

// Conexão com o MySQL
const conexao = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        ca: fs.readFileSync("ca.pem")
    }
});

conexao.connect((erro) => {
    if (erro) {
        console.log("Erro ao conectar:", erro);
        return;
    }

    console.log("Conectado ao MySQL!");
});

// Página inicial
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Cadastro
app.post("/cadastro", (req, res) => {

    const { nome, idade } = req.body;

    const sql = "INSERT INTO pessoas(nome, idade) VALUES (?, ?)";

    conexao.query(sql, [nome, idade], (erro) => {

        if (erro) {
            console.log(erro);
            return res.send("Erro ao cadastrar.");
        }

        res.send("Cadastro realizado com sucesso!");
    });

});

// Consulta
app.get("/pessoas", (req, res) => {

    console.log("Rota /pessoas foi acessada");

    conexao.query("SELECT * FROM pessoas", (erro, resultados) => {

        console.log("Entrou no callback");

        if (erro) {
            console.log("Erro:", erro);
            return res.send(erro.message);
        }

        res.json(resultados);

    });

});
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
// atualização para novo deploy