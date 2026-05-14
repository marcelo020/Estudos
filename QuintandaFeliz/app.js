// ─── CONFIGURAÇÃO DA API ──────────────────────────────────────────────────────
const API = "http://localhost:3000/api";

let jwtToken = null; // token JWT retornado pelo servidor após login

function apiHeaders(auth = false) {
    const h = { "Content-Type": "application/json" };
    if (auth && jwtToken) h["Authorization"] = `Bearer ${jwtToken}`;
    return h;
}

// ─── DADOS ────────────────────────────────────────────────────────────────────
let produtos = [];

let carrinho=[];
let ficha=1;
let usuarioLogado=null;
let clienteLogado = null;

function atualizarInterfacePosLogin(){
    const nivel = usuarioLogado ? usuarioLogado.nivel : "";
    const isAdmin = nivel === "administrador";
    const isOperador = nivel === "operador";
    const isCliente = nivel === "cliente";

    document.getElementById("btnLogin").classList.toggle("hidden", !!usuarioLogado);
    document.getElementById("btnLogout").classList.toggle("hidden", !usuarioLogado);
    document.getElementById("btnVendas").classList.toggle("hidden", !usuarioLogado);
    document.getElementById("btnDashboard").classList.toggle("hidden", !isOperador);
    document.getElementById("adminArea").classList.toggle("hidden", !isAdmin);
    document.getElementById("btnMeusPedidos").classList.toggle("hidden", !isCliente);

    if(usuarioLogado){
        document.getElementById("clienteNome").innerText = usuarioLogado.nome;
        document.getElementById("usuarioPerfil").innerText = nivel;
        document.getElementById("clienteInfo").classList.remove("hidden");
    } else {
        document.getElementById("clienteInfo").classList.add("hidden");
        document.getElementById("clienteNome").innerText = "";
        document.getElementById("usuarioPerfil").innerText = "";
    }
}

function redirecionarPorPerfil(){
    if(!usuarioLogado){
        mostrar("login");
        return;
    }

    if(usuarioLogado.nivel === "operador"){
        mostrar("dashboard");
        return;
    }

    mostrar("vendas");
}

// LOGIN
async function fazerLogin(){
    const u = document.getElementById("user").value.trim();
    const p = document.getElementById("pass").value;

    if(!u || !p){
        document.getElementById("erro").innerText = "Preencha login e senha.";
        return;
    }

    try {
        const resp = await fetch(`${API}/login`, {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify({ login: u, senha: p })
        });
        const dados = await resp.json();

        if(!resp.ok){
            document.getElementById("erro").innerText = dados.erro || "Login inválido.";
            return;
        }

        jwtToken = dados.token;
        usuarioLogado = dados.usuario;
        clienteLogado = usuarioLogado.nivel === "cliente" ? usuarioLogado : null;

        document.getElementById("erro").innerText = "";
        document.getElementById("login").classList.add("hidden");

        atualizarInterfacePosLogin();
        await carregarProdutos();
        redirecionarPorPerfil();

    } catch(e) {
        document.getElementById("erro").innerText = "Não foi possível conectar ao servidor.";
    }
}



// MOSTRAR TELAS
function mostrar(id){
    vendas.classList.add("hidden");
    pagamento.classList.add("hidden");
    dashboard.classList.add("hidden");
    document.getElementById('login').classList.add('hidden');
    document.getElementById('cliente-pedidos').classList.add('hidden');

    if(id !== "login" && !usuarioLogado){
        document.getElementById("erro").innerText = "Faça login para acessar o sistema.";
        document.getElementById("login").classList.remove("hidden");
        return;
    }

    // bloqueio de acesso: somente operador interno pode abrir dashboard
    if(id === "dashboard"){
        if(!usuarioLogado || usuarioLogado.nivel !== "operador"){
            alert('Acesso restrito: apenas operador interno pode ver o Dashboard.');
            return;
        }
        document.getElementById(id).classList.remove("hidden");
        gerarRelatorio();
        return;
    }

    document.getElementById(id).classList.remove("hidden");
}

