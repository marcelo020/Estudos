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
// Senhas armazenadas como SHA-256. Para gerar novo hash:
// node -e "require('crypto').createHash('sha256').update('SuaSenha').digest('hex')"
// admin: Admin@Quintanda2026!  |  operador: Operador@Quintanda2026!
const usuarios = {
  admin:    { senhaHash: "6bbaa223c3f1c9aec1c770f04ecbddf88bab9d3ea751bc0eb997471321076c0a", nivel: "admin" },
  operador: { senhaHash: "4ce7560b3cc9608280781110d8c4783ff656de4c9adc0756e9baaf65f8e966a5", nivel: "operador" }
}

async function hashSenha(senha) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(senha))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

// ==================== NOTIFICAÇÕES ====================
function toast(msg, tipo = 'info', duracao = 3500) {
  const container = document.getElementById('toastContainer')
  if (!container) { console.warn(msg); return }
  const el = document.createElement('div')
  el.className = `toast toast-${tipo}`
  el.textContent = msg
  container.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 350)
  }, duracao)
}

function _modal(msg, comInput, valorAtual = '') {
  return new Promise(resolve => {
    const modal    = document.getElementById('modal')
    const inputArea = document.getElementById('modalInputArea')
    const input    = document.getElementById('modalInput')
    const btnOk    = document.getElementById('modalConfirmar')
    const btnCancel = document.getElementById('modalCancelar')

    document.getElementById('modalMsg').textContent = msg

    if (comInput) {
      inputArea.classList.remove('hidden')
      input.value = valorAtual
      setTimeout(() => { input.focus(); input.select() }, 80)
    } else {
      inputArea.classList.add('hidden')
    }

    modal.classList.remove('hidden')

    function fechar(result) {
      modal.classList.add('hidden')
      btnOk.removeEventListener('click', onOk)
      btnCancel.removeEventListener('click', onCancel)
      document.removeEventListener('keydown', onKey)
      resolve(result)
    }

    function onOk()     { fechar(comInput ? (input.value.trim() || null) : true) }
    function onCancel() { fechar(comInput ? null : false) }
    function onKey(e) {
      if (e.key === 'Escape') fechar(comInput ? null : false)
      if (e.key === 'Enter' && !comInput) fechar(true)
    }

    btnOk.addEventListener('click', onOk)
    btnCancel.addEventListener('click', onCancel)
    document.addEventListener('keydown', onKey)
  })
}

function confirmar(msg)                   { return _modal(msg, false) }
function perguntarValor(msg, valorAtual)  { return _modal(msg, true, valorAtual) }

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

  if (produtos.length === 0) {
    container.innerHTML = '<p style="color:#94a3b8;padding:24px 0;">Nenhum produto cadastrado.</p>'
    return
  }

  produtos.forEach(p => {
    let overlay = ""
    if (usuarioLogado && usuarioLogado.nivel === "admin") {
      overlay = `
        <div class="produto-admin-overlay">
          <button class="btn btn-admin" onclick="editarPreco('${p.id}')">✏️ Editar</button>
          <button class="btn btn-danger" onclick="excluirProduto('${p.id}')">🗑️</button>
        </div>`
    }
    container.innerHTML += `
      <div class="produto-card">
        <div class="produto-img-wrap">
          <img src="${p.imagem_url}" alt="${p.nome}" onerror="this.src='https://placehold.co/200x148/f1f5f9/94a3b8?text=Sem+foto'">
          ${overlay}
        </div>
        <div class="produto-info">
          <h4>${p.nome}</h4>
          <div class="produto-footer">
            <span class="produto-preco">R$ ${parseFloat(p.preco).toFixed(2)}</span>
            <button class="btn-add-icon" onclick="addCarrinho('${p.id}')" title="Adicionar ao carrinho">+</button>
          </div>
        </div>
      </div>`
  })
}

async function salvarNovoProduto() {
  const nome      = document.getElementById("novoNome").value.trim()
  const preco     = parseFloat(document.getElementById("novoPreco").value)
  const imagem_url = document.getElementById("novoImg").value.trim()

  if (!nome || isNaN(preco) || preco <= 0 || !imagem_url) {
    toast("Preencha todos os campos corretamente!", 'warning')
    return
  }

  if (!db) return toast('Sem conexão com o banco de dados.', 'error')
  const { error } = await db.from('produtos').insert([{ nome, preco, imagem_url, estoque: 99 }])
  if (error) return toast('Erro ao salvar produto: ' + error.message, 'error')

  document.getElementById("novoNome").value = ""
  document.getElementById("novoPreco").value = ""
  document.getElementById("novoImg").value = ""
  fecharNovoProduto()
  await carregarProdutos()
  toast("Produto cadastrado com sucesso!", 'success')
}

async function editarPreco(id) {
  if (!usuarioLogado || usuarioLogado.nivel !== "admin") {
    toast("Apenas o administrador pode alterar preços.", 'warning')
    return
  }
  if (!db) return toast('Sem conexão com o banco de dados.', 'error')

  const produto = produtos.find(p => String(p.id) === String(id))
  if (!produto) return toast("Produto não encontrado!", 'error')

  const resposta = await perguntarValor(
    `Novo preço para "${produto.nome}"\nAtual: R$ ${parseFloat(produto.preco).toFixed(2)}`,
    parseFloat(produto.preco).toFixed(2)
  )
  if (resposta === null) return
  const novoPreco = parseFloat(String(resposta).replace(",", "."))
  if (isNaN(novoPreco) || novoPreco <= 0) return toast("Digite um valor válido!", 'warning')

  try {
    const { data, error } = await db
      .from('produtos')
      .update({ preco: novoPreco })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase erro ao atualizar preço:', error)
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        return toast('Sem permissão. Verifique as políticas RLS da tabela "produtos" no Supabase.', 'error')
      }
      return toast('Erro ao atualizar preço: ' + error.message, 'error')
    }

    if (!data || data.length === 0) {
      return toast('Atualização não aplicada: produto não encontrado no banco.', 'warning')
    }

    await carregarProdutos()
    toast("Preço atualizado com sucesso!", 'success')
  } catch (e) {
    console.error('Exceção em editarPreco:', e)
    toast('Erro inesperado: ' + e.message, 'error')
  }
}

