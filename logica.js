let itensCarrinho = JSON.parse(localStorage.getItem('carrinhoConectaMidia')) || [];

const API_BASE = '/api';

/* ========================================================
   1. INDEX
   ======================================================== */


// carrega produtos da vitrine
async function carregarProdutos() {
    try {
        const resposta = await fetch(API_BASE + '/produtos');
        const dados = await resposta.json();

        for (const produto of dados) {
            if (!produto.status_ativo) continue;
            construtorDeCartao(produto);
        }

        configurarCliquesVitrine(dados);
    } catch (erro) {
        console.log("Erro ao carregar produtos:", erro);
    }
}


// controi os cartoes
function construtorDeCartao(produto) {
    const containerDestino = document.getElementById(produto.categoria);
    if (!containerDestino) return;
    
    const avisoSemProduto = containerDestino.querySelector('.sem-produto');
    if (avisoSemProduto) {
        avisoSemProduto.style.display = 'none'; 
    }

    const descricaoArray = produto.descricao.split(", ");
    const sufixoPreco = produto.categoria === 'Mensal' ? '/<span>mês</span>' : '';
    
    const estruturaHTML = `
        <div class="cartao" data-id="${produto.id}">
            <h2>${produto.titulo}</h2>
            ${produto.tagline ? `<p class="taglineCartao">${produto.tagline}</p>` : ''}
            <ul>
                ${descricaoArray.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <h3>R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}${sufixoPreco}</h3>
            <div class="botoesCartao">
                <button class="carrinhoCompras"><img src="assets/cart-shopping-svgrepo-com.svg" alt="Carrinho de compras" width="50"></button>
                <button class="comprar">${produto.categoria === 'Mensal' ? 'Assinar plano' : 'Comprar'}</button>
            </div>
        </div>
    `;    
    containerDestino.insertAdjacentHTML('beforeend', estruturaHTML);
}

// adiciona os cliques para compra e adicionar ao carrinho
function configurarCliquesVitrine(listaProdutosOriginal) {
    const botoes = document.querySelectorAll('.cartao .carrinhoCompras, .cartao .comprar');

    botoes.forEach(botao => {
        botao.onclick = (evento) => {
            const cardPai = evento.target.closest('.cartao');
            const idProduto = Number(cardPai.dataset.id);

            const produtoOriginal = listaProdutosOriginal.find(item => item.id === idProduto);
            if (!produtoOriginal) return;

            if (produtoOriginal.categoria === "Mensal") {
                const planoExistente = itensCarrinho.find(item => item.categoria === "Mensal");
                
                if (planoExistente) {
                    if (planoExistente.id === idProduto) {
                        alert(`O plano "${planoExistente.titulo}" já está no seu carrinho.`);
                        if (botao.classList.contains('comprar')) window.location.href = 'shoppingCart.html';
                        return;
                    }
                    
                    alert(`Substituindo o plano "${planoExistente.titulo}" pelo plano "${produtoOriginal.titulo}" no seu carrinho.`);
                    itensCarrinho = itensCarrinho.filter(item => item.categoria !== "Mensal");
                }
            }

            const produtoNoCarrinho = itensCarrinho.find(item => item.id === idProduto);

            if (produtoNoCarrinho) {
                produtoNoCarrinho.quantidade += 1;
            } else {
                const novoItem = { ...produtoOriginal, quantidade: 1 };
                itensCarrinho.push(novoItem);
            }

            localStorage.setItem('carrinhoConectaMidia', JSON.stringify(itensCarrinho));
            
            if (botao.classList.contains('comprar')) {
                window.location.href = 'shoppingCart.html';
            } else {
                alert("Produto adicionado ao carrinho!");
            }
        };
    });
}

/* ========================================================
   2. CARRINHO
   ======================================================== */

   // soma os totais
function atualizarTotais(carrinho) {
    const elementoMensal = document.getElementById("valorMensal");
    const elementoAvulso = document.getElementById("valorAvulso");

    const totalMensal = carrinho
        .filter(item => item.categoria === "Mensal")
        .reduce((soma, item) => soma + (item.preco * item.quantidade), 0);

    const totalAvulso = carrinho
        .filter(item => item.categoria === "Avulso")
        .reduce((soma, item) => soma + (item.preco * item.quantidade), 0);

    if (elementoMensal) {
        elementoMensal.innerText = `R$ ${totalMensal.toFixed(2).replace('.', ',')}/mês`;
    }
    if (elementoAvulso) {
        elementoAvulso.innerText = `R$ ${totalAvulso.toFixed(2).replace('.', ',')}`;
    }
}