// LISTAR PEDIDOS DO CLIENTE
async function listarPedidosCliente(){
    if(!usuarioLogado || usuarioLogado.nivel !== "cliente"){
        alert('Apenas clientes podem ver seus pedidos.');
        return;
    }

    try {
        const resp = await fetch(`${API}/vendas/minhas`, {
            headers: apiHeaders(true)
        });
        if(!resp.ok){ alert('Erro ao buscar pedidos.'); return; }
        const meus = await resp.json();

        const container = document.getElementById('listaPedidosCliente');
        if(!container) return;
        if(meus.length===0){
            container.innerHTML = '<p>Nenhum pedido encontrado.</p>';
        } else {
            container.innerHTML = meus.map(v=>{
                const itens = v.itens.map(it=>`<li>${it.qtd} x ${it.nome} — R$ ${it.preco.toFixed(2)}</li>`).join('');
                return `
                    <div class="card" style="margin-bottom:10px">
                        <strong>Pedido #${v.ficha}</strong> — ${v.data}<br>
                        <small>Pagamento: ${v.forma} | Total: R$ ${v.total.toFixed(2)}</small>
                        <ul style="margin-top:8px">${itens}</ul>
                    </div>
                `;
            }).join('');
        }
        mostrar('cliente-pedidos');
    } catch(e) {
        alert('Erro ao conectar ao servidor.');
    }
}

// CLIENTE: helpers (mantido para compatibilidade, mas cadastro agora vai para API)
function getClientes(){
    return JSON.parse(localStorage.getItem('clientes'))||[];
}

function saveClientes(clientes){
    localStorage.setItem('clientes', JSON.stringify(clientes));
}

async function cadastrarCliente(){
    const nome   = (document.getElementById('cadNome').value   || '').trim();
    const email  = (document.getElementById('cadEmail').value  || '').trim().toLowerCase();
    const senha  = document.getElementById('cadSenha').value   || '';
    const senha2 = document.getElementById('cadSenha2').value  || '';
    const msg    = document.getElementById('cadastroMsg');

    msg.style.color = 'red';
    msg.innerText = '';

    if(!nome || !email || !senha || !senha2){
        msg.innerText = 'Preencha todos os campos.';
        return;
    }
    if(senha.length < 6){
        msg.innerText = 'A senha deve ter pelo menos 6 caracteres.';
        return;
    }
    if(senha !== senha2){
        msg.innerText = 'As senhas não conferem.';
        return;
    }

    try {
        const resp = await fetch(`${API}/cadastro`, {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify({ nome, email, senha, senha2 })
        });
        const dados = await resp.json();

        if(!resp.ok){
            msg.innerText = dados.erro || 'Erro no cadastro.';
            return;
        }

        document.getElementById('cadNome').value  = '';
        document.getElementById('cadEmail').value = '';
        document.getElementById('cadSenha').value = '';
        document.getElementById('cadSenha2').value = '';

        msg.style.color = 'green';
        msg.innerText = dados.mensagem || 'Cadastro realizado! Faça login.';

    } catch(e) {
        msg.innerText = 'Não foi possível conectar ao servidor.';
    }
}

function logout(){
    usuarioLogado = null;
    clienteLogado = null;
    jwtToken = null;
    document.getElementById('user').value = '';
    document.getElementById('pass').value = '';
    document.getElementById('erro').innerText = '';

    atualizarInterfacePosLogin();
    carregarProdutos();
    mostrar('login');
}