async function excluirProduto(id) {
  if (!usuarioLogado || usuarioLogado.nivel !== "admin") {
    toast("Apenas o administrador pode excluir produtos.", 'warning')
    return
  }
  if (!db) return toast('Sem conexão com o banco de dados.', 'error')
  if (!await confirmar("Confirma a exclusão deste produto?")) return

  const { error } = await db.from('produtos').delete().eq('id', id)
  if (error) {
    console.error('Supabase erro ao excluir produto:', error)
    if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
      return toast('Sem permissão para excluir. Verifique as políticas RLS no Supabase.', 'error')
    }
    return toast('Erro ao excluir produto: ' + error.message, 'error')
  }

  carrinho = carrinho.filter(i => String(i.id) !== String(id))
  atualizarCarrinho()
  await carregarProdutos()
  toast("Produto excluído com sucesso!", 'success')
}

// ==================== CARRINHO ====================
function addCarrinho(id) {
  let item = carrinho.find(i => String(i.id) === String(id))
  if (item) {
    item.qtd++
  } else {
    let prod = produtos.find(p => String(p.id) === String(id))
    carrinho.push({ ...prod, qtd: 1 })
  }
  atualizarCarrinho()
}

function atualizarCarrinho() {
  const carrinhoDiv = document.getElementById("carrinho")
  const badge = document.getElementById("carrinhoCount")
  carrinhoDiv.innerHTML = ""
  let total = 0
  let totalItens = 0

  if (carrinho.length === 0) {
    carrinhoDiv.innerHTML = `
      <div class="carrinho-vazio">
        <span>🛒</span>
        <p>Carrinho vazio</p>
      </div>`
  } else {
    carrinho.forEach((i, index) => {
      total += i.preco * i.qtd
      totalItens += i.qtd
      carrinhoDiv.innerHTML += `
        <div class="carrinho-item">
          <div class="item-info">
            <span class="item-nome">${i.nome}</span>
            <span class="item-subtotal">R$ ${(i.preco * i.qtd).toFixed(2)}</span>
          </div>
          <div class="item-controles">
            <button class="btn-qtd" onclick="diminuirQtd(${index})">−</button>
            <span class="item-qtd">${i.qtd}</span>
            <button class="btn-qtd" onclick="aumentarQtd(${index})">+</button>
          </div>
        </div>`
    })
  }

  if (badge) badge.textContent = totalItens
  document.getElementById("total").innerText = total.toFixed(2)
}

function aumentarQtd(index) {
  carrinho[index].qtd++
  atualizarCarrinho()
}

