// Dependências principais
const express = require("express"); // Framework web leve
const mysql = require("mysql2"); // Cliente MySQL (com suporte a Promises se necessário)
const path = require("path"); // Utilitários de caminho de arquivos
const fs = require("fs"); // Acesso ao sistema de arquivos (usado para ler certificados)
const app = express();
require("dotenv").config(); // Carrega variáveis de ambiente do arquivo .env

// Middleware para parse de corpo de requisições
// - `express.json()` permite receber requisições com JSON no body
// - `express.urlencoded()` permite receber dados de formulários (application/x-www-form-urlencoded)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (HTML, CSS, JS) a partir da pasta `public`
// Ex.: acesso a `/styles.css` será servido por `public/styles.css`
app.use(express.static(path.join(__dirname, "public")));

// Configuração e criação da conexão com o banco MySQL
// As credenciais e configurações são carregadas via variáveis de ambiente
// e o `ssl.ca` carrega um certificado local (ca.pem) para conexões seguras, se necessário.
const conexao = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        // Arquivo `ca.pem` é lido do disco para validar o certificado do servidor MySQL
        ca: fs.readFileSync("ca.pem")
    }
});

// Tenta estabelecer a conexão com o banco. Loga erro ou sucesso no console.
conexao.connect((erro) => {
    if (erro) {
        console.log("Erro ao conectar:", erro);
        return;
    }

    console.log("Conectado ao MySQL!");
});

// Rota: página inicial
// Envia o arquivo `public/index.html` como resposta quando a raiz `/` é acessada
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota: cadastro de segredo
// Recebe `segredo` e `categoria` no corpo da requisição (POST) e insere na tabela `segredos`
app.post("/cadastro", (req, res) => {
    const { segredo, categoria } = req.body; // Extrai os campos enviados pelo cliente

    const sql = "INSERT INTO segredos(segredo, categoria) VALUES (?, ?)"; // Query parametrizada para evitar SQL injection

    // Executa a query usando parâmetros; callback recebe erro (se houver)
    conexao.query(sql, [segredo, categoria], (erro) => {
        if (erro) {
            console.log(erro);
            // Em caso de erro, retorna mensagem simples ao cliente (poderia ser melhorada)
            return res.send("Erro ao cadastrar o segredo.");
        }

        // Sucesso: informa ao cliente
        res.send("Segredo cadastrado com sucesso!");
    });
});

// Rota: listar todos os segredos
// Responde com JSON contendo todas as linhas da tabela `segredos`
app.get("/segredos", (req, res) => {
    console.log("Rota /segredos foi acessada");

    // Executa SELECT simples; em caso de sucesso retorna JSON com os resultados
    conexao.query("SELECT * FROM segredos", (erro, resultados) => {
        console.log("Entrou no callback");

        if (erro) {
            console.log("Erro:", erro);
            // Retorna a mensagem de erro para o cliente
            return res.send(erro.message);
        }

        // Retorna os registros em formato JSON
        res.json(resultados);
    });
});

// Porta do servidor: usa variável de ambiente `PORT` ou 3000 por padrão
const PORT = process.env.PORT || 3000;

// Inicia o servidor escutando em todas as interfaces (0.0.0.0)
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
// atualização para novo deploy