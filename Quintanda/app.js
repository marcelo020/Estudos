// ==================== db ====================
let db = null
try {
 const SUPABASE_URL = 'https://hbafrtzhktzqiqxwievn.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiYWZydHpoa3R6cWlxeHdpZXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MzcxMDAsImV4cCI6MjA5NDMxMzEwMH0.dw_wNMpqNr1Ewid34ujO12LKxmBQ0qfo7kH0uMuc8w8'

db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
} catch(e) {
  console.warn('Erro ao inicializar db:', e.message)
}

// ==================== USUÁRIOS INTERNOS ====================
const usuarios = {
  admin:    { senha: "1234", nivel: "admin" },
  operador: { senha: "1234", nivel: "operador" }
}

// ==================== ESTADO ====================
let carrinho = []
let ficha = 1
let usuarioLogado = null
let clienteLogado = null
let produtos = []

// ==================== PRODUTOS ====================
async function carregarProdutos() {
  if (!db) {
    renderizarProdutos()
    return
  }
  try {
    const { data, error } = await db.from('produtos').select('*')
    if (error) { console.error('Erro ao carregar produtos:', error.message); renderizarProdutos(); return }
    produtos = data
  } catch(e) {
    console.error('Falha de rede ao carregar produtos:', e.message)
  }
  renderizarProdutos()
}

function renderizarProdutos() {

  const container = document.getElementById("listaProdutos")
  container.innerHTML = ""
  container.classList.add("produtos-grid")

  produtos.forEach(p => {
    let botaoAdmin = ""
    if (usuarioLogado && usuarioLogado.nivel === "admin") {
      botaoAdmin = `
        <button class="btn btn-admin" onclick="editarPreco('${p.id}')">✏️ Editar Preço</button>
        <button class="btn btn-danger" onclick="excluirProduto('${p.id}')">🗑️ Excluir</button>`
    }
    container.innerHTML += `
      <div class="produto-card">
        <img src="${p.imagem_url}" alt="${p.nome}">
        <div class="produto-info">
          <h4>${p.nome}</h4>
          <p>R$ ${parseFloat(p.preco).toFixed(2)}</p>
          <button class="btn btn-add" onclick="addCarrinho('${p.id}')">🛒 Adicionar</button>
          ${botaoAdmin}
        </div>
      </div>`
  })
}

async function salvarNovoProduto() {
  const nome = document.getElementById("novoNome").value.trim()
  const preco = parseFloat(document.getElementById("novoPreco").value)
  const imagem_url = document.getElementById("novoImg").value.trim()

  if (!nome || isNaN(preco) || preco <= 0 || !imagem_url) {
    alert("Preencha todos os campos corretamente!")
    return
  }

  if (!db) return alert('Sem conexão com o banco de dados.')
  const { error } = await db.from('produtos').insert([{ nome, preco, imagem_url, estoque: 99 }])
  if (error) return alert('Erro ao salvar produto: ' + error.message)

  document.getElementById("novoNome").value = ""
  document.getElementById("novoPreco").value = ""
  document.getElementById("novoImg").value = ""
  fecharNovoProduto()
  await carregarProdutos()
  alert("Produto cadastrado com sucesso!")
}

async function editarPreco(id) {
  if (!usuarioLogado || usuarioLogado.nivel !== "admin") {
    alert("Apenas o administrador pode alterar preços.")
    return
  }
  const produto = produtos.find(p => p.id === id)
  if (!produto) return alert("Produto não encontrado!")

  let novoPreco = prompt(`Novo valor para ${produto.nome}\nValor atual: R$ ${parseFloat(produto.preco).toFixed(2)}`)
  if (novoPreco === null) return
  novoPreco = parseFloat(novoPreco.replace(",", "."))
  if (isNaN(novoPreco) || novoPreco <= 0) return alert("Digite um valor válido!")

  const { error } = await db.from('produtos').update({ preco: novoPreco }).eq('id', id)
  if (error) return alert('Erro ao atualizar preço: ' + error.message)

  await carregarProdutos()
  alert("Preço atualizado com sucesso!")
}

async function excluirProduto(id) {
  if (!usuarioLogado || usuarioLogado.nivel !== "admin") {
    alert("Apenas o administrador pode excluir produtos.")
    return
  }
  if (!confirm("Confirma exclusão deste produto?")) return

  const { error } = await db.from('produtos').delete().eq('id', id)
  if (error) return alert('Erro ao excluir produto: ' + error.message)

  carrinho = carrinho.filter(i => i.id !== id)
  atualizarCarrinho()
  await carregarProdutos()
  alert("Produto excluído com sucesso!")
}