// CARDÁPIO DINÂMICO
async function carregarProdutos(){
    try {
        const resp = await fetch(`${API}/produtos`);
        if(resp.ok) produtos = await resp.json();
    } catch(e) {
        // fallback para lista em memória se servidor estiver offline
    }

    const container = document.getElementById("listaProdutos");
    container.innerHTML="";
    container.classList.add("produtos-grid");

    produtos.forEach(p=>{

        let botaoAdmin = "";

        // somente mostra ações administrativas para usuário com nível 'administrador'
        if(usuarioLogado && usuarioLogado.nivel === "administrador"){
            botaoAdmin = `
            <button class="btn btn-admin" onclick="editarPreco(${p.id})">✏️ Editar Preço</button>
            <button class="btn btn-danger" onclick="excluirProduto(${p.id})">🗑️ Excluir</button>`;
        }

        container.innerHTML+=`
        <div class="produto-card">
            <img src="${p.img}" alt="${p.nome}">
            <div class="produto-info">
                <h4>${p.nome}</h4>
                <p>R$ ${p.preco.toFixed(2)}</p>
                <button class="btn btn-add" onclick="addCarrinho(${p.id})">
                    🛒 Adicionar
                </button>
                ${botaoAdmin}
            </div>
        </div>
        `;
    });
}


function addCarrinho(id){
    let item=carrinho.find(i=>i.id===id);
    if(item){
        item.qtd++;
    }else{
        let prod=produtos.find(p=>p.id===id);
        carrinho.push({...prod,qtd:1});
    }
    atualizarCarrinho();
}

function atualizarCarrinho(){
    const carrinhoDiv = document.getElementById("carrinho");
    carrinhoDiv.innerHTML="";
    let total=0;

        carrinho.forEach((i,index)=>{
        total += i.preco * i.qtd;

        carrinhoDiv.innerHTML += `
        <div class="carrinho-item">
            <div>
                <strong>${i.nome}</strong><br>
                ${i.qtd} x R$ ${i.preco.toFixed(2)}
            </div>
            <button class="btn btn-danger" onclick="remover(${index})">❌</button>
        </div>`;
    });

    document.getElementById("total").innerText = total.toFixed(2);
    

}
async function editarPreco(id){

    if(!usuarioLogado || usuarioLogado.nivel !== "administrador"){
        alert("Apenas o administrador pode alterar preços.");
        return;
    }

    let produto = produtos.find(p => p.id === id);

    if(!produto){
        alert("Produto não encontrado!");
        return;
    }

    let novoPreco = prompt(
        "Novo valor para " + produto.nome + 
        "\nValor atual: R$ " + produto.preco.toFixed(2)
    );

    if(novoPreco === null) return; // cancelou

    // Substitui vírgula por ponto (importante no Brasil)
    novoPreco = novoPreco.replace(",", ".");
    novoPreco = parseFloat(novoPreco);

    if(isNaN(novoPreco) || novoPreco <= 0){
        alert("Digite um valor válido!");
        return;
    }

    try {
        const resp = await fetch(`${API}/produtos/${id}`, {
            method: "PUT",
            headers: apiHeaders(true),
            body: JSON.stringify({ preco: novoPreco })
        });
        if(!resp.ok){ alert("Erro ao atualizar preço."); return; }
        produto.preco = novoPreco;
        await carregarProdutos();
        alert("Preço atualizado com sucesso!");
    } catch(e) {
        alert("Não foi possível conectar ao servidor.");
    }
}

async function excluirProduto(id){
    if(!usuarioLogado || usuarioLogado.nivel !== "administrador"){
        alert("Apenas o administrador pode excluir produtos.");
        return;
    }

    if(!confirm("Confirma exclusão deste produto?")) return;

    try {
        const resp = await fetch(`${API}/produtos/${id}`, {
            method: "DELETE",
            headers: apiHeaders(true)
        });
        if(!resp.ok){ alert("Erro ao excluir produto."); return; }

        // Remove do carrinho, se houver
        carrinho = carrinho.filter(i => i.id !== id);
        atualizarCarrinho();
        await carregarProdutos();
        alert("Produto excluído com sucesso!");
    } catch(e) {
        alert("Não foi possível conectar ao servidor.");
    }
}



function remover(i){
    carrinho.splice(i,1);
    atualizarCarrinho();
}

// PAGAMENTO
function irPagamento(){
    if(carrinho.length===0){
        alert("Carrinho vazio!");
        return;
    }
    mostrar("pagamento");
}

forma.onchange=function(){
    dinheiroCampo.classList.toggle("hidden",forma.value!=="Dinheiro");
}

async function finalizar(){
    let total=parseFloat(document.getElementById("total").innerText);
    let formaPg=forma.value;
    if(!formaPg) return alert("Escolha forma pagamento");

    let troco=0;
    if(formaPg==="Dinheiro"){
        let recebido=parseFloat(valorRecebido.value);
        if(recebido<total) return alert("Valor insuficiente");
        troco=recebido-total;
    }

    let venda={
        ficha:ficha++,
        itens:carrinho,
        total,
        forma:formaPg,
        data:new Date().toLocaleString(),
        timestamp: Date.now()
    };

    await salvarVenda(venda);

    let janela = window.open("", "PRINT", "width=400,height=600");

    janela.document.write(`
    <html>
    <head>
        <style>
            body{
                font-family: monospace;
                width: 280px;
            }
            h3{
                text-align:center;
            }
            hr{
                border-top:1px dashed black;
            }
        </style>
    </head>
    <body>
        <h3>LANCHE FELIZ</h3>
        <p>Data: ${venda.data}</p>
        <p>Cliente: ${clienteLogado ? clienteLogado.nome : 'Consumidor'}</p>
        <hr>
    `);

    venda.itens.forEach(item=>{
        janela.document.write(`
            <p>${item.nome}<br>
            ${item.qtd} x ${item.preco.toFixed(2)}</p>
        `);
    });

    janela.document.write(`
        <hr>
        <p><strong>Total: R$ ${venda.total.toFixed(2)}</strong></p>
        <p>Pagamento: ${venda.forma}</p>
        <p>Troco: R$ ${troco.toFixed(2)}</p>
        <hr>
        <p style="text-align:center">Obrigado pela preferência!</p>
    </body>
    </html>
    `);

    janela.document.close();
    janela.focus();
    janela.print();
    janela.close();

    // após impressão, limpar carrinho e redirecionar ao cardápio
    carrinho = [];
    atualizarCarrinho();
    mostrar('vendas');
}


// BANCO — agora salva no servidor
async function salvarVenda(v){
    // mantém compatibilidade com dashboard (localStorage para relatório local)
    let vendas=JSON.parse(localStorage.getItem("vendas"))||[];
    if(clienteLogado){
        v.cliente = { id: clienteLogado.id, nome: clienteLogado.nome, email: clienteLogado.email };
    }
    if(!v.timestamp) v.timestamp = Date.now();
    vendas.push(v);
    localStorage.setItem("vendas",JSON.stringify(vendas));

    // persiste no servidor se autenticado
    if(jwtToken){
        try {
            await fetch(`${API}/vendas`, {
                method: "POST",
                headers: apiHeaders(true),
                body: JSON.stringify(v)
            });
        } catch(e) { /* silencia: já salvo em localStorage */ }
    }
}

// DASHBOARD
let grafico; // gráfico de produtos
let graficoDia; // gráfico de vendas por dia

