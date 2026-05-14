const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://hbafrtzhktzqiqxwievn.supabase.co',
  'sb_publishable_KhbIOyGyMPx_QIVJxJwbxw_4GHEwSpJ'
)

// Cadastrar usuário
async function cadastrar(nome, email, senha, role = 'cliente') {
  // 1. Cria o usuário no Auth
  const { data, error } = await supabase.auth.signUp({ email, password: senha })
  if (error) return console.error('Erro ao cadastrar:', error.message)

  // 2. Cria o perfil na tabela
  const { error: erroPerfil } = await supabase
    .from('perfis')
    .insert([{ id: data.user.id, nome, email, role }])

  if (erroPerfil) return console.error('Erro ao criar perfil:', erroPerfil.message)

  console.log('Usuário cadastrado com sucesso:', email)
}

// Login
async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  })
  if (error) return console.error('Erro ao logar:', error.message)
  console.log('Logado como:', data.user.email)
  console.log('Token:', data.session.access_token)
}

// Logout
async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) return console.error('Erro ao sair:', error.message)
  console.log('Logout realizado!')
}

// Teste
login('cowainer020@gmail.com', 'senha123')