// ==================== CARRINHO ====================
function addCarrinho(id) {
  let item = carrinho.find(i => i.id === id)
  if (item) {
    item.qtd++
  } else {
    let prod = produtos.find(p => p.id === id)
    carrinho.push({ ...prod, qtd: 1 })
  }
  atualizarCarrinho()
}

function atualizarCarrinho() {
  const carrinhoDiv = document.getElementById("carrinho")
  carrinhoDiv.innerHTML = ""
  let total = 0

  carrinho.forEach((i, index) => {
    total += i.preco * i.qtd
    carrinhoDiv.innerHTML += `
      <div class="carrinho-item">
        <div>
          <strong>${i.nome}</strong><br>
          ${i.qtd} x R$ ${parseFloat(i.preco).toFixed(2)}
        </div>
        <button class="btn btn-danger" onclick="remover(${index})">❌</button>
      </div>`
  })

  document.getElementById("total").innerText = total.toFixed(2)
}

function remover(i) {
  carrinho.splice(i, 1)
  atualizarCarrinho()
}

// ==================== LOGIN ====================
async function fazerLoginUnificado() {
  const identificador = (document.getElementById("loginIdentificador").value || "").trim()
  const senha = document.getElementById("loginSenha").value || ""
  const erro = document.getElementById("erro")

  if (erro) erro.innerText = ""

  if (!identificador || !senha) {
    if (erro) erro.innerText = "Informe usuário/e-mail e senha."
    return
  }

  // ================= LOGIN INTERNO =================
  if (usuarios[identificador] && usuarios[identificador].senha === senha) {
    usuarioLogado = usuarios[identificador]
    clienteLogado = null

    document.getElementById("login")?.classList.add("hidden")

    if (usuarioLogado.nivel === "admin") {
      document.getElementById("adminArea")?.classList.remove("hidden")
    }

    if (usuarioLogado.nivel === "operador") {
      document.getElementById("btnDashboard")?.classList.remove("hidden")
    } else {
      document.getElementById("btnDashboard")?.classList.add("hidden")
    }

    document.getElementById("btnAreaCliente")?.classList.add("hidden")
    document.getElementById("clienteInfo")?.classList.add("hidden")

    await carregarProdutos()
mostrar("vendas")

setTimeout(() => {
  const nomeEl = document.getElementById("clienteNome")
  if (nomeEl) nomeEl.innerText = clienteLogado.nome || "Cliente"
}, 50)
    return
  }
  // ================= LOGIN CLIENTE =================
  if (!db) {
    if (erro) erro.innerText = "Banco de dados indisponível."
    return
  }

  const { data, error } = await db.auth.signInWithPassword({
    email: identificador,
    password: senha
  })

  if (error || !data?.user) {
    if (erro) erro.innerText = "Login inválido."
    return
  }

  // 🔍 GARANTE SESSÃO
  const { data: userData } = await db.auth.getUser()

  if (!userData?.user) {
    if (erro) erro.innerText = "Erro de autenticação. Tente novamente."
    return
  }

  // 🔍 BUSCA PERFIL
  const { data: perfil, error: erroPerfil } = await db
    .from('perfis')
    .select('*')
    .eq('id', userData.user.id)
    .single()

  if (erroPerfil || !perfil) {
    console.error("Erro perfil:", erroPerfil)

    if (erro) erro.innerText = "Perfil não encontrado (RLS ou cadastro)."
    return
  }

  clienteLogado = perfil
  usuarioLogado = null

  // ✅ ATUALIZA UI COM SEGURANÇA
  const nomeEl = document.getElementById("clienteNome")
  if (nomeEl) nomeEl.innerText = clienteLogado.nome || "Cliente"

  document.getElementById("clienteInfo")?.classList.remove("hidden")
  document.getElementById("login")?.classList.add("hidden")

  document.getElementById("adminArea")?.classList.add("hidden")
  document.getElementById("btnDashboard")?.classList.add("hidden")
  document.getElementById("btnAreaCliente")?.classList.add("hidden")

  await carregarProdutos()
  mostrar("vendas")
}