// cria os produtos do carrinho
function renderizarCarrinho(carrinho) {
    const listaCompras = document.getElementById("listaCompras");
    if (!listaCompras) return;

    listaCompras.innerHTML = "";

    if (carrinho.length === 0) {
        listaCompras.innerHTML = "<p class='carrinho-vazio'>Seu carrinho está vazio.</p>";
        atualizarTotais(carrinho);
        configurarCliquesCarrinho();
        const dadosCheckoutVazio = document.getElementById("dadosCheckout");
        if (dadosCheckoutVazio) dadosCheckoutVazio.style.display = "none";
        return;
    }

    carrinho.forEach(item => {
        const descricaoArray = item.descricao.split(", ");
        const sufixoPreco = item.categoria === 'Mensal' ? '/mês' : '';
        const displayQuantidade = item.categoria === 'Avulso' ? 'display: flex;' : 'display: none;';

        const estruturaHTML = `
            <div class="itemCompra" data-id="${item.id}">
                <div class="decricao">
                    <h2>${item.categoria === 'Mensal' ? 'Plano ' + item.titulo.toLowerCase() : item.titulo}</h2>
                    <ul>
                        ${descricaoArray.map(topico => `<li>${topico}</li>`).join('')}
                    </ul>
                </div>
                <div class="itemAcoes">
                    <div class="definirQuantidade" style="${displayQuantidade}">
                        <button class="adicionar">▲</button>
                        <p class="quantidadeAtual">${item.quantidade}</p>
                        <button class="remover">▼</button>
                    </div>

                    <div class="ValorRemocao">
                        <p class="valor">R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')}${sufixoPreco}</p>
                        <button class="removerCompra">remover</button>
                    </div>
                </div>
            </div>
        `;
        listaCompras.insertAdjacentHTML('beforeend', estruturaHTML);
    });

    atualizarTotais(carrinho);

    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    const dadosCheckout = document.getElementById("dadosCheckout");
    const campoEmail = document.getElementById("campoEmail");

    if (dadosCheckout) dadosCheckout.style.display = "block";
    if (campoEmail) campoEmail.style.display = (!usuarioLogado) ? "block" : "none";

    const inputCartao = document.getElementById("numeroCartao");
    if (inputCartao && !inputCartao.dataset.masked) {
        inputCartao.dataset.masked = "1";
        inputCartao.addEventListener('input', function () {
            let v = this.value.replace(/\D/g, '').substring(0, 16);
            this.value = v.replace(/(.{4})/g, '$1 ').trim();
        });
    }

    const inputValidade = document.getElementById("validadeCartao");
    if (inputValidade && !inputValidade.dataset.masked) {
        inputValidade.dataset.masked = "1";
        inputValidade.addEventListener('input', function () {
            let v = this.value.replace(/\D/g, '').substring(0, 4);
            if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
            this.value = v;
        });
    }

    configurarCliquesCarrinho();
}

// adiciona os cliques de carrinho, aumentar e diminuir
function configurarCliquesCarrinho() {
    document.querySelectorAll('.adicionar').forEach(botao => {
        botao.onclick = (evento) => {
            const idProduto = Number(evento.target.closest('.itemCompra').dataset.id);
            const produto = itensCarrinho.find(item => item.id === idProduto);
            if (produto) {
                produto.quantidade += 1;
                localStorage.setItem('carrinhoConectaMidia', JSON.stringify(itensCarrinho));
                renderizarCarrinho(itensCarrinho);
            }
        };
    });

    document.querySelectorAll('.remover').forEach(botao => {
        botao.onclick = (evento) => {
            const idProduto = Number(evento.target.closest('.itemCompra').dataset.id);
            const produto = itensCarrinho.find(item => item.id === idProduto);
            
            if (produto) {
                produto.quantidade -= 1;
                if (produto.quantidade <= 0) {
                    itensCarrinho = itensCarrinho.filter(item => item.id !== idProduto);
                }
                localStorage.setItem('carrinhoConectaMidia', JSON.stringify(itensCarrinho));
                renderizarCarrinho(itensCarrinho);
            }
        };
    });

    document.querySelectorAll('.removerCompra').forEach(botao => {
        botao.onclick = (evento) => {
            const idProduto = Number(evento.target.closest('.itemCompra').dataset.id);
            itensCarrinho = itensCarrinho.filter(item => item.id !== idProduto);
            localStorage.setItem('carrinhoConectaMidia', JSON.stringify(itensCarrinho));
            renderizarCarrinho(itensCarrinho);
        };
    });
}

// API do Carrinho
async function enviarDadosParaOBackend(dadosCarrinho) {
    const resposta = await fetch(API_BASE + '/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCarrinho)
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.mensagem || 'Erro ao processar pedido');
    return dados;
}

