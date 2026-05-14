"use strict";
/**
 * migrate.js — importa dados do db.json para o MySQL
 * Execute UMA ÚNICA VEZ após aplicar o schema.sql:
 *   node migrate.js
 */
require("dotenv").config();

const fs    = require("fs");
const path  = require("path");
const mysql = require("mysql2/promise");

const DB_PATH = path.join(__dirname, "db.json");

async function main() {
    if (!fs.existsSync(DB_PATH)) {
        console.log("db.json não encontrado — nada a migrar.");
        process.exit(0);
    }

    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));

    const pool = mysql.createPool({
        host:     process.env.DB_HOST || "localhost",
        port:     parseInt(process.env.DB_PORT || "3306"),
        user:     process.env.DB_USER || "root",
        password: process.env.DB_PASS || "",
        database: process.env.DB_NAME || "lanchefe_liz",
        waitForConnections: true,
        connectionLimit: 5
    });

    // ── Clientes ────────────────────────────────────────────────────────────
    const clientes = db.clientes || [];
    console.log(`Migrando ${clientes.length} cliente(s)...`);

    for (const c of clientes) {
        try {
            await pool.query(
                "INSERT IGNORE INTO clientes (id, nome, email, senha_hash) VALUES (?, ?, ?, ?)",
                [c.id, c.nome, c.email, c.senhaHash]
            );
            console.log(`  ✔ Cliente: ${c.email}`);
        } catch (err) {
            console.error(`  ✘ Falha ao importar cliente ${c.email}:`, err.message);
        }
    }

    // ── Vendas ──────────────────────────────────────────────────────────────
    const vendas = db.vendas || [];
    console.log(`Migrando ${vendas.length} venda(s)...`);

    for (const v of vendas) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const clienteId = v.clienteId || null;
            const [result] = await conn.query(
                "INSERT INTO vendas (ficha, total, forma, data_venda, timestamp_, cliente_id) VALUES (?, ?, ?, ?, ?, ?)",
                [v.ficha, parseFloat(v.total), v.forma, v.data, v.timestamp, clienteId]
            );
            const vendaId = result.insertId;

            for (const item of (v.itens || [])) {
                await conn.query(
                    "INSERT INTO venda_itens (venda_id, produto_nome, quantidade, preco_unit) VALUES (?, ?, ?, ?)",
                    [vendaId, item.nome, item.qtd, parseFloat(item.preco)]
                );
            }

            await conn.commit();
            console.log(`  ✔ Venda ficha #${v.ficha}`);
        } catch (err) {
            await conn.rollback();
            console.error(`  ✘ Falha ao importar venda #${v.ficha}:`, err.message);
        } finally {
            conn.release();
        }
    }

    await pool.end();
    console.log("\nMigração concluída!");
}

main().catch(err => {
    console.error("Erro fatal:", err);
    process.exit(1);
});