function gerarRelatorio(){
    let vendas = JSON.parse(localStorage.getItem("vendas")) || [];
    let totalAll = 0;
    let contagem = {};

    vendas.forEach(v=>{
        totalAll += v.total;

        v.itens.forEach(i=>{
            contagem[i.nome] = (contagem[i.nome] || 0) + i.qtd;
        });
    });

    let nomes = Object.keys(contagem);
    let quantidades = Object.values(contagem);

    let maisVendido = nomes.length > 0 
        ? nomes.reduce((a,b)=>contagem[a] > contagem[b] ? a : b)
        : "-";

    document.getElementById("relatorio").innerHTML = `
        <div class="card">
        💰 Total Vendido (geral): R$ ${totalAll.toFixed(2)}<br>
        🏆 Produto Mais Vendido: ${maisVendido}
        </div>
    `;

    // destruir gráfico antigo se existir
    if(grafico){ grafico.destroy(); }
    if(graficoDia){ graficoDia.destroy(); }

    const ctx = document.getElementById("graficoVendas");
    grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nomes,
            datasets: [{
                label: 'Quantidade Vendida',
                data: quantidades,
                backgroundColor: 'rgba(59,130,246,0.6)'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // --- GRÁFICO DE VENDAS POR DIA (últimos 7 dias) ---
    const now = Date.now();
    const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
    const startTodayTs = startOfToday.getTime();

    // total do dia e do mês
    let totalDia = 0;
    let startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const startMonthTs = startOfMonth.getTime();
    let totalMes = 0;

    // prepare labels for last 7 days
    const days = [];
    const vendasPorDia = [];
    const oneDay = 24*60*60*1000;
    for(let d=6; d>=0; d--){
        const dayTs = startTodayTs - d*oneDay;
        const dt = new Date(dayTs);
        const label = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;
        days.push(label);
        vendasPorDia.push(0);
    }

    const windowStart = startTodayTs - 6*oneDay;

    vendas.forEach(v=>{
        const ts = v.timestamp || Date.parse(v.data);
        if(!isNaN(ts)){
            if(ts >= startTodayTs && ts < startTodayTs + oneDay) totalDia += v.total;
            if(ts >= startMonthTs && ts < startMonthTs + 31*oneDay) totalMes += v.total;
            if(ts >= windowStart && ts <= startTodayTs + oneDay){
                const idx = Math.floor((ts - windowStart)/oneDay);
                if(idx >=0 && idx < vendasPorDia.length) vendasPorDia[idx] += v.total;
            }
        }
    });

    // atualizar relatório com novos totais
    document.getElementById("relatorio").innerHTML = `
        <div class="card">
        💰 Total Vendido Hoje: R$ ${totalDia.toFixed(2)}<br>
        💳 Total Vendido no Mês: R$ ${totalMes.toFixed(2)}<br>
        🧾 Total de Vendas Registradas: ${vendas.length}
        </div>
    `;

    const ctx2 = document.getElementById("graficoVendasDia");
    graficoDia = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Total R$ por dia (últimos 7 dias)',
                data: vendasPorDia,
                backgroundColor: 'rgba(16,185,129,0.2)',
                borderColor: 'rgba(16,185,129,1)'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function abrirNovoProduto(){
    document.getElementById("novoProdutoBox").classList.remove("hidden");
}

function fecharNovoProduto(){
    document.getElementById("novoProdutoBox").classList.add("hidden");
}

async function salvarNovoProduto(){

    let nome = document.getElementById("novoNome").value.trim();
    let preco = parseFloat(document.getElementById("novoPreco").value);
    let img = document.getElementById("novoImg").value.trim();

    if(!nome || isNaN(preco) || preco <= 0 || !img){
        alert("Preencha todos os campos corretamente!");
        return;
    }

    try {
        const resp = await fetch(`${API}/produtos`, {
            method: "POST",
            headers: apiHeaders(true),
            body: JSON.stringify({ nome, preco, img })
        });
        if(!resp.ok){ alert("Erro ao cadastrar produto."); return; }

        document.getElementById("novoNome").value = "";
        document.getElementById("novoPreco").value = "";
        document.getElementById("novoImg").value = "";

        fecharNovoProduto();
        await carregarProdutos();
        alert("Produto cadastrado com sucesso!");
    } catch(e) {
        alert("Não foi possível conectar ao servidor.");
    }
}

// mostrar tela de login por padrão ao carregar a página
document.addEventListener('DOMContentLoaded', async ()=>{
    mostrar('login');
    await carregarProdutos();
    atualizarInterfacePosLogin();
});