// ==================== CADASTRO CLIENTE ====================
async function fazerCadastroCliente() {
  const nome = document.getElementById('clienteNomeInput').value.trim()
  const email = document.getElementById('clienteEmailInput').value.trim().toLowerCase()
  const senha = document.getElementById('clienteSenhaInput').value
  const senha2 = document.getElementById('clienteSenhaConfirm').value
  const msgEl = document.getElementById('cadastroMsg')
  msgEl.style.color = 'red'

  if (!nome || !email || !senha) { msgEl.innerText = 'Preencha todos os campos.'; return }
  if (senha !== senha2) { msgEl.innerText = 'Senhas não conferem.'; return }
  if (!db) { msgEl.innerText = 'Banco de dados indisponível.'; return }

  const { data, error } = await db.auth.signUp({ email, password: senha })
  if (error) { msgEl.innerText = 'Erro: ' + error.message; return }

  const { error: erroPerfil } = await db.from('perfis').insert([{ id: data.user.id, nome, email, role: 'cliente' }])
  if (erroPerfil) { msgEl.innerText = 'Erro ao criar perfil: ' + erroPerfil.message; return }

  msgEl.style.color = 'green'
  msgEl.innerText = 'Cadastro realizado! Faça login.'

  document.getElementById('clienteNomeInput').value = ''
  document.getElementById('clienteEmailInput').value = ''
  document.getElementById('clienteSenhaInput').value = ''
  document.getElementById('clienteSenhaConfirm').value = ''

  setTimeout(() => mostrar('login'), 1000)
}

// ==================== LOGOUT ====================
async function logout() {
  if (db && db.auth) await db.auth.signOut()
  usuarioLogado = null
  clienteLogado = null
  try { document.getElementById('adminArea').classList.add('hidden') } catch(e) {}
  try { document.getElementById('clienteInfo').classList.add('hidden') } catch(e) {}
  try { document.getElementById('clienteNome').innerText = '' } catch(e) {}
  try { document.getElementById('btnDashboard').classList.add('hidden') } catch(e) {}
  try { document.getElementById('btnAreaCliente').classList.remove('hidden') } catch(e) {}
  await carregarProdutos()
  mostrar('login')
}

// ==================== PAGAMENTO ====================
function irPagamento() {
  if (carrinho.length === 0) { alert("Carrinho vazio!"); return }
  mostrar("pagamento")
}

function configurarFormaPagamento() {
  const formaEl = document.getElementById('forma')
  const dinheiroCampoEl = document.getElementById('dinheiroCampo')
  if (!formaEl || !dinheiroCampoEl) return

  formaEl.onchange = function () {
    dinheiroCampoEl.classList.toggle('hidden', formaEl.value !== 'Dinheiro')
  }
}

async function finalizar() {
  let total = parseFloat(document.getElementById("total").innerText)
  let formaPg = forma.value
  if (!formaPg) return alert("Escolha forma pagamento")

  let troco = 0
  if (formaPg === "Dinheiro") {
    let recebido = parseFloat(valorRecebido.value)
    if (recebido < total) return alert("Valor insuficiente")
    troco = recebido - total
  }

  // Salva pedido no db
  const { data: pedido, error } = await db.from('pedidos').insert([{
    cliente_id: clienteLogado ? clienteLogado.id : null,
    status: 'pago',
    total
  }]).select().single()

  if (error) return alert('Erro ao salvar pedido: ' + error.message)

  // Salva itens do pedido
  const itens = carrinho.map(i => ({
    pedido_id: pedido.id,
    produto_id: i.id,
    quantidade: i.qtd,
    preco_unitario: i.preco
  }))
  await db.from('itens_pedido').insert(itens)

  // Imprime cupom
  let janela = window.open("", "PRINT", "width=400,height=600")
  janela.document.write(`
    <html><head><style>
      body { font-family: monospace; width: 280px; }
      h3 { text-align:center; }
      hr { border-top:1px dashed black; }
    </style></head><body>
    <h3>LANCHE FELIZ</h3>
    <p>Data: ${new Date().toLocaleString()}</p>
    <p>Cliente: ${clienteLogado ? clienteLogado.nome : 'Consumidor'}</p><hr>
  `)
  carrinho.forEach(item => {
    janela.document.write(`<p>${item.nome}<br>${item.qtd} x ${parseFloat(item.preco).toFixed(2)}</p>`)
  })
  janela.document.write(`
    <hr>
    <p><strong>Total: R$ ${total.toFixed(2)}</strong></p>
    <p>Pagamento: ${formaPg}</p>
    <p>Troco: R$ ${troco.toFixed(2)}</p>
    <hr><p style="text-align:center">Obrigado pela preferência!</p>
    </body></html>
  `)
  janela.document.close()
  janela.focus()
  janela.print()
  janela.close()

  carrinho = []
  atualizarCarrinho()
  mostrar('vendas')
}

