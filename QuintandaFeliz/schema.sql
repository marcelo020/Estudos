-- ============================================================
--  Lanche Feliz — Schema MySQL
--  Execute: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS lanchefe_liz
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE lanchefe_liz;

-- ── Clientes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
    id          BIGINT        NOT NULL,
    nome        VARCHAR(120)  NOT NULL,
    email       VARCHAR(180)  NOT NULL UNIQUE,
    senha_hash  VARCHAR(255)  NOT NULL,
    criado_em   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ── Produtos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
    id     INT           NOT NULL AUTO_INCREMENT,
    nome   VARCHAR(120)  NOT NULL,
    preco  DECIMAL(10,2) NOT NULL,
    img    TEXT          NOT NULL,
    PRIMARY KEY (id)
);

-- ── Vendas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendas (
    id          INT           NOT NULL AUTO_INCREMENT,
    ficha       INT           NOT NULL,
    total       DECIMAL(10,2) NOT NULL,
    forma       VARCHAR(30)   NOT NULL,
    data_venda  VARCHAR(40)   NOT NULL,
    timestamp_  BIGINT        NOT NULL,
    cliente_id  BIGINT        NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- ── Itens de cada venda ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS venda_itens (
    id        INT           NOT NULL AUTO_INCREMENT,
    venda_id  INT           NOT NULL,
    produto_nome  VARCHAR(120)  NOT NULL,
    quantidade    INT           NOT NULL,
    preco_unit    DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
);

-- ── Dados iniciais dos produtos ─────────────────────────────
INSERT IGNORE INTO produtos (id, nome, preco, img) VALUES
(1, 'Cafezinho',            1.50, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300'),
(2, 'Pão com manteiga',     1.20, 'https://3.bp.blogspot.com/-4tzM3_7T-04/WAKzMTezioI/AAAAAAAAB6c/dY8SpoE7-KMJ6-jxup8yE2dysJbTywiAwCLcB/w1200-h630-p-k-no-nu/pao-com-manteiga.jpg'),
(3, 'Misto quente',         1.75, 'https://tse1.mm.bing.net/th/id/OIP.2gQWV_-2OIRqoKrOJI5jSgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3'),
(4, 'Misto quente com ovo', 2.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300'),
(5, 'Suco natural',         2.25, 'https://tse2.mm.bing.net/th/id/OIP.W5aNOByZpGdJI2lXRfY6ewHaE3?rs=1&pid=ImgDetMain&o=7&rm=3'),
(6, 'Suco lata',            3.00, 'https://imagens.jotaja.com/produtos/2ce9bdc0-5e4a-4611-8b1b-be35c7784e15.jpg'),
(7, 'Pão de queijo',        1.00, 'https://www.panificiomallet.com/storage/app/uploads/public/67d/c17/ef2/67dc17ef2b779369140361.jpg'),
(8, 'Porção pão de queijo', 2.50, 'https://amopaocaseiro.com.br/wp-content/uploads/2022/08/yt-069_pao-de-queijo_receita-840x560.jpg');