// finge um pagamento
async function dispararPagamento() {
    const telaAnimacao = document.getElementById("pagamentoAnimacao");
    const barraVerde = document.querySelector(".progresso");
    const textoStatus = telaAnimacao.querySelector("h3");
    const botaoFechar = telaAnimacao.querySelector(".fecharPagamaneto");

    if (!telaAnimacao || !barraVerde || itensCarrinho.length === 0) {
        alert("Seu carrinho está vazio para realizar um pagamento.");
        return;
    }

    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    let emailComprador = "";

    if (usuarioLogado) {
        emailComprador = usuarioLogado.email;
    } else {
        const inputEmail = document.getElementById("emailCheckout");
        if (!inputEmail || !inputEmail.value.trim()) {
            alert("Por favor, insira o seu e-mail para processar a compra.");
            inputEmail?.focus();
            return;
        }
        emailComprador = inputEmail.value.trim();
    }

    const cpfCnpjInput = document.getElementById("cpfCnpj");
    if (!cpfCnpjInput || !cpfCnpjInput.value.trim()) {
        alert("Por favor, informe o CPF/CNPJ.");
        cpfCnpjInput?.focus();
        return;
    }

    const nomeTitular = document.getElementById("nomeTitular")?.value.trim();
    const numeroCartao = document.getElementById("numeroCartao")?.value.replace(/\s/g, '');
    const validade = document.getElementById("validadeCartao")?.value.trim();
    const cvv = document.getElementById("cvvCartao")?.value.trim();

    if (!nomeTitular || !numeroCartao || !validade || !cvv) {
        alert("Por favor, preencha todos os dados do cartão.");
        return;
    }

    const botaoPagarOriginal = document.querySelector("#pagamento");
    if (botaoPagarOriginal) {
        botaoPagarOriginal.disabled = true;
        botaoPagarOriginal.innerText = "Processando...";
    }

    try {
        const payloadPedido = {
            dataPedido: new Date().toISOString(),
            comprador: {
                email: emailComprador,
                cpf_cnpj: cpfCnpjInput.value.trim(),
                statusConta: usuarioLogado ? "Logado" : "Nova Conta (Pendente)"
            },
            itens: itensCarrinho.map(item => ({
                id: item.id,
                titulo: item.titulo,
                categoria: item.categoria,
                precoUnitario: item.preco,
                quantidade: item.quantidade
            }))
        };

        const resultadoServidor = await enviarDadosParaOBackend(payloadPedido);
        console.log("Resposta recebida do Servidor:", resultadoServidor);

        if (resultadoServidor.sucesso) {
            const pedidoSalvo = {
                pedidoId: resultadoServidor.pedidoId,
                data: new Date().toISOString(),
                comprador: payloadPedido.comprador,
                itens: payloadPedido.itens
            };
            const historicoCompras = JSON.parse(localStorage.getItem('historicoCompras')) || [];
            historicoCompras.push(pedidoSalvo);
            localStorage.setItem('historicoCompras', JSON.stringify(historicoCompras));
            const historicoVendas = JSON.parse(localStorage.getItem('historicoVendas')) || [];
            historicoVendas.push(pedidoSalvo);
            localStorage.setItem('historicoVendas', JSON.stringify(historicoVendas));

            telaAnimacao.style.display = "block";

            barraVerde.addEventListener("animationend", () => {
                if (usuarioLogado) {
                    textoStatus.innerText = "Pagamento efetuado! O pedido foi vinculado à sua conta.";
                } else {
                    textoStatus.innerText = `Sucesso! Enviamos um link de ativação para: ${emailComprador} para criar sua senha.`;
                }

                if (botaoFechar) {
                    botaoFechar.disabled = false;
                    botaoFechar.onclick = () => {
                        telaAnimacao.style.display = "none";
                        textoStatus.innerText = "pagamento sendo realizado.";
                        botaoFechar.disabled = true;
                        
                        if (botaoPagarOriginal) {
                            botaoPagarOriginal.disabled = false;
                            botaoPagarOriginal.innerText = "Continuar para o pagamento";
                        }
                    };
                }

                itensCarrinho = []; 
                localStorage.removeItem('carrinhoConectaMidia');
                renderizarCarrinho(itensCarrinho);
            });
        } else {
            throw new Error("O servidor recusou o pedido.");
        }

    } catch (erro) {
        console.error("Erro ao processar compra:", erro);
        alert("Houve um erro de conexão ao processar o seu pagamento.");
        if (botaoPagarOriginal) {
            botaoPagarOriginal.disabled = false;
            botaoPagarOriginal.innerText = "Continuar para o pagamento";
        }
    }
}