// ==================== PEDIDOS DO CLIENTE ====================
async function listarPedidosCliente() {
  if (!clienteLogado) { alert('Faça login para ver seus pedidos.'); mostrar('login'); return }

  const { data: pedidos, error } = await db
    .from('pedidos')
    .select('*, itens_pedido(quantidade, preco_unitario, produtos(nome))')
    .eq('cliente_id', clienteLogado.id)
    .order('criado_em', { ascending: false })

  if (error) return console.error('Erro ao listar pedidos:', error.message)

  const container = document.getElementById('listaPedidosCliente')
  if (!container) return

  if (pedidos.length === 0) {
    container.innerHTML = '<p>Nenhum pedido encontrado.</p>'
  } else {
    container.innerHTML = pedidos.map(p => {
      const itens = p.itens_pedido.map(i =>
        `<li>${i.quantidade} x ${i.produtos.nome} — R$ ${parseFloat(i.preco_unitario).toFixed(2)}</li>`
      ).join('')
      return `
        <div class="card" style="margin-bottom:10px">
          <strong>Pedido</strong> — ${new Date(p.criado_em).toLocaleString()}<br>
          <small>Status: ${p.status} | Total: R$ ${parseFloat(p.total).toFixed(2)}</small>
          <ul style="margin-top:8px">${itens}</ul>
        </div>`
    }).join('')
  }

  mostrar('cliente-pedidos')
}

// ==================== DASHBOARD ====================
let grafico, graficoDia

async function gerarRelatorio() {
     if (!db) return alert('Banco de dados indisponível.')
  const { data: pedidos, error } = await db
    .from('pedidos')
    .select('*, itens_pedido(quantidade, produtos(nome))')

  if (error) return console.error('Erro ao gerar relatório:', error.message)

  const now = new Date()
  const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)

  let totalDia = 0, totalMes = 0
  const contagem = {}

  pedidos.forEach(p => {
    const ts = new Date(p.criado_em)
    if (ts >= startOfToday) totalDia += parseFloat(p.total)
    if (ts >= startOfMonth) totalMes += parseFloat(p.total)
    p.itens_pedido.forEach(i => {
      const nome = i.produtos?.nome || 'Desconhecido'
      contagem[nome] = (contagem[nome] || 0) + i.quantidade
    })
  })

  document.getElementById("relatorio").innerHTML = `
    <div class="card">
      💰 Total Vendido Hoje: R$ ${totalDia.toFixed(2)}<br>
      💳 Total Vendido no Mês: R$ ${totalMes.toFixed(2)}<br>
      🧾 Total de Vendas Registradas: ${pedidos.length}
    </div>`

  if (grafico) grafico.destroy()
  if (graficoDia) graficoDia.destroy()

  const nomes = Object.keys(contagem)
  const quantidades = Object.values(contagem)

  grafico = new Chart(document.getElementById("graficoVendas"), {
    type: 'bar',
    data: {
      labels: nomes,
      datasets: [{ label: 'Quantidade Vendida', data: quantidades, backgroundColor: 'rgba(59,130,246,0.6)' }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  })

  const oneDay = 86400000
  const startTodayTs = startOfToday.getTime()
  const windowStart = startTodayTs - 6 * oneDay
  const days = [], vendasPorDia = []

  for (let d = 6; d >= 0; d--) {
    const dt = new Date(startTodayTs - d * oneDay)
    days.push(`${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`)
    vendasPorDia.push(0)
  }

  pedidos.forEach(p => {
    const ts = new Date(p.criado_em).getTime()
    if (ts >= windowStart && ts <= startTodayTs + oneDay) {
      const idx = Math.floor((ts - windowStart) / oneDay)
      if (idx >= 0 && idx < 7) vendasPorDia[idx] += parseFloat(p.total)
    }
  })

  graficoDia = new Chart(document.getElementById("graficoVendasDia"), {
    type: 'line',
    data: {
      labels: days,
      datasets: [{ label: 'Total R$ por dia (últimos 7 dias)', data: vendasPorDia, backgroundColor: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,1)' }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  })
}

// ==================== TELAS ====================
const TELAS = ['vendas', 'pagamento', 'dashboard', 'cliente-cadastro', 'cliente-pedidos', 'login']

function mostrar(id) {
  TELAS.forEach(t => {
    const el = document.getElementById(t)
    if (el) el.classList.add('hidden')
  })

  if (id === 'dashboard') {
    if (!usuarioLogado || usuarioLogado.nivel !== 'operador') {
      alert('Acesso restrito: apenas operador interno pode ver o Dashboard.')
      return
    }
    document.getElementById('dashboard').classList.remove('hidden')
    gerarRelatorio()
    return
  }

  const alvo = document.getElementById(id)
  if (alvo) alvo.classList.remove('hidden')
}

function abrirNovoProduto() { document.getElementById("novoProdutoBox").classList.remove("hidden") }
function fecharNovoProduto() { document.getElementById("novoProdutoBox").classList.add("hidden") }

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  mostrar('login')
  configurarFormaPagamento()
  await carregarProdutos()
  try { document.getElementById('btnDashboard').classList.add('hidden') } catch(e) {}
  try { document.getElementById('adminArea').classList.add('hidden') } catch(e) {}
})