function diminuirQtd(index) {
  if (carrinho[index].qtd > 1) {
    carrinho[index].qtd--
  } else {
    carrinho.splice(index, 1)
  }
  atualizarCarrinho()
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
  const hashDigitado = await hashSenha(senha)
  if (usuarios[identificador] && usuarios[identificador].senhaHash === hashDigitado) {
    usuarioLogado = usuarios[identificador]
    clienteLogado = null

    document.getElementById("login")?.classList.add("hidden")

    if (usuarioLogado.nivel === "admin") {
      document.getElementById("adminArea")?.classList.remove("hidden")
      document.getElementById("adminConfigArea")?.classList.remove("hidden")
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

    // clienteLogado é null para usuários internos — não atualizar o nome do cliente
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

  const { data: userData } = await db.auth.getUser()

  if (!userData?.user) {
    if (erro) erro.innerText = "Erro de autenticação. Tente novamente."
    return
  }

  const { data: perfil, error: erroPerfil } = await db
    .from('perfis')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (erroPerfil) {
    console.error("Erro perfil:", erroPerfil)
    if (erro) erro.innerText = "Erro ao buscar perfil: " + erroPerfil.message
    return
  }

  if (!perfil) {
    const emailUsuario = userData.user.email
    const { data: novoPerfil, error: erroInsert } = await db
      .from('perfis')
      .insert([{ id: userData.user.id, nome: emailUsuario, email: emailUsuario, role: 'cliente' }])
      .select()
      .single()
    if (erroInsert) {
      if (erro) erro.innerText = "Perfil não encontrado e não foi possível criá-lo."
      return
    }
    clienteLogado = novoPerfil
  } else {
    clienteLogado = perfil
  }

  usuarioLogado = null

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
function verificarForcaSenha(senha) {
  const wrap  = document.getElementById('senhaForcaWrap')
  const fill  = document.getElementById('senhaForcaFill')
  const label = document.getElementById('senhaForcaLabel')
  if (!wrap || !fill || !label) return

  if (!senha) { wrap.classList.add('hidden'); return }
  wrap.classList.remove('hidden')

  let score = 0
  if (senha.length >= 6)           score++
  if (senha.length >= 10)          score++
  if (/[A-Z]/.test(senha))         score++
  if (/[0-9]/.test(senha))         score++
  if (/[^A-Za-z0-9]/.test(senha))  score++

  const niveis = [
    { pct: '15%',  cor: '#ef4444', txt: 'Muito fraca' },
    { pct: '35%',  cor: '#f97316', txt: 'Fraca'       },
    { pct: '55%',  cor: '#f59e0b', txt: 'Média'       },
    { pct: '80%',  cor: '#84cc16', txt: 'Forte'       },
    { pct: '100%', cor: '#10b981', txt: 'Muito forte' },
  ]
  const n = niveis[Math.min(score, niveis.length - 1)]
  fill.style.width      = n.pct
  fill.style.background = n.cor
  label.textContent     = n.txt
  label.style.color     = n.cor
}

async function fazerCadastroCliente() {
  const nome   = document.getElementById('clienteNomeInput').value.trim()
  const email  = document.getElementById('clienteEmailInput').value.trim().toLowerCase()
  const senha  = document.getElementById('clienteSenhaInput').value
  const senha2 = document.getElementById('clienteSenhaConfirm').value
  const msgEl  = document.getElementById('cadastroMsg')

  const msgErro = t => { msgEl.className = 'cadastro-msg erro';    msgEl.innerText = t }
  const msgOk   = t => { msgEl.className = 'cadastro-msg sucesso'; msgEl.innerText = t }

  if (!nome || !email || !senha) { msgErro('Preencha todos os campos.'); return }
  if (senha !== senha2)          { msgErro('Senhas não conferem.'); return }
  if (!db)                       { msgErro('Banco de dados indisponível.'); return }

  const { data, error } = await db.auth.signUp({ email, password: senha })
  if (error) { msgErro('Erro: ' + error.message); return }

  const { error: erroPerfil } = await db.from('perfis').insert([{ id: data.user.id, nome, email, role: 'cliente' }])
  if (erroPerfil) { msgErro('Erro ao criar perfil: ' + erroPerfil.message); return }

  msgOk('Cadastro realizado! Redirecionando...')

  document.getElementById('clienteNomeInput').value = ''
  document.getElementById('clienteEmailInput').value = ''
  document.getElementById('clienteSenhaInput').value = ''
  document.getElementById('clienteSenhaConfirm').value = ''
  verificarForcaSenha('')

  setTimeout(() => mostrar('login'), 1400)
}

// ==================== LOGOUT ====================
async function logout() {
  if (db && db.auth) await db.auth.signOut()
  usuarioLogado = null
  clienteLogado = null
  try { document.getElementById('adminArea').classList.add('hidden') } catch(e) {}
  try { document.getElementById('adminConfigArea').classList.add('hidden') } catch(e) {}
  try { document.getElementById('clienteInfo').classList.add('hidden') } catch(e) {}
  try { document.getElementById('clienteNome').innerText = '' } catch(e) {}
  try { document.getElementById('btnDashboard').classList.add('hidden') } catch(e) {}
  try { document.getElementById('btnAreaCliente').classList.remove('hidden') } catch(e) {}
  await carregarProdutos()
  mostrar('login')
}

// ==================== PAGAMENTO ====================
function irPagamento() {
  if (carrinho.length === 0) { toast("Carrinho vazio!", 'warning'); return }

  const total = parseFloat(document.getElementById("total").innerText) || 0

  const resumoEl = document.getElementById("resumoItens")
  if (resumoEl) {
    resumoEl.innerHTML = carrinho.map(i => `
      <div class="resumo-item">
        <span class="resumo-nome">${i.nome} <span class="resumo-qtd">×${i.qtd}</span></span>
        <span class="resumo-preco">R$ ${(i.preco * i.qtd).toFixed(2)}</span>
      </div>`).join('')
  }

  const resumoTotal = document.getElementById("resumoTotal")
  if (resumoTotal) resumoTotal.textContent = total.toFixed(2)

  document.querySelectorAll('.forma-card').forEach(c => c.classList.remove('ativa'))
  document.getElementById('forma').value = ''
  document.getElementById('dinheiroCampo')?.classList.add('hidden')
  document.getElementById('trocoRow')?.classList.add('hidden')
  const vr = document.getElementById('valorRecebido')
  if (vr) vr.value = ''

  mostrar("pagamento")
}

function selecionarForma(forma) {
  document.querySelectorAll('.forma-card').forEach(c => c.classList.remove('ativa'))
  document.querySelector(`.forma-card[data-forma="${forma}"]`)?.classList.add('ativa')
  document.getElementById('forma').value = forma

  const dinheiroCampo = document.getElementById('dinheiroCampo')
  if (forma === 'Dinheiro') {
    dinheiroCampo?.classList.remove('hidden')
    document.getElementById('valorRecebido')?.focus()
  } else {
    dinheiroCampo?.classList.add('hidden')
    document.getElementById('trocoRow')?.classList.add('hidden')
  }
}

function calcularTroco() {
  const total    = parseFloat(document.getElementById("total").innerText) || 0
  const recebido = parseFloat(document.getElementById("valorRecebido").value) || 0
  const trocoRow = document.getElementById("trocoRow")
  const trocoVal = document.getElementById("trocoValor")
  if (!trocoRow || !trocoVal) return

  if (recebido > 0) {
    trocoRow.classList.remove("hidden")
    const troco = recebido - total
    if (troco >= 0) {
      trocoRow.classList.remove("insuficiente")
      trocoVal.textContent = `R$ ${troco.toFixed(2)}`
    } else {
      trocoRow.classList.add("insuficiente")
      trocoVal.textContent = `- R$ ${Math.abs(troco).toFixed(2)}`
    }
  } else {
    trocoRow.classList.add("hidden")
  }
}

function configurarFormaPagamento() {
  // Substituído por selecionarForma() — mantido para não quebrar o init
}

async function finalizar() {
  if (!db) return toast('Sem conexão com o banco de dados.', 'error')
  const total   = parseFloat(document.getElementById("total").innerText)
  const formaPg = document.getElementById('forma').value
  if (!formaPg) return toast("Escolha a forma de pagamento.", 'warning')

  let troco = 0
  if (formaPg === "Dinheiro") {
    const recebido = parseFloat(document.getElementById('valorRecebido').value)
    if (isNaN(recebido) || recebido < total) return toast("Valor recebido insuficiente.", 'warning')
    troco = recebido - total
  }

  const { data: pedido, error } = await db.from('pedidos').insert([{
    cliente_id: clienteLogado ? clienteLogado.id : null,
    status: 'pago',
    total
  }]).select().single()

  if (error) return toast('Erro ao salvar pedido: ' + error.message, 'error')

  const itens = carrinho.map(i => ({
    pedido_id: pedido.id,
    produto_id: i.id,
    quantidade: i.qtd,
    preco_unitario: i.preco
  }))
  await db.from('itens_pedido').insert(itens)

  const snapshot = [...carrinho]
  carrinho = []
  atualizarCarrinho()

  exibirComprovante({
    pedidoId: pedido.id,
    itens: snapshot,
    total,
    formaPg,
    troco,
    cliente: clienteLogado ? clienteLogado.nome : null
  })
}

const _msgsFelizes = [
  "Seu lanche está sendo preparado com muito carinho! 🍔❤️",
  "Que escolha incrível! Bom apetite e volte sempre! 😋",
  "Pedido confirmado! Obrigado pela confiança em nós. 🎉",
  "Você fez uma ótima escolha! Esperamos te ver em breve. ✨",
  "Muito obrigado pela visita! Sua satisfação é nossa alegria. 🌟"
]

let _comprovanteAtual = null

function exibirComprovante({ pedidoId, itens, total, formaPg, troco, cliente }) {
  _comprovanteAtual = { pedidoId, itens, total, formaPg, troco, cliente }

  document.getElementById('comprovanteGreeting').textContent =
    cliente ? `Obrigado, ${cliente}!` : 'Obrigado pela preferência!'
  document.getElementById('comprovanteData').textContent =
    new Date().toLocaleString('pt-BR')

  document.getElementById('comprovanteItens').innerHTML = itens.map(i => `
    <div class="comprovante-item">
      <span class="comprovante-item-nome">${i.nome} <span class="comprovante-item-qtd">×${i.qtd}</span></span>
      <span class="comprovante-item-preco">R$ ${(i.preco * i.qtd).toFixed(2)}</span>
    </div>`).join('')

  document.getElementById('comprovanteForma').textContent = formaPg
  document.getElementById('comprovanteTotal').textContent = `R$ ${total.toFixed(2)}`

  const trocoRow = document.getElementById('comprovanteTrocoRow')
  if (formaPg === 'Dinheiro') {
    trocoRow.classList.remove('hidden')
    document.getElementById('comprovanteTroco').textContent = `R$ ${troco.toFixed(2)}`
  } else {
    trocoRow.classList.add('hidden')
  }

  document.getElementById('comprovanteMsgFinal').textContent =
    _msgsFelizes[Math.floor(Math.random() * _msgsFelizes.length)]

  mostrar('comprovante')
}

function imprimirComprovante() {
  if (!_comprovanteAtual) return
  const { pedidoId, itens, total, formaPg, troco, cliente } = _comprovanteAtual

  const linhasItens = itens.map(i =>
    `<div class="row"><span>${i.nome} ×${i.qtd}</span><span>R$ ${(i.preco * i.qtd).toFixed(2)}</span></div>`
  ).join('')
  const trocoLinha = formaPg === 'Dinheiro'
    ? `<div class="row"><span>Troco</span><span>R$ ${troco.toFixed(2)}</span></div>` : ''

  const janela = window.open("", "PRINT", "width=400,height=600")
  janela.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body { font-family:'Courier New',monospace; width:290px; margin:12px auto; font-size:13px; }
    h2   { text-align:center; font-size:15px; margin:0 0 2px; }
    .sub { text-align:center; font-size:11px; color:#555; margin:2px 0; }
    hr   { border:none; border-top:1px dashed #333; margin:10px 0; }
    .row { display:flex; justify-content:space-between; margin:5px 0; }
    .total { font-weight:bold; font-size:14px; }
    .rodape { text-align:center; margin-top:10px; font-size:11px; line-height:1.6; }
  </style></head><body>
  <h2>🍔 LANCHE FELIZ</h2>
  <p class="sub">${new Date().toLocaleString('pt-BR')}</p>
  <p class="sub">Pedido #${pedidoId}</p>
  ${cliente ? `<p class="sub">Cliente: ${cliente}</p>` : ''}
  <hr>
  ${linhasItens}
  <hr>
  <div class="row total"><span>TOTAL</span><span>R$ ${total.toFixed(2)}</span></div>
  <div class="row"><span>Pagamento</span><span>${formaPg}</span></div>
  ${trocoLinha}
  <hr>
  <div class="rodape">Obrigado pela preferência!<br>Volte sempre! 🍔❤️</div>
  </body></html>`)
  janela.document.close()
  janela.focus()
  janela.print()
  janela.close()
}

function novoPedido() {
  _comprovanteAtual = null
  mostrar('vendas')
}

// ==================== PEDIDOS DO CLIENTE ====================
async function listarPedidosCliente() {
  if (!clienteLogado) { toast('Faça login para ver seus pedidos.', 'warning'); mostrar('login'); return }

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
  if (!db) return toast('Banco de dados indisponível.', 'error')
  const { data: pedidos, error } = await db
    .from('pedidos')
    .select('*, itens_pedido(quantidade, produtos(nome))')

  if (error) return console.error('Erro ao gerar relatório:', error.message)

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

  if (grafico)    grafico.destroy()
  if (graficoDia) graficoDia.destroy()

  const nomes      = Object.keys(contagem)
  const quantidades = Object.values(contagem)

  grafico = new Chart(document.getElementById("graficoVendas"), {
    type: 'bar',
    data: {
      labels: nomes,
      datasets: [{ label: 'Quantidade Vendida', data: quantidades, backgroundColor: 'rgba(59,130,246,0.6)' }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  })

  const oneDay       = 86400000
  const startTodayTs = startOfToday.getTime()
  const windowStart  = startTodayTs - 6 * oneDay
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
const TELAS = ['vendas', 'pagamento', 'dashboard', 'cliente-cadastro', 'cliente-pedidos', 'login', 'comprovante', 'config-usuarios', 'config-modulos', 'config-perfis']

function mostrar(id) {
  document.querySelector('.sidebar')?.classList.remove('aberta')
  document.getElementById('sidebarOverlay')?.classList.remove('show')

  TELAS.forEach(t => {
    const el = document.getElementById(t)
    if (el) el.classList.add('hidden')
  })

  if (id === 'dashboard') {
    if (!usuarioLogado || usuarioLogado.nivel !== 'operador') {
      toast('Acesso restrito: apenas operador interno pode ver o Dashboard.', 'warning')
      return
    }
    document.getElementById('dashboard').classList.remove('hidden')
    gerarRelatorio()
    return
  }

  const alvo = document.getElementById(id)
  if (alvo) alvo.classList.remove('hidden')
}

function abrirNovoProduto()  { document.getElementById("novoProdutoBox").classList.remove("hidden") }
function fecharNovoProduto() { document.getElementById("novoProdutoBox").classList.add("hidden") }

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('aberta')
  document.getElementById('sidebarOverlay').classList.toggle('show')
}

// ==================== CONFIG: ESTADO ====================
let _usuariosSistema = []
let _perfisSistema   = []
let _modulosSistema  = []

// ==================== CONFIG: UTILITÁRIOS ====================
function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function _guardaAdmin() {
  if (!usuarioLogado || usuarioLogado.nivel !== 'admin') {
    toast('Acesso restrito ao administrador.', 'warning')
    return false
  }
  if (!db) { toast('Sem conexão com o banco de dados.', 'error'); return false }
  return true
}

// ==================== CONFIG: CARREGADORES ====================
async function _carregarPerfisSistema() {
  const { data, error } = await db.from('perfis_sistema').select('*').order('nome')
  if (error) { console.error('perfis_sistema:', error.message); return }
  _perfisSistema = data || []
}

async function _carregarModulosSistema() {
  const { data, error } = await db.from('modulos_sistema').select('*').order('nome')
  if (error) { console.error('modulos_sistema:', error.message); return }
  _modulosSistema = data || []
}

async function _carregarUsuariosSistema() {
  const { data, error } = await db
    .from('usuarios_sistema')
    .select('*, perfis_sistema(nome)')
    .order('nome')
  if (error) { console.error('usuarios_sistema:', error.message); return }
  _usuariosSistema = data || []
}

// ==================== CONFIG: USUARIOS ====================
async function abrirConfigUsuarios() {
  if (!_guardaAdmin()) return
  await Promise.all([_carregarPerfisSistema(), _carregarUsuariosSistema()])
  _renderizarTabelaUsuarios()
  mostrar('config-usuarios')
}

function _renderizarTabelaUsuarios() {
  const tbody = document.getElementById('tabelaUsuarios')
  if (!tbody) return
  if (_usuariosSistema.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="config-empty">Nenhum usuario cadastrado.</td></tr>'
    return
  }
  tbody.innerHTML = _usuariosSistema.map(u => `
    <tr class="${u.ativo ? '' : 'row-inativo'}">
      <td>${_esc(u.nome)}</td>
      <td><code>${_esc(u.username)}</code></td>
      <td>${u.perfis_sistema ? _esc(u.perfis_sistema.nome) : '<span class="text-muted">Sem perfil</span>'}</td>
      <td><span class="status-badge ${u.ativo ? 'status-ativo' : 'status-inativo'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td class="acoes-cell">
        <button class="btn btn-sm" onclick="editarUsuario('${u.id}')">Editar</button>
        <button class="btn btn-sm ${u.ativo ? 'btn-danger' : ''}" onclick="${u.ativo ? `desativarUsuario('${u.id}')` : `reativarUsuario('${u.id}')`}">
          ${u.ativo ? 'Desativar' : 'Reativar'}
        </button>
      </td>
    </tr>`).join('')
}

function _popularSelectPerfis(selectId, selectedId) {
  const el = document.getElementById(selectId)
  if (!el) return
  el.innerHTML = '<option value="">Sem perfil</option>' +
    _perfisSistema.filter(p => p.ativo).map(p =>
      `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${_esc(p.nome)}</option>`
    ).join('')
}

function abrirModalNovoUsuario() {
  _popularSelectPerfis('usuarioPerfil', null)
  document.getElementById('usuarioId').value = ''
  document.getElementById('usuarioNome').value = ''
  document.getElementById('usuarioUsername').value = ''
  document.getElementById('usuarioSenha').value = ''
  document.getElementById('usuarioAtivo').checked = true
  document.getElementById('modalUsuarioTitulo').textContent = 'Novo Usuario'
  document.getElementById('usuarioSenhaLabel').textContent = 'Senha *'
  document.getElementById('modalUsuario').classList.remove('hidden')
}

function editarUsuario(id) {
  const u = _usuariosSistema.find(x => x.id === id)
  if (!u) return
  _popularSelectPerfis('usuarioPerfil', u.perfil_id)
  document.getElementById('usuarioId').value = u.id
  document.getElementById('usuarioNome').value = u.nome
  document.getElementById('usuarioUsername').value = u.username
  document.getElementById('usuarioSenha').value = ''
  document.getElementById('usuarioAtivo').checked = u.ativo
  document.getElementById('modalUsuarioTitulo').textContent = 'Editar Usuario'
  document.getElementById('usuarioSenhaLabel').textContent = 'Senha (deixe em branco para manter)'
  document.getElementById('modalUsuario').classList.remove('hidden')
}

function fecharModalUsuario() {
  document.getElementById('modalUsuario').classList.add('hidden')
}

async function salvarUsuario() {
  const id       = document.getElementById('usuarioId').value
  const nome     = document.getElementById('usuarioNome').value.trim()
  const username = document.getElementById('usuarioUsername').value.trim().toLowerCase()
  const senha    = document.getElementById('usuarioSenha').value
  const perfilId = document.getElementById('usuarioPerfil').value || null
  const ativo    = document.getElementById('usuarioAtivo').checked

  if (!nome || !username) return toast('Nome e username sao obrigatorios.', 'warning')
  if (!id && !senha)      return toast('Senha e obrigatoria para novo usuario.', 'warning')

  try {
    if (id) {
      const updates = { nome, username, perfil_id: perfilId, ativo }
      if (senha) updates.senha_hash = await hashSenha(senha)
      const { error } = await db.from('usuarios_sistema').update(updates).eq('id', id)
      if (error) return toast('Erro ao atualizar: ' + error.message, 'error')
      toast('Usuario atualizado!', 'success')
    } else {
      const { error } = await db.from('usuarios_sistema').insert([{
        nome, username, senha_hash: await hashSenha(senha), perfil_id: perfilId, ativo
      }])
      if (error) return toast('Erro ao criar usuario: ' + error.message, 'error')
      toast('Usuario criado!', 'success')
    }
    fecharModalUsuario()
    await _carregarUsuariosSistema()
    _renderizarTabelaUsuarios()
  } catch(e) { toast('Erro inesperado: ' + e.message, 'error') }
}

async function desativarUsuario(id) {
  if (!await confirmar('Deseja desativar este usuario?')) return
  const { error } = await db.from('usuarios_sistema').update({ ativo: false }).eq('id', id)
  if (error) return toast('Erro: ' + error.message, 'error')
  toast('Usuario desativado.', 'success')
  await _carregarUsuariosSistema()
  _renderizarTabelaUsuarios()
}

async function reativarUsuario(id) {
  const { error } = await db.from('usuarios_sistema').update({ ativo: true }).eq('id', id)
  if (error) return toast('Erro: ' + error.message, 'error')
  toast('Usuario reativado.', 'success')
  await _carregarUsuariosSistema()
  _renderizarTabelaUsuarios()
}

// ==================== CONFIG: MODULOS ====================
async function abrirConfigModulos() {
  if (!_guardaAdmin()) return
  await _carregarModulosSistema()
  _renderizarTabelaModulos()
  mostrar('config-modulos')
}

function _renderizarTabelaModulos() {
  const tbody = document.getElementById('tabelaModulos')
  if (!tbody) return
  if (_modulosSistema.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="config-empty">Nenhum modulo cadastrado.</td></tr>'
    return
  }
  tbody.innerHTML = _modulosSistema.map(m => `
    <tr class="${m.ativo ? '' : 'row-inativo'}">
      <td style="font-size:1.3em;text-align:center">${m.icone || '📋'}</td>
      <td style="font-weight:600">${_esc(m.nome)}</td>
      <td style="color:#64748b">${_esc(m.descricao || '')}</td>
      <td><span class="status-badge ${m.ativo ? 'status-ativo' : 'status-inativo'}">${m.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td class="acoes-cell">
        <button class="btn btn-sm" onclick="editarModulo('${m.id}')">Editar</button>
        <button class="btn btn-sm ${m.ativo ? 'btn-danger' : ''}" onclick="${m.ativo ? `desativarModulo('${m.id}')` : `reativarModulo('${m.id}')`}">
          ${m.ativo ? 'Desativar' : 'Reativar'}
        </button>
      </td>
    </tr>`).join('')
}

function abrirModalNovoModulo() {
  document.getElementById('moduloId').value = ''
  document.getElementById('moduloNome').value = ''
  document.getElementById('moduloDescricao').value = ''
  document.getElementById('moduloIcone').value = '📋'
  document.getElementById('moduloAtivo').checked = true
  document.getElementById('modalModuloTitulo').textContent = 'Novo Modulo'
  document.getElementById('modalModulo').classList.remove('hidden')
}

function editarModulo(id) {
  const m = _modulosSistema.find(x => x.id === id)
  if (!m) return
  document.getElementById('moduloId').value = m.id
  document.getElementById('moduloNome').value = m.nome
  document.getElementById('moduloDescricao').value = m.descricao || ''
  document.getElementById('moduloIcone').value = m.icone || '📋'
  document.getElementById('moduloAtivo').checked = m.ativo
  document.getElementById('modalModuloTitulo').textContent = 'Editar Modulo'
  document.getElementById('modalModulo').classList.remove('hidden')
}

function fecharModalModulo() {
  document.getElementById('modalModulo').classList.add('hidden')
}

async function salvarModulo() {
  const id        = document.getElementById('moduloId').value
  const nome      = document.getElementById('moduloNome').value.trim()
  const descricao = document.getElementById('moduloDescricao').value.trim()
  const icone     = document.getElementById('moduloIcone').value.trim() || '📋'
  const ativo     = document.getElementById('moduloAtivo').checked

  if (!nome) return toast('Nome do modulo e obrigatorio.', 'warning')

  try {
    if (id) {
      const { error } = await db.from('modulos_sistema').update({ nome, descricao, icone, ativo }).eq('id', id)
      if (error) return toast('Erro ao atualizar: ' + error.message, 'error')
      toast('Modulo atualizado!', 'success')
    } else {
      const { error } = await db.from('modulos_sistema').insert([{ nome, descricao, icone, ativo }])
      if (error) return toast('Erro ao criar modulo: ' + error.message, 'error')
      toast('Modulo criado!', 'success')
    }
    fecharModalModulo()
    await _carregarModulosSistema()
    _renderizarTabelaModulos()
  } catch(e) { toast('Erro inesperado: ' + e.message, 'error') }
}

async function desativarModulo(id) {
  if (!await confirmar('Deseja desativar este modulo?')) return
  const { error } = await db.from('modulos_sistema').update({ ativo: false }).eq('id', id)
  if (error) return toast('Erro: ' + error.message, 'error')
  toast('Modulo desativado.', 'success')
  await _carregarModulosSistema()
  _renderizarTabelaModulos()
}

async function reativarModulo(id) {
  const { error } = await db.from('modulos_sistema').update({ ativo: true }).eq('id', id)
  if (error) return toast('Erro: ' + error.message, 'error')
  toast('Modulo reativado.', 'success')
  await _carregarModulosSistema()
  _renderizarTabelaModulos()
}

// ==================== CONFIG: PERFIS ====================
async function abrirConfigPerfis() {
  if (!_guardaAdmin()) return
  await Promise.all([_carregarPerfisSistema(), _carregarModulosSistema()])
  _renderizarTabelaPerfis()
  _popularSelectPerfisConfig()
  document.getElementById('matrizPermissoes')?.classList.add('hidden')
  mostrar('config-perfis')
}

function _renderizarTabelaPerfis() {
  const tbody = document.getElementById('tabelaPerfis')
  if (!tbody) return
  if (_perfisSistema.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="config-empty">Nenhum perfil cadastrado.</td></tr>'
    return
  }
  tbody.innerHTML = _perfisSistema.map(p => `
    <tr class="${p.ativo ? '' : 'row-inativo'}">
      <td style="font-weight:600">${_esc(p.nome)}</td>
      <td style="color:#64748b">${_esc(p.descricao || '')}</td>
      <td><span class="status-badge ${p.ativo ? 'status-ativo' : 'status-inativo'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td class="acoes-cell">
        <button class="btn btn-sm" onclick="editarPerfil('${p.id}')">Editar</button>
        <button class="btn btn-sm ${p.ativo ? 'btn-danger' : ''}" onclick="${p.ativo ? `desativarPerfil('${p.id}')` : `reativarPerfil('${p.id}')`}">
          ${p.ativo ? 'Desativar' : 'Reativar'}
        </button>
      </td>
    </tr>`).join('')
}

function _popularSelectPerfisConfig() {
  const select = document.getElementById('perfilSelecionado')
  if (!select) return
  const atualId = select.value
  select.innerHTML = '<option value="">-- Selecione um perfil --</option>' +
    _perfisSistema.map(p =>
      `<option value="${p.id}" ${p.id === atualId ? 'selected' : ''}>${_esc(p.nome)}${!p.ativo ? ' (inativo)' : ''}</option>`
    ).join('')
  if (atualId && _perfisSistema.find(p => p.id === atualId)) select.value = atualId
}

async function carregarMatrizPermissoes() {
  const perfilId = document.getElementById('perfilSelecionado').value
  const matrizEl = document.getElementById('matrizPermissoes')
  if (!perfilId) { matrizEl.classList.add('hidden'); return }

  const perfil = _perfisSistema.find(p => p.id === perfilId)
  if (!perfil) return

  const { data: perms, error } = await db.from('permissoes').select('*').eq('perfil_id', perfilId)
  if (error) return toast('Erro ao carregar permissoes: ' + error.message, 'error')

  const permMap = {}
  ;(perms || []).forEach(p => { permMap[p.modulo_id] = p })

  document.getElementById('perfilNomeHeader').textContent = 'Perfil: ' + perfil.nome

  const ativos = _modulosSistema.filter(m => m.ativo)
  const tbody  = document.getElementById('tabelaPermissoes')

  if (ativos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="config-empty">Nenhum modulo ativo cadastrado.</td></tr>'
    matrizEl.classList.remove('hidden')
    return
  }

  tbody.innerHTML = ativos.map(m => {
    const p = permMap[m.id] || {}
    return `
      <tr>
        <td>
          <div class="modulo-nome-cell">
            <span class="modulo-icone">${m.icone || '📋'}</span>
            <div>
              <div style="font-weight:600">${_esc(m.nome)}</div>
              ${m.descricao ? `<div style="font-size:0.78em;color:#94a3b8">${_esc(m.descricao)}</div>` : ''}
            </div>
          </div>
        </td>
        <td class="perm-cell">
          <input type="checkbox" data-modulo="${m.id}" data-perm="visualizar"
                 ${p.pode_visualizar ? 'checked' : ''} onchange="sincronizarCheckboxes(this)">
        </td>
        <td class="perm-cell">
          <input type="checkbox" data-modulo="${m.id}" data-perm="editar"
                 ${p.pode_editar ? 'checked' : ''} onchange="sincronizarCheckboxes(this)">
        </td>
        <td class="perm-cell">
          <input type="checkbox" data-modulo="${m.id}" data-perm="excluir"
                 ${p.pode_excluir ? 'checked' : ''} onchange="sincronizarCheckboxes(this)">
        </td>
      </tr>`
  }).join('')

  matrizEl.classList.remove('hidden')
}

function sincronizarCheckboxes(cb) {
  if ((cb.dataset.perm === 'editar' || cb.dataset.perm === 'excluir') && cb.checked) {
    const viz = document.querySelector(`input[data-modulo="${cb.dataset.modulo}"][data-perm="visualizar"]`)
    if (viz) viz.checked = true
  }
}

async function salvarPermissoes() {
  const perfilId = document.getElementById('perfilSelecionado').value
  if (!perfilId) return toast('Selecione um perfil.', 'warning')

  const checkboxes = document.querySelectorAll('#tabelaPermissoes input[type="checkbox"]')
  const moduloMap  = {}

  checkboxes.forEach(cb => {
    const mId = cb.dataset.modulo
    if (!moduloMap[mId]) moduloMap[mId] = { pode_visualizar: false, pode_editar: false, pode_excluir: false }
    if (cb.dataset.perm === 'visualizar') moduloMap[mId].pode_visualizar = cb.checked
    if (cb.dataset.perm === 'editar')     moduloMap[mId].pode_editar     = cb.checked
    if (cb.dataset.perm === 'excluir')    moduloMap[mId].pode_excluir    = cb.checked
  })

  const upserts = Object.entries(moduloMap).map(([moduloId, perms]) => ({
    perfil_id: perfilId, modulo_id: moduloId, ...perms
  }))

  if (upserts.length === 0) return toast('Nenhum modulo disponivel.', 'warning')

  const { error } = await db.from('permissoes').upsert(upserts, { onConflict: 'perfil_id,modulo_id' })
  if (error) return toast('Erro ao salvar permissoes: ' + error.message, 'error')
  toast('Permissoes salvas com sucesso!', 'success')
}

function abrirModalNovoPerfil() {
  document.getElementById('perfilIdModal').value = ''
  document.getElementById('perfilNomeInput').value = ''
  document.getElementById('perfilDescricaoInput').value = ''
  document.getElementById('perfilAtivoInput').checked = true
  document.getElementById('modalPerfilTitulo').textContent = 'Novo Perfil'
  document.getElementById('modalPerfil').classList.remove('hidden')
}

function editarPerfil(id) {
  const p = _perfisSistema.find(x => x.id === id)
  if (!p) return
  document.getElementById('perfilIdModal').value = p.id
  document.getElementById('perfilNomeInput').value = p.nome
  document.getElementById('perfilDescricaoInput').value = p.descricao || ''
  document.getElementById('perfilAtivoInput').checked = p.ativo
  document.getElementById('modalPerfilTitulo').textContent = 'Editar Perfil'
  document.getElementById('modalPerfil').classList.remove('hidden')
}

function fecharModalPerfil() {
  document.getElementById('modalPerfil').classList.add('hidden')
}

async function salvarPerfil() {
  const id        = document.getElementById('perfilIdModal').value
  const nome      = document.getElementById('perfilNomeInput').value.trim()
  const descricao = document.getElementById('perfilDescricaoInput').value.trim()
  const ativo     = document.getElementById('perfilAtivoInput').checked

  if (!nome) return toast('Nome do perfil e obrigatorio.', 'warning')

  try {
    if (id) {
      const { error } = await db.from('perfis_sistema').update({ nome, descricao, ativo }).eq('id', id)
      if (error) return toast('Erro ao atualizar: ' + error.message, 'error')
      toast('Perfil atualizado!', 'success')
    } else {
      const { error } = await db.from('perfis_sistema').insert([{ nome, descricao, ativo }])
      if (error) return toast('Erro ao criar perfil: ' + error.message, 'error')
      toast('Perfil criado!', 'success')
    }
    fecharModalPerfil()
    await _carregarPerfisSistema()
    _renderizarTabelaPerfis()
    _popularSelectPerfisConfig()
  } catch(e) { toast('Erro inesperado: ' + e.message, 'error') }
}

async function desativarPerfil(id) {
  if (!await confirmar('Deseja desativar este perfil?')) return
  const { error } = await db.from('perfis_sistema').update({ ativo: false }).eq('id', id)
  if (error) return toast('Erro: ' + error.message, 'error')
  toast('Perfil desativado.', 'success')
  await _carregarPerfisSistema()
  _renderizarTabelaPerfis()
  _popularSelectPerfisConfig()
}

async function reativarPerfil(id) {
  const { error } = await db.from('perfis_sistema').update({ ativo: true }).eq('id', id)
  if (error) return toast('Erro: ' + error.message, 'error')
  toast('Perfil reativado.', 'success')
  await _carregarPerfisSistema()
  _renderizarTabelaPerfis()
  _popularSelectPerfisConfig()
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  mostrar('login')
  configurarFormaPagamento()
  await carregarProdutos()
  try { document.getElementById('btnDashboard').classList.add('hidden') } catch(e) {}
  try { document.getElementById('adminArea').classList.add('hidden') } catch(e) {}

  document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('aberta')
    document.getElementById('sidebarOverlay').classList.remove('show')
  })
})