/* ========================================================
   3. LOG IN
   ======================================================== */

// log in
function configurarFormularioLogin() {
    const formulario = document.getElementById("gerenciamentoDeConta");
    if (!formulario) return;

    formulario.onsubmit = async (evento) => {
        evento.preventDefault();

        const botaoEntrar = document.getElementById("entrarNaConta");
        const emailInput = document.getElementById("email").value;
        const senhaInput = document.getElementById("senha").value;

        if (botaoEntrar) {
            botaoEntrar.disabled = true;
            botaoEntrar.innerText = "Verificando...";
        }

        try {
            const dadosLogin = {
                email: emailInput,
                senha: senhaInput
            };

            const respostaServidor = await autenticarUsuarioNoBackend(dadosLogin);

            if (respostaServidor.sucesso) {
                localStorage.setItem("usuarioLogado", JSON.stringify(respostaServidor.usuario));
                alert(`Bem-vindo de volta, ${respostaServidor.usuario.nome}!`);
                if (respostaServidor.usuario.tipo === 'admin') {
                    window.location.href = "painelAdmin.html";
                } else {
                    window.location.href = "index.html";
                }
            } else {
                alert(respostaServidor.mensagem);
                if (botaoEntrar) {
                    botaoEntrar.disabled = false;
                    botaoEntrar.innerText = "Entrar";
                }
            }

        } catch (erro) {
            console.error("Erro na autenticação:", erro);
            alert("Erro de conexão ao tentar fazer login.");
            if (botaoEntrar) {
                botaoEntrar.disabled = false;
                botaoEntrar.innerText = "Entrar";
            }
        }
    };
}

// API de Autenticação
async function autenticarUsuarioNoBackend(credenciais) {
    const resposta = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credenciais.email, senha: credenciais.senha })
    });
    return await resposta.json();
}

/* ========================================================
   4. REDEFINIR SENHA
   ======================================================== */

function configurarFormularioRedefinicao() {
    const formulario = document.getElementById("redefinicaoDeSenha");
    if (!formulario) return;

    formulario.onsubmit = async (evento) => {
        evento.preventDefault();

        const novaSenha = document.getElementById("senha").value;
        const confirmacaoSenha = document.getElementById("senhaConfirmacao").value;
        const botaoConfirmar = document.getElementById("confirmarNovaSenha");

        if (novaSenha !== confirmacaoSenha) {
            alert("As senhas não coincidem. Por favor, verifique os campos.");
            return;
        }

        const parametrosURL = new URLSearchParams(window.location.search);
        const emailUsuario = parametrosURL.get("email") || "email.desconhecido@teste.com"; 

        if (botaoConfirmar) {
            botaoConfirmar.disabled = true;
            botaoConfirmar.innerText = "Salvando...";
        }

        try {
            const payloadRedefinicao = {
                email: emailUsuario,
                novaSenha: novaSenha
            };

            const resposta = await enviarNovaSenhaAoBackend(payloadRedefinicao);

            if (resposta.sucesso) {
                alert("Sua senha foi definida com sucesso! Agora você pode fazer login.");
                window.location.href = "login.html";
            } else {
                alert("Não foi possível redefinir sua senha. Tente novamente.");
                if (botaoConfirmar) {
                    botaoConfirmar.disabled = false;
                    botaoConfirmar.innerText = "Confirmar senha";
                }
            }
        } catch (erro) {
            console.error("Erro ao redefinir senha:", erro);
            alert("Erro de conexão ao tentar redefinir senha.");
            if (botaoConfirmar) {
                botaoConfirmar.disabled = false;
                botaoConfirmar.innerText = "Confirmar senha";
            }
        }
    };
}

// API de Redefinição de Senha
async function enviarNovaSenhaAoBackend(dadosRedefinicao) {
    const resposta = await fetch(API_BASE + '/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dadosRedefinicao.email, novaSenha: dadosRedefinicao.novaSenha })
    });
    return await resposta.json();
}

/* ========================================================
   5. PAINEL DO CLIENTE
   ======================================================== */

async function carregarMensagens(container, apiConfig) {
    try {
        const params = new URLSearchParams();
        if (apiConfig.pedidoId) params.append('id_pedido', apiConfig.pedidoId);
        else if (apiConfig.email) params.append('cliente_email', apiConfig.email);

        const r = await fetch(API_BASE + '/mensagens?' + params.toString());
        const msgs = await r.json();

        container.innerHTML = '';
        msgs.forEach(msg => {
            const isOwnMessage = msg.remetente_tipo === apiConfig.perspectiva;
            const div = document.createElement('div');
            div.className = isOwnMessage ? 'mensagemEnviada' : 'mensagemRecebida';
            div.innerHTML = `<div class="${isOwnMessage ? 'balaoChatEnviado' : 'balaoChatRecebido'}">${msg.texto}</div>`;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    } catch (e) {
        console.error('Erro ao carregar mensagens:', e);
    }
}

function configurarChat(inputId, btnEnviarId, mensagensId, apiConfig = null) {
    const input = document.getElementById(inputId);
    const btnEnviar = document.getElementById(btnEnviarId);
    const mensagens = document.getElementById(mensagensId);

    if (!input || !btnEnviar || !mensagens) return;

    if (apiConfig) carregarMensagens(mensagens, apiConfig);

    const enviar = async () => {
        const texto = input.value.trim();
        if (!texto) return;

        if (apiConfig) {
            try {
                await fetch(API_BASE + '/mensagens', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        texto,
                        remetente_tipo: apiConfig.perspectiva,
                        cliente_email: apiConfig.email || undefined,
                        id_pedido: apiConfig.pedidoId || undefined
                    })
                });
            } catch (e) {
                console.error('Erro ao enviar mensagem:', e);
            }
        }

        const div = document.createElement('div');
        div.className = 'mensagemEnviada';
        div.innerHTML = `<div class="balaoChatEnviado">${texto}</div>`;
        mensagens.appendChild(div);
        mensagens.scrollTop = mensagens.scrollHeight;
        input.value = '';
    };

    btnEnviar.onclick = enviar;
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviar();
    });
}

function configurarPainelCliente() {
    const btnChat = document.getElementById('btnChat');
    const btnHistorico = document.getElementById('btnHistorico');
    if (!btnChat) return;

    const secaoChat = document.getElementById('secaoChat');
    const secaoHistorico = document.getElementById('secaoHistorico');

    btnChat.className = 'abaAtiva';
    btnHistorico.className = 'abaInativa';

    btnChat.onclick = () => {
        btnChat.className = 'abaAtiva';
        btnHistorico.className = 'abaInativa';
        secaoChat.style.display = '';
        secaoHistorico.style.display = 'none';
    };

    btnHistorico.onclick = () => {
        btnHistorico.className = 'abaAtiva';
        btnChat.className = 'abaInativa';
        secaoHistorico.style.display = '';
        secaoChat.style.display = 'none';
        renderizarHistoricoCliente();
    };

    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const apiConfig = usuarioLogado
        ? { email: usuarioLogado.email, perspectiva: 'cliente' }
        : null;
    configurarChat('inputPainel', 'enviarPainel', 'mensagensPainel', apiConfig);
}

/* ========================================================
   6. PAINEL DO ADMINISTRADOR
   ======================================================== */

async function configurarPainelAdmin() {
    const operacoes = document.querySelectorAll('.itemOperacao');
    if (!operacoes.length) return;

    const colunaClientes = document.getElementById('colunaClientes');
    const areaDireita = document.getElementById('areaDireita');
    let clienteAtualEmail = null;

    // Carrega lista de clientes do backend
    try {
        const r = await fetch(API_BASE + '/clientes');
        const clientes = await r.json();

        const header = colunaClientes.querySelector('h3');
        colunaClientes.innerHTML = '';
        if (header) colunaClientes.appendChild(header);

        if (clientes.length === 0) {
            colunaClientes.insertAdjacentHTML('beforeend', '<p style="padding:15px;color:#666;font-size:0.85rem;">Nenhum cliente ativo.</p>');
        } else {
            clientes.forEach((cl, idx) => {
                const div = document.createElement('div');
                div.className = 'itemLista itemCliente' + (idx === 0 ? ' itemAtivo' : '');
                div.dataset.email = cl.email;
                div.textContent = cl.email.split('@')[0];
                div.title = cl.email;
                colunaClientes.appendChild(div);
            });
            clienteAtualEmail = clientes[0]?.email || null;
        }
    } catch (err) {
        console.error('Erro ao carregar clientes:', err);
    }

    const chatTemplate = () => `
        <div class="containerChat">
            <div class="mensagensChat" id="mensagensAdmin"></div>
            <div class="barraInputChat">
                <div class="pilulaChatInput">
                    <input type="text" placeholder="Digite uma mensagem" id="inputAdmin">
                    <button class="botaoAnexo">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.47"/>
                        </svg>
                    </button>
                </div>
                <button class="botaoEnviar" id="enviarAdmin">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </div>
        </div>`;

    const abrirChatCliente = (email) => {
        areaDireita.innerHTML = chatTemplate();
        configurarChat('inputAdmin', 'enviarAdmin', 'mensagensAdmin', { email, perspectiva: 'admin' });
    };

    operacoes.forEach(op => {
        op.onclick = () => {
            operacoes.forEach(o => o.classList.remove('itemAtivo'));
            op.classList.add('itemAtivo');

            if (op.dataset.op === 'atendimento') {
                if (clienteAtualEmail) {
                    abrirChatCliente(clienteAtualEmail);
                } else {
                    areaDireita.innerHTML = '<p style="padding:40px;color:#666;">Nenhum cliente com pedidos ainda.</p>';
                }
            } else if (op.dataset.op === 'crud') {
                renderizarCrudProdutos(areaDireita);
            } else if (op.dataset.op === 'historico') {
                renderizarHistoricoVendas(areaDireita);
            }
        };
    });

    colunaClientes.addEventListener('click', (e) => {
        const item = e.target.closest('.itemCliente');
        if (!item) return;

        colunaClientes.querySelectorAll('.itemCliente').forEach(c => c.classList.remove('itemAtivo'));
        item.classList.add('itemAtivo');
        clienteAtualEmail = item.dataset.email;

        const opAtendimento = document.querySelector('[data-op="atendimento"]');
        if (opAtendimento && !opAtendimento.classList.contains('itemAtivo')) {
            operacoes.forEach(o => o.classList.remove('itemAtivo'));
            opAtendimento.classList.add('itemAtivo');
        }
        abrirChatCliente(clienteAtualEmail);
    });

    // Estado inicial: chat do primeiro cliente
    if (clienteAtualEmail) {
        abrirChatCliente(clienteAtualEmail);
    }
}

