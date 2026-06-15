-- ============================================================
-- Quintanda: Perfis, Módulos, Permissões e Usuários do Sistema
-- Execute este script no Editor SQL do Supabase (uma vez)
-- ============================================================

-- Tabela: Perfis do Sistema (ex: Gerente, Vendedor, Atendente)
CREATE TABLE IF NOT EXISTS perfis_sistema (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT        NOT NULL,
  descricao   TEXT        DEFAULT '',
  ativo       BOOLEAN     DEFAULT true,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

-- Tabela: Módulos do Sistema (ex: Financeiro, Estoque, Atendimento)
CREATE TABLE IF NOT EXISTS modulos_sistema (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT        NOT NULL,
  descricao   TEXT        DEFAULT '',
  icone       TEXT        DEFAULT '📋',
  ativo       BOOLEAN     DEFAULT true,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

-- Tabela Intermediária: Permissões (Perfil x Módulo)
CREATE TABLE IF NOT EXISTS permissoes (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id        UUID    NOT NULL REFERENCES perfis_sistema(id) ON DELETE CASCADE,
  modulo_id        UUID    NOT NULL REFERENCES modulos_sistema(id) ON DELETE CASCADE,
  pode_visualizar  BOOLEAN DEFAULT false,
  pode_editar      BOOLEAN DEFAULT false,
  pode_excluir     BOOLEAN DEFAULT false,
  UNIQUE(perfil_id, modulo_id)
);

-- Tabela: Usuários do Sistema (funcionários gerenciados pelo admin)
CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT        NOT NULL,
  username    TEXT        NOT NULL UNIQUE,
  senha_hash  TEXT        NOT NULL,
  perfil_id   UUID        REFERENCES perfis_sistema(id),
  ativo       BOOLEAN     DEFAULT true,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS: habilitar e criar políticas permissivas (anon key)
-- ============================================================
ALTER TABLE perfis_sistema    ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos_sistema   ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_sistema  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quintanda_perfis_sistema"   ON perfis_sistema   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "quintanda_modulos_sistema"  ON modulos_sistema  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "quintanda_permissoes"       ON permissoes       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "quintanda_usuarios_sistema" ON usuarios_sistema FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Dados iniciais
-- ============================================================
INSERT INTO perfis_sistema (nome, descricao) VALUES
  ('Gerente',   'Acesso total ao sistema'),
  ('Vendedor',  'Acesso às vendas e atendimento ao cliente'),
  ('Atendente', 'Acesso básico ao atendimento')
ON CONFLICT DO NOTHING;

INSERT INTO modulos_sistema (nome, descricao, icone) VALUES
  ('Financeiro',  'Gestão financeira e relatórios de vendas',   '💰'),
  ('Estoque',     'Controle de estoque e cadastro de produtos',  '📦'),
  ('Atendimento', 'Vendas e atendimento ao cliente',             '🛒'),
  ('Usuários',    'Gerenciamento de usuários do sistema',        '👥'),
  ('Dashboard',   'Relatórios e análises de desempenho',         '📊')
ON CONFLICT DO NOTHING;
