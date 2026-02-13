const usuarios={
    admin:{senha:"1234",nivel:"admin"},
    operador:{senha:"1234",nivel:"operador"}
};

let produtos = JSON.parse(localStorage.getItem("produtos")) || [
{id:1,nome:"Cafezinho",preco:1.50,img:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300"},
{id:2,nome:"Pão com manteiga",preco:1.20,img:"https://3.bp.blogspot.com/-4tzM3_7T-04/WAKzMTezioI/AAAAAAAAB6c/dY8SpoE7-KMJ6-jxup8yE2dysJbTywiAwCLcB/w1200-h630-p-k-no-nu/pao-com-manteiga.jpg"},
{id:3,nome:"Misto quente",preco:1.75,img:"https://tse1.mm.bing.net/th/id/OIP.2gQWV_-2OIRqoKrOJI5jSgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3"},
{id:4,nome:"Misto quente com ovo",preco:2.00,img:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300"},
{id:5,nome:"Suco natural",preco:2.25,img:"https://tse2.mm.bing.net/th/id/OIP.W5aNOByZpGdJI2lXRfY6ewHaE3?rs=1&pid=ImgDetMain&o=7&rm=3"},
{id:6,nome:"Suco lata",preco:3.00,img:"https://imagens.jotaja.com/produtos/2ce9bdc0-5e4a-4611-8b1b-be35c7784e15.jpg"},
{id:7,nome:"Pão de queijo",preco:1.00,img:"https://www.panificiomallet.com/storage/app/uploads/public/67d/c17/ef2/67dc17ef2b779369140361.jpg"},
{id:8,nome:"Porção pão de queijo",preco:2.50,img:"https://amopaocaseiro.com.br/wp-content/uploads/2022/08/yt-069_pao-de-queijo_receita-840x560.jpg"}
];

let carrinho=[];
let ficha=1;
let usuarioLogado=null;
let clienteLogado = null;

// LOGIN
function fazerLogin(){
    let u = document.getElementById("user").value;
    let p = document.getElementById("pass").value;

    if(usuarios[u] && usuarios[u].senha === p){
        usuarioLogado = usuarios[u];

        // esconder o formulário de login interno e mostrar interface apropriada
        document.getElementById("login").classList.add("hidden");

        // se for admin, liberar área admin
        if(usuarioLogado.nivel === "admin"){
            document.getElementById("adminArea").classList.remove("hidden");
        }
        // se for operador, mostrar botão do dashboard
        if(usuarioLogado.nivel === "operador"){
            document.getElementById('btnDashboard').classList.remove('hidden');
        } else {
            document.getElementById('btnDashboard').classList.add('hidden');
        }

        // esconder botão 'Área Cliente' da sidebar quando usuário interno estiver logado
        try{ document.getElementById('btnAreaCliente').classList.add('hidden'); }catch(e){}

        // atualizar lista de produtos com controles admin (se aplicável)
        carregarProdutos();
        mostrar("vendas");


    } else {
        document.getElementById("erro").innerText = "Login inválido";
    }
}



// MOSTRAR TELAS
function mostrar(id){
    vendas.classList.add("hidden");
    pagamento.classList.add("hidden");
    dashboard.classList.add("hidden");
    document.getElementById('cliente-home').classList.add('hidden');
    document.getElementById('cliente-login').classList.add('hidden');
    document.getElementById('cliente-cadastro').classList.add('hidden');
    document.getElementById('cliente-pedidos')?.classList.add('hidden');

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
function listarPedidosCliente(){
    if(!clienteLogado){
        alert('Faça login para ver seus pedidos.');
        mostrar('cliente-login');
        return;
    }

    const todas = JSON.parse(localStorage.getItem('vendas')) || [];
    const meus = todas.filter(v=> v.cliente && v.cliente.id === clienteLogado.id)
        .sort((a,b)=> (b.timestamp||0) - (a.timestamp||0));

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
}

// CLIENTE: helpers
function getClientes(){
    return JSON.parse(localStorage.getItem('clientes'))||[];
}
function saveClientes(list){
    localStorage.setItem('clientes', JSON.stringify(list));
}

function fazerCadastroCliente(){
    const nome = document.getElementById('clienteNomeInput').value.trim();
    const email = document.getElementById('clienteEmailInput').value.trim().toLowerCase();
    const senha = document.getElementById('clienteSenhaInput').value;
    const senha2 = document.getElementById('clienteSenhaConfirm').value;

    const msgEl = document.getElementById('cadastroMsg');
    msgEl.style.color = 'red';

    if(!nome || !email || !senha){
        msgEl.innerText = 'Preencha todos os campos.';
        return;
    }
    if(senha !== senha2){
        msgEl.innerText = 'Senhas não conferem.';
        return;
    }

    const clientes = getClientes();
    if(clientes.find(c=>c.email === email)){
        msgEl.innerText = 'E-mail já cadastrado.';
        return;
    }

    const novo = { id: Date.now(), nome, email, senha };
    clientes.push(novo);
    saveClientes(clientes);

    msgEl.style.color = 'green';
    msgEl.innerText = 'Cadastro realizado! Faça login.';

    // limpar campos
    document.getElementById('clienteNomeInput').value='';
    document.getElementById('clienteEmailInput').value='';
    document.getElementById('clienteSenhaInput').value='';
    document.getElementById('clienteSenhaConfirm').value='';

    setTimeout(()=> mostrar('cliente-login'),1000);
}

function fazerLoginCliente(){
    const email = (document.getElementById('clienteEmail').value||'').trim().toLowerCase();
    const senha = document.getElementById('clienteSenha').value||'';
    const err = document.getElementById('erroCliente');
    const clientes = getClientes();
    const c = clientes.find(x=>x.email === email && x.senha === senha);
    if(!c){
        err.innerText = 'Credenciais inválidas.';
        return;
    }
    clienteLogado = c;
    err.innerText = '';
    document.getElementById('clienteNome').innerText = clienteLogado.nome;
    document.getElementById('clienteInfo').classList.remove('hidden');
    // esconder telas de cliente
    mostrar('vendas');
}

function logout(){
    // logout para qualquer tipo de usuário
    usuarioLogado = null;
    clienteLogado = null;
    try{ document.getElementById('adminArea').classList.add('hidden'); }catch(e){}
    try{ document.getElementById('clienteInfo').classList.add('hidden'); }catch(e){}
    // apagar nome exibido do cliente anterior
    try{ document.getElementById('clienteNome').innerText = ''; }catch(e){}
    // voltar para home de cliente
    carregarProdutos();
    mostrar('cliente-home');
    // esconder dashboard para usuários deslogados
    try{ document.getElementById('btnDashboard').classList.add('hidden'); }catch(e){}
    // reexibir botão 'Área Cliente' na sidebar após logout
    try{ document.getElementById('btnAreaCliente').classList.remove('hidden'); }catch(e){}
}

// CARDÁPIO DINÂMICO
function carregarProdutos(){
    const container = document.getElementById("listaProdutos");
    container.innerHTML="";
    container.classList.add("produtos-grid");

    produtos.forEach(p=>{

        let botaoAdmin = "";

        // somente mostra ações administrativas para usuário interno com nível 'admin'
        if(usuarioLogado && usuarioLogado.nivel === "admin"){
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
function editarPreco(id){

    if(!usuarioLogado || usuarioLogado.nivel !== "admin"){
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

    produto.preco = novoPreco;

    // 🔥 Atualiza no localStorage
    localStorage.setItem("produtos", JSON.stringify(produtos));

    // 🔥 Atualiza tela
    carregarProdutos();

    alert("Preço atualizado com sucesso!");
}

function excluirProduto(id){
    if(!usuarioLogado || usuarioLogado.nivel !== "admin"){
        alert("Apenas o administrador pode excluir produtos.");
        return;
    }

    if(!confirm("Confirma exclusão deste produto?")) return;

    let idx = produtos.findIndex(p => p.id === id);
    if(idx === -1){
        alert("Produto não encontrado!");
        return;
    }

    produtos.splice(idx,1);

    // Atualiza armazenamento e interface
    localStorage.setItem("produtos", JSON.stringify(produtos));

    // Remove do carrinho, se houver
    carrinho = carrinho.filter(i => i.id !== id);
    atualizarCarrinho();

    carregarProdutos();
    alert("Produto excluído com sucesso!");
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

function finalizar(){
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

    salvarVenda(venda);

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


// BANCO SIMULADO
function salvarVenda(v){
    let vendas=JSON.parse(localStorage.getItem("vendas"))||[];
    // adiciona informação do cliente se houver
    if(clienteLogado){
        v.cliente = { id: clienteLogado.id, nome: clienteLogado.nome, email: clienteLogado.email };
    }
    if(!v.timestamp) v.timestamp = Date.now();
    vendas.push(v);
    localStorage.setItem("vendas",JSON.stringify(vendas));
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

function salvarNovoProduto(){

    let nome = document.getElementById("novoNome").value.trim();
    let preco = parseFloat(document.getElementById("novoPreco").value);
    let img = document.getElementById("novoImg").value.trim();

    if(!nome || isNaN(preco) || preco <= 0 || !img){
        alert("Preencha todos os campos corretamente!");
        return;
    }

    let novoId = produtos.length > 0 
        ? Math.max(...produtos.map(p=>p.id)) + 1
        : 1;

    let novoProduto = {
        id: novoId,
        nome: nome,
        preco: preco,
        img: img
    };

    produtos.push(novoProduto);

    // Salva no localStorage
    localStorage.setItem("produtos", JSON.stringify(produtos));

    // Atualiza tela
    carregarProdutos();

    // Limpa formulário
    document.getElementById("novoNome").value = "";
    document.getElementById("novoPreco").value = "";
    document.getElementById("novoImg").value = "";

    fecharNovoProduto();

    alert("Produto cadastrado com sucesso!");
}

// mostrar área cliente por padrão ao carregar a página
document.addEventListener('DOMContentLoaded', ()=>{
    mostrar('cliente-home');
    carregarProdutos();
    // por padrão, ocultar dashboard/admin até login apropriado
    try{ document.getElementById('btnDashboard').classList.add('hidden'); }catch(e){}
    try{ document.getElementById('adminArea').classList.add('hidden'); }catch(e){}
});