/* ========================================================
   HELPERS DOS PAINÉIS
   ======================================================== */

async function renderizarHistoricoCliente() {
    const secaoHistorico = document.getElementById('secaoHistorico');
    if (!secaoHistorico) return;

    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) {
        secaoHistorico.innerHTML = '<p class="textoVazio">Faça login para ver seus pedidos.</p>';
        return;
    }

    secaoHistorico.innerHTML = '<p class="textoVazio">Carregando...</p>';

    try {
        const r = await fetch(API_BASE + '/pedidos/historico?email=' + encodeURIComponent(usuarioLogado.email));
        const historico = await r.json();

        if (!historico.length) {
            secaoHistorico.innerHTML = '<p class="textoVazio">Nenhum pedido encontrado.</p>';
            return;
        }

        secaoHistorico.innerHTML = historico.map(pedido => {
            const data = new Date(pedido.data_pedido).toLocaleDateString('pt-BR');
            const itensHtml = (pedido.itens || []).map(item => {
                const sufixo = item.categoria === 'Mensal' ? '/mês' : '';
                const qtd = item.categoria === 'Avulso' ? ` (x${item.quantidade})` : '';
                return `<li>${item.titulo}${qtd} — R$ ${parseFloat(item.preco_unitario).toFixed(2).replace('.', ',')}${sufixo}</li>`;
            }).join('');

            return `
                <div class="cartaoPedido">
                    <div class="pedidoHeader">
                        <span class="pedidoId">Pedido #${pedido.id}</span>
                        <span class="pedidoData">${data}</span>
                        <span class="pedidoStatus">${pedido.status_servico}</span>
                    </div>
                    <ul class="pedidoItens">${itensHtml}</ul>
                </div>`;
        }).join('');
    } catch (err) {
        secaoHistorico.innerHTML = '<p class="textoVazio">Erro ao carregar histórico. Verifique se o servidor está rodando.</p>';
        console.error(err);
    }
}

