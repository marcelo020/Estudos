const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Cadastro — retorna o usuário criado
app.post('/cadastro', async (req, res) => {
  const { nome, email, senha, role } = req.body;
  const senha_hash = await bcrypt.hash(senha, 10);

  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, email, senha_hash, role: role || 'responsavel' }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return res.status(400).json({ erro: 'E-mail já cadastrado.' });
    return res.status(500).json({ erro: 'Erro ao cadastrar.' });
  }

  res.json({ id: data.id, nome: data.nome, role: data.role });
});

// Login — retorna o usuário
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data)
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

  const senhaCorreta = await bcrypt.compare(senha, data.senha_hash);
  if (!senhaCorreta)
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

  res.json({ id: data.id, nome: data.nome, role: data.role });
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});