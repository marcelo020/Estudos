"use strict";
require("dotenv").config();

const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const cors    = require("cors");
const mysql   = require("mysql2/promise");

const app  = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET  = process.env.JWT_SECRET || "lanche-feliz-segredo-local-2026";
const JWT_EXPIRES = "8h";

// Hash abaixo = bcrypt("1234", 10)
// Para alterar: node -e "require('bcryptjs').hash('nova_senha',10).then(console.log)"
const USUARIOS_INTERNOS = {
    admin: {
        senhaHash: "$2a$10$hDN6cE9tZBEicTVWGjZF5OfQky/xhIp/F0JvkkGDDRDZPqSoW9bBC",
        nivel: "administrador",
        nome: "Administrador"
    },
    operador: {
        senhaHash: "$2a$10$hDN6cE9tZBEicTVWGjZF5OfQky/xhIp/F0JvkkGDDRDZPqSoW9bBC",
        nivel: "operador",
        nome: "Operador"
    }
};

const pool = mysql.createPool({
    host:     process.env.DB_HOST || "localhost",
    port:     parseInt(process.env.DB_PORT  || "3306"),
    user:     process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "lanchefe_liz",
    waitForConnections: true,
    connectionLimit:    10,
    timezone: "local"
});

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(__dirname));

function autenticarJWT(req, res, next) {
    const header = req.headers["authorization"] || "";
    const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ erro: "Token ausente." });
    try {
        req.usuario = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ erro: "Token invalido ou expirado." });
    }
}

function exigirNivel(...niveis) {
    return (req, res, next) => {
        if (!niveis.includes(req.usuario?.nivel))
            return res.status(403).json({ erro: "Acesso negado." });
        next();
    };
}

// POST /api/login
app.post("/api/login", async (req, res) => {
    const login = (req.body.login || "").trim().toLowerCase();
    const senha = req.body.senha  || "";

    if (!login || !senha)
        return res.status(400).json({ erro: "Login e senha sao obrigatorios." });

    const interno = USUARIOS_INTERNOS[login];
    if (interno) {
        const ok = await bcrypt.compare(senha, interno.senhaHash);
        if (!ok) return res.status(401).json({ erro: "Login ou senha invalidos." });
        const payload = { id: login, nome: interno.nome, nivel: interno.nivel, email: "" };
        return res.json({ token: jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES }), usuario: payload });
    }

    try {
        const [rows] = await pool.query(
            "SELECT id, nome, email, senha_hash FROM clientes WHERE email = ? LIMIT 1",
            [login]
        );
        if (!rows.length) return res.status(401).json({ erro: "Login ou senha invalidos." });

        const c  = rows[0];
        const ok = await bcrypt.compare(senha, c.senha_hash);
        if (!ok) return res.status(401).json({ erro: "Login ou senha invalidos." });

        const payload = { id: c.id, nome: c.nome, nivel: "cliente", email: c.email };
        return res.json({ token: jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES }), usuario: payload });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro interno." });
    }
});

// POST /api/cadastro
app.post("/api/cadastro", async (req, res) => {
    const nome   = (req.body.nome   || "").trim();
    const email  = (req.body.email  || "").trim().toLowerCase();
    const senha  = req.body.senha   || "";
    const senha2 = req.body.senha2  || "";

    if (!nome || !email || !senha || !senha2)
        return res.status(400).json({ erro: "Preencha todos os campos." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ erro: "E-mail invalido." });
    if (senha.length < 6)
        return res.status(400).json({ erro: "Senha deve ter pelo menos 6 caracteres." });
    if (senha !== senha2)
        return res.status(400).json({ erro: "As senhas nao conferem." });
    if (USUARIOS_INTERNOS[email])
        return res.status(400).json({ erro: "Login conflita com usuario interno." });

    try {
        const [existe] = await pool.query(
            "SELECT id FROM clientes WHERE email = ? LIMIT 1", [email]
        );
        if (existe.length) return res.status(409).json({ erro: "E-mail ja cadastrado." });

        const senhaHash = await bcrypt.hash(senha, 10);
        const id = Date.now();
        await pool.query(
            "INSERT INTO clientes (id, nome, email, senha_hash) VALUES (?, ?, ?, ?)",
            [id, nome, email, senhaHash]
        );
        res.status(201).json({ mensagem: "Cadastro realizado! Agora faca login." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro interno." });
    }
});

// GET /api/produtos -- publico
app.get("/api/produtos", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, nome, preco, img FROM produtos ORDER BY id");
        res.json(rows.map(r => ({ ...r, preco: parseFloat(r.preco) })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro interno." });
    }
});

// POST /api/produtos -- administrador
app.post("/api/produtos", autenticarJWT, exigirNivel("administrador"), async (req, res) => {
    const { nome, preco, img } = req.body;
    if (!nome || !preco || !img)
        return res.status(400).json({ erro: "Nome, preco e imagem sao obrigatorios." });
    try {
        const [result] = await pool.query(
            "INSERT INTO produtos (nome, preco, img) VALUES (?, ?, ?)",
            [nome.trim(), parseFloat(preco), img.trim()]
        );
        res.status(201).json({ id: result.insertId, nome: nome.trim(), preco: parseFloat(preco), img: img.trim() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro interno." });
    }
});

// PUT /api/produtos/:id -- administrador
app.put("/api/produtos/:id", autenticarJWT, exigirNivel("administrador"), async (req, res) => {
    const id = parseInt(req.params.id);
    const campos = [];
    const valores = [];

    if (req.body.nome  !== undefined) { campos.push("nome = ?");  valores.push(req.body.nome.trim()); }
    if (req.body.preco !== undefined) { campos.push("preco = ?"); valores.push(parseFloat(req.body.preco)); }
    if (req.body.img   !== undefined) { campos.push("img = ?");   valores.push(req.body.img.trim()); }

    if (!campos.length) return res.status(400).json({ erro: "Nenhum campo para atualizar." });
    valores.push(id);

    try {
        const [result] = await pool.query(
            "UPDATE produtos SET " + campos.join(", ") + " WHERE id = ?", valores
        );
        if (!result.affectedRows) return res.status(404).json({ erro: "Produto nao encontrado." });
        const [rows] = await pool.query("SELECT id, nome, preco, img FROM produtos WHERE id = ?", [id]);
        res.json({ ...rows[0], preco: parseFloat(rows[0].preco) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro interno." });
    }
});

// DELETE /api/produtos/:id -- administrador
app.delete("/api/produtos/:id", autenticarJWT, exigirNivel("administrador"), async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const [result] = await pool.query("DELETE FROM produtos WHERE id = ?", [id]);
        if (!result.affectedRows) return res.status(404).json({ erro: "Produto nao encontrado." });
        res.json({ mensagem: "Produto removido." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro interno." });
    }
});

// POST /api/vendas -- usuario autenticado
app.post("/api/vendas", autenticarJWT, async (req, res) => {
    const venda = req.body;
    if (!venda || !Array.isArray(venda.itens) || !venda.total)
        return res.status(400).json({ erro: "Dados da venda incompletos." });

    const clienteId = req.usuario.nivel === "cliente" ? req.usuario.id : null;
    const ts = venda.timestamp || Date.now();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query(
            "INSERT INTO vendas (ficha, total, forma, data_venda, timestamp_, cliente_id) VALUES (?, ?, ?, ?, ?, ?)",
            [venda.ficha, parseFloat(venda.total), venda.forma, venda.data, ts, clienteId]
        );
        const vendaId = result.insertId;

        for (const item of venda.itens) {
            await conn.query(
                "INSERT INTO venda_itens (venda_id, produto_nome, quantidade, preco_unit) VALUES (?, ?, ?, ?)",
                [vendaId, item.nome, item.qtd, parseFloat(item.preco)]
            );
        }

        await conn.commit();
        res.status(201).json({ mensagem: "Venda registrada.", id: vendaId });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ erro: "Erro ao registrar venda." });
    } finally {
        conn.release();
    }
});

// GET /api/vendas -- operador e administrador
app.get("/api/vendas", autenticarJWT, exigirNivel("operador", "administrador"), async (req, res) => {
    try {
        const [vendas] = await pool.query(
            "SELECT v.*, c.nome AS cliente_nome FROM vendas v LEFT JOIN clientes c ON c.id = v.cliente_id ORDER BY v.timestamp_ DESC"
        );
        const [itens] = await pool.query("SELECT * FROM venda_itens");

        const resultado = vendas.map(v => ({
            id: v.id,
            ficha: v.ficha,
            total: parseFloat(v.total),
            forma: v.forma,
            data: v.data_venda,
            timestamp: v.timestamp_,
            cliente: v.cliente_id ? { id: v.cliente_id, nome: v.cliente_nome } : null,
            itens: itens
                .filter(i => i.venda_id === v.id)
                .map(i => ({ nome: i.produto_nome, qtd: i.quantidade, preco: parseFloat(i.preco_unit) }))
        }));

        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro interno." });
    }
});

// GET /api/vendas/minhas -- cliente autenticado
app.get("/api/vendas/minhas", autenticarJWT, exigirNivel("cliente"), async (req, res) => {
    try {
        const [vendas] = await pool.query(
            "SELECT * FROM vendas WHERE cliente_id = ? ORDER BY timestamp_ DESC",
            [req.usuario.id]
        );
        const ids = vendas.map(v => v.id);
        let itens = [];
        if (ids.length) {
            [itens] = await pool.query(
                "SELECT * FROM venda_itens WHERE venda_id IN (" + ids.map(() => "?").join(",") + ")",
                ids
            );
        }

        const resultado = vendas.map(v => ({
            id: v.id,
            ficha: v.ficha,
            total: parseFloat(v.total),
            forma: v.forma,
            data: v.data_venda,
            timestamp: v.timestamp_,
            itens: itens
                .filter(i => i.venda_id === v.id)
                .map(i => ({ nome: i.produto_nome, qtd: i.quantidade, preco: parseFloat(i.preco_unit) }))
        }));

        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro interno." });
    }
});

app.listen(PORT, async () => {
    try {
        await pool.query("SELECT 1");
        console.log("Lanche Feliz rodando em http://localhost:" + PORT);
        console.log("   Banco: " + (process.env.DB_NAME || "lanchefe_liz") + " @ " + (process.env.DB_HOST || "localhost"));
        console.log("   Logins internos: admin/1234  operador/1234");
    } catch (err) {
        console.error("Falha ao conectar ao MySQL:", err.message);
        console.error("   Verifique as configuracoes em .env e se o MySQL Server esta rodando.");
    }
});