async function renderizarCrudProdutos(areaDireita) {
    areaDireita.innerHTML = '<div class="crudContainer"><p style="padding:20px;color:#666">Carregando produtos...</p></div>';

    let produtos;
    try {
        const r = await fetch(API_BASE + '/admin/produtos');
        produtos = await r.json();
    } catch (err) {
        areaDireita.innerHTML = '<div class="crudContainer"><p style="padding:20px;color:red">Erro ao carregar produtos. Verifique se o servidor está rodando.</p></div>';
        return;
    }

    const renderTabela = () => {
        const linhas = produtos.map(p => `
            <tr class="${!p.status_ativo ? 'trInativo' : ''}">
                <td>${p.titulo}</td>
                <td>${p.categoria}</td>
                <td>R$ ${parseFloat(p.preco).toFixed(2).replace('.', ',')}</td>
                <td><span class="${p.status_ativo ? 'badgeAtivo' : 'badgeInativo'}">${p.status_ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <button class="btnAcaoCrud btnEditar" data-id="${p.id}">Editar</button>
                    <button class="btnAcaoCrud btnToggle" data-id="${p.id}">${p.status_ativo ? 'Desativar' : 'Ativar'}</button>
                </td>
            </tr>`).join('');

        areaDireita.innerHTML = `
            <div class="crudContainer">
                <div class="crudCabecalho">
                    <h3>Gerenciar Produtos</h3>
                    <button id="btnAdicionarProduto" class="btnAdicionarProduto">+ Adicionar produto</button>
                </div>
                <table class="tabelaCrud">
                    <thead><tr><th>Título</th><th>Categoria</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>${linhas}</tbody>
                </table>
                <div id="formularioProduto" style="display:none"></div>
            </div>`;

        areaDireita.querySelectorAll('.btnToggle').forEach(btn => {
            btn.onclick = async () => {
                const p = produtos.find(x => x.id == btn.dataset.id);
                if (!p) return;
                try {
                    await fetch(API_BASE + '/admin/produtos/' + p.id, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            titulo: p.titulo, descricao: p.descricao || '',
                            categoria: p.categoria, preco: parseFloat(p.preco),
                            status_ativo: !p.status_ativo
                        })
                    });
                    p.status_ativo = !p.status_ativo;
                    renderTabela();
                } catch (e) { alert('Erro ao atualizar produto.'); }
            };
        });

        areaDireita.querySelectorAll('.btnEditar').forEach(btn => {
            btn.onclick = () => {
                const p = produtos.find(x => x.id == btn.dataset.id);
                if (!p) return;
                const form = document.getElementById('formularioProduto');
                form.style.display = 'block';
                form.innerHTML = `
                    <div class="formularioCrud">
                        <h4>Editar Produto</h4>
                        <div class="grupoInputCheckout"><label>Título</label><input id="editTitulo" value="${p.titulo}"></div>
                        <div class="grupoInputCheckout"><label>Preço (R$)</label><input id="editPreco" type="number" value="${parseFloat(p.preco)}" step="0.01"></div>
                        <div class="grupoInputCheckout"><label>Descrição (itens separados por vírgula)</label><input id="editDescricao" value="${p.descricao || ''}"></div>
                        <div class="botoesFormulario">
                            <button class="btnSalvarProduto">Salvar</button>
                            <button class="btnCancelarForm">Cancelar</button>
                        </div>
                    </div>`;
                form.querySelector('.btnSalvarProduto').onclick = async () => {
                    try {
                        const body = {
                            titulo: document.getElementById('editTitulo').value.trim(),
                            descricao: document.getElementById('editDescricao').value.trim(),
                            categoria: p.categoria,
                            preco: parseFloat(document.getElementById('editPreco').value) || parseFloat(p.preco),
                            status_ativo: p.status_ativo
                        };
                        const r = await fetch(API_BASE + '/admin/produtos/' + p.id, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                        });
                        const updated = await r.json();
                        Object.assign(p, updated);
                        form.style.display = 'none';
                        renderTabela();
                    } catch (e) { alert('Erro ao salvar produto.'); }
                };
                form.querySelector('.btnCancelarForm').onclick = () => { form.style.display = 'none'; };
            };
        });

        document.getElementById('btnAdicionarProduto').onclick = () => {
            const form = document.getElementById('formularioProduto');
            form.style.display = 'block';
            form.innerHTML = `
                <div class="formularioCrud">
                    <h4>Novo Produto</h4>
                    <div class="grupoInputCheckout"><label>Título</label><input id="newTitulo" placeholder="Nome do produto"></div>
                    <div class="grupoInputCheckout"><label>Categoria</label><select id="newCategoria"><option value="Mensal">Mensal</option><option value="Avulso">Avulso</option></select></div>
                    <div class="grupoInputCheckout"><label>Preço (R$)</label><input id="newPreco" type="number" placeholder="0.00" step="0.01"></div>
                    <div class="grupoInputCheckout"><label>Descrição (itens separados por vírgula)</label><textarea id="newDescricao" placeholder="Item 1, Item 2"></textarea></div>
                    <div class="botoesFormulario">
                        <button class="btnSalvarProduto">Salvar</button>
                        <button class="btnCancelarForm">Cancelar</button>
                    </div>
                </div>`;
            form.querySelector('.btnSalvarProduto').onclick = async () => {
                const titulo = document.getElementById('newTitulo').value.trim();
                if (!titulo) { alert('Informe o título do produto.'); return; }
                try {
                    const body = {
                        titulo,
                        categoria: document.getElementById('newCategoria').value,
                        preco: parseFloat(document.getElementById('newPreco').value) || 0,
                        descricao: document.getElementById('newDescricao').value.trim(),
                        status_ativo: true
                    };
                    const r = await fetch(API_BASE + '/admin/produtos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    const novo = await r.json();
                    produtos.push(novo);
                    form.style.display = 'none';
                    renderTabela();
                } catch (e) { alert('Erro ao criar produto.'); }
            };
            form.querySelector('.btnCancelarForm').onclick = () => { form.style.display = 'none'; };
        };
    };

    renderTabela();
}

async function renderizarHistoricoVendas(areaDireita) {
    areaDireita.innerHTML = '<div class="crudContainer"><p style="padding:20px;color:#666">Carregando vendas...</p></div>';

    try {
        const adminLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        const email = adminLogado?.email || 'admin@conecta.com';
        const r = await fetch(API_BASE + '/pedidos/historico?email=' + encodeURIComponent(email));
        const historico = await r.json();

        if (!historico.length) {
            areaDireita.innerHTML = '<div class="crudContainer"><h3>Histórico de Vendas</h3><p style="margin-top:20px;color:#666;">Nenhuma venda registrada.</p></div>';
            return;
        }

        const linhas = historico.map(pedido => {
            const data = new Date(pedido.data_pedido).toLocaleDateString('pt-BR');
            const itens = (pedido.itens || []).map(i => i.titulo).join(', ');
            return `
                <tr>
                    <td>#${pedido.id}</td>
                    <td>${pedido.cliente_email}</td>
                    <td>${itens}</td>
                    <td>R$ ${parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')}</td>
                    <td>${data}</td>
                    <td><span class="${pedido.status_pagamento === 'Pago' ? 'badgeAtivo' : 'badgeInativo'}">${pedido.status_pagamento}</span></td>
                </tr>`;
        }).join('');

        areaDireita.innerHTML = `
            <div class="crudContainer">
                <h3 style="margin-bottom:20px">Histórico de Vendas</h3>
                <table class="tabelaCrud">
                    <thead><tr><th>Pedido</th><th>Cliente</th><th>Serviços</th><th>Total</th><th>Data</th><th>Status</th></tr></thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>`;
    } catch (err) {
        areaDireita.innerHTML = '<div class="crudContainer"><p style="padding:20px;color:red">Erro ao carregar vendas. Verifique se o servidor está rodando.</p></div>';
        console.error(err);
    }
}

/* ========================================================
   7. CONTROLE
   ======================================================== */

function atualizarBotaoCabecalho() {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    const botaoEntrar = document.querySelector(".entrar");

    if (!botaoEntrar || !usuarioLogado) return;

    const historico = JSON.parse(localStorage.getItem('historicoCompras')) || [];
    const ultimoPedido = historico.length > 0 ? historico[historico.length - 1] : null;
    const servicosHtml = ultimoPedido
        ? ultimoPedido.itens.map(i => `<div class="dropServico">${i.titulo}</div>`).join('')
        : '<p class="dropSemServico">Nenhum serviço ativo.</p>';

    botaoEntrar.textContent = 'Minha Conta';
    botaoEntrar.classList.add('comDropdown');

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdownConta';
    dropdown.innerHTML = `
        <p class="dropNome">${usuarioLogado.nome}</p>
        <p class="dropEmail">${usuarioLogado.email}</p>
        <span class="dropSecao">Serviços contratados</span>
        ${servicosHtml}
        <button class="botaoLogout">Sair da conta</button>`;
    botaoEntrar.appendChild(dropdown);

    botaoEntrar.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('visivel');
    };

    dropdown.querySelector('.botaoLogout').onclick = (e) => {
        e.stopPropagation();
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html';
    };

    document.addEventListener('click', () => dropdown.classList.remove('visivel'));
}

/* ========================================================
   6. INICIALIZAÇÃO DA APLICAÇÃO
   ======================================================== */

atualizarBotaoCabecalho();

// Tela de Redefinição de Senha
if (document.getElementById("redefinicaoDeSenha")) {
    configurarFormularioRedefinicao();
}

// Index
if (document.getElementById("Mensal") || document.getElementById("Avulso")) {
    carregarProdutos();
}

// Tela de Carrinho
if (document.getElementById("listaCompras")) {
    renderizarCarrinho(itensCarrinho);

    const botaoPagar = document.querySelector("#pagamento"); 
    if (botaoPagar) {
        botaoPagar.onclick = dispararPagamento;
    }
}

// Tela de Login
if (document.getElementById("gerenciamentoDeConta")) {
    configurarFormularioLogin();
}

// Painel do Cliente
if (document.getElementById("btnChat")) {
    configurarPainelCliente();
}

// Painel do Administrador
if (document.querySelector(".itemOperacao")) {
    configurarPainelAdmin();
}