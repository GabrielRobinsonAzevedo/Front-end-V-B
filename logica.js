let itensCarrinho = JSON.parse(localStorage.getItem('carrinhoConectaMidia')) || [];

/* ========================================================
   1. INDEX
   ======================================================== */


// carrega produtos da vitrine
async function carregarProdutos() {
    try {
        let dados;
        const produtosSalvos = localStorage.getItem('produtosAdmin');
        if (produtosSalvos) {
            dados = JSON.parse(produtosSalvos);
        } else {
            const resposta = await fetch('testFiles/produtos.json');
            dados = await resposta.json();
        }

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
            <h3>R$ ${produto.preco.toFixed(2).replace('.', ',')}${sufixoPreco}</h3>
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
                        <p class="valor">R$ ${item.preco.toFixed(2).replace('.', ',')}${sufixoPreco}</p>
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

// API falsa do Carrinho
async function enviarDadosParaOBackend(dadosCarrinho) {
    console.log("Preparando dados para envio ao Back-end...", dadosCarrinho);

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ 
                sucesso: true, 
                mensagem: "Pedido registrado no servidor!", 
                pedidoId: Math.floor(Math.random() * 90000) + 10000 
            });
        }, 1000);
    });
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
                cpfCnpj: cpfCnpjInput.value.trim(),
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
                window.location.href = "index.html";
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

// API falsa de Autenticação
async function autenticarUsuarioNoBackend(credenciais) {
    console.log("Enviando dados de login para o servidor...", credenciais);

    return new Promise((resolve) => {
        setTimeout(() => {
            if (credenciais.email === "teste@conecta.com" && credenciais.senha === "123456") {
                resolve({
                    sucesso: true,
                    usuario: { nome: "Alex Silva", email: credenciais.email }
                });
            } else {
                resolve({
                    sucesso: false,
                    mensagem: "E-mail ou senha incorretos. (Use teste@conecta.com e 123456)"
                });
            }
        }, 1200);
    });
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

// Mock API de Redefinição de Senha
async function enviarNovaSenhaAoBackend(dadosRedefinicao) {
    console.log("Enviando nova senha para o servidor...", dadosRedefinicao);

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ sucesso: true, message: "Senha redefinida com sucesso!" });
        }, 1200);
    });
}

/* ========================================================
   5. PAINEL DO CLIENTE
   ======================================================== */

function configurarChat(inputId, btnEnviarId, mensagensId) {
    const input = document.getElementById(inputId);
    const btnEnviar = document.getElementById(btnEnviarId);
    const mensagens = document.getElementById(mensagensId);

    if (!input || !btnEnviar || !mensagens) return;

    const enviar = () => {
        const texto = input.value.trim();
        if (!texto) return;

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

    configurarChat('inputPainel', 'enviarPainel', 'mensagensPainel');
}

/* ========================================================
   6. PAINEL DO ADMINISTRADOR
   ======================================================== */

function configurarPainelAdmin() {
    const operacoes = document.querySelectorAll('.itemOperacao');
    if (!operacoes.length) return;

    const clientes = document.querySelectorAll('.itemCliente');
    const areaDireita = document.getElementById('areaDireita');

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

    operacoes.forEach(op => {
        op.onclick = () => {
            operacoes.forEach(o => o.classList.remove('itemAtivo'));
            op.classList.add('itemAtivo');

            if (op.dataset.op === 'atendimento') {
                areaDireita.innerHTML = chatTemplate();
                configurarChat('inputAdmin', 'enviarAdmin', 'mensagensAdmin');
            } else if (op.dataset.op === 'crud') {
                renderizarCrudProdutos(areaDireita);
            } else if (op.dataset.op === 'historico') {
                renderizarHistoricoVendas(areaDireita);
            }
        };
    });

    clientes.forEach(cl => {
        cl.onclick = () => {
            clientes.forEach(c => c.classList.remove('itemAtivo'));
            cl.classList.add('itemAtivo');
            const mensagens = document.getElementById('mensagensAdmin');
            if (mensagens) mensagens.innerHTML = '';
        };
    });

    configurarChat('inputAdmin', 'enviarAdmin', 'mensagensAdmin');
}

/* ========================================================
   HELPERS DOS PAINÉIS
   ======================================================== */

function renderizarHistoricoCliente() {
    const secaoHistorico = document.getElementById('secaoHistorico');
    if (!secaoHistorico) return;

    const historico = JSON.parse(localStorage.getItem('historicoCompras')) || [];

    if (historico.length === 0) {
        secaoHistorico.innerHTML = '<p class="textoVazio">Nenhum pedido encontrado.</p>';
        return;
    }

    secaoHistorico.innerHTML = historico.map(pedido => {
        const data = new Date(pedido.data).toLocaleDateString('pt-BR');
        const itensHtml = pedido.itens.map(item => {
            const sufixo = item.categoria === 'Mensal' ? '/mês' : '';
            const qtd = item.categoria === 'Avulso' ? ` (x${item.quantidade})` : '';
            return `<li>${item.titulo}${qtd} — R$ ${item.precoUnitario.toFixed(2).replace('.', ',')}${sufixo}</li>`;
        }).join('');

        return `
            <div class="cartaoPedido">
                <div class="pedidoHeader">
                    <span class="pedidoId">Pedido #${pedido.pedidoId}</span>
                    <span class="pedidoData">${data}</span>
                    <span class="pedidoStatus">Ativo</span>
                </div>
                <ul class="pedidoItens">${itensHtml}</ul>
            </div>`;
    }).join('');
}

async function renderizarCrudProdutos(areaDireita) {
    let produtos;
    const salvo = localStorage.getItem('produtosAdmin');
    if (salvo) {
        produtos = JSON.parse(salvo);
    } else {
        const r = await fetch('testFiles/produtos.json');
        produtos = await r.json();
        localStorage.setItem('produtosAdmin', JSON.stringify(produtos));
    }

    const renderTabela = () => {
        const linhas = produtos.map(p => `
            <tr class="${!p.status_ativo ? 'trInativo' : ''}">
                <td>${p.titulo}</td>
                <td>${p.categoria}</td>
                <td>R$ ${p.preco.toFixed(2).replace('.', ',')}</td>
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
            btn.onclick = () => {
                const p = produtos.find(x => x.id == btn.dataset.id);
                if (p) {
                    p.status_ativo = !p.status_ativo;
                    localStorage.setItem('produtosAdmin', JSON.stringify(produtos));
                    renderTabela();
                }
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
                        <div class="grupoInputCheckout"><label>Preço (R$)</label><input id="editPreco" type="number" value="${p.preco}" step="0.01"></div>
                        <div class="grupoInputCheckout"><label>Tagline</label><input id="editTagline" value="${p.tagline || ''}"></div>
                        <div class="botoesFormulario">
                            <button class="btnSalvarProduto">Salvar</button>
                            <button class="btnCancelarForm">Cancelar</button>
                        </div>
                    </div>`;
                form.querySelector('.btnSalvarProduto').onclick = () => {
                    p.titulo = document.getElementById('editTitulo').value.trim();
                    p.preco = parseFloat(document.getElementById('editPreco').value) || p.preco;
                    p.tagline = document.getElementById('editTagline').value.trim();
                    localStorage.setItem('produtosAdmin', JSON.stringify(produtos));
                    form.style.display = 'none';
                    renderTabela();
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
                    <div class="grupoInputCheckout"><label>Tagline</label><input id="newTagline" placeholder="Descrição curta"></div>
                    <div class="grupoInputCheckout"><label>Itens (separados por vírgula)</label><textarea id="newDescricao" placeholder="Item 1, Item 2"></textarea></div>
                    <div class="botoesFormulario">
                        <button class="btnSalvarProduto">Salvar</button>
                        <button class="btnCancelarForm">Cancelar</button>
                    </div>
                </div>`;
            form.querySelector('.btnSalvarProduto').onclick = () => {
                const titulo = document.getElementById('newTitulo').value.trim();
                if (!titulo) { alert('Informe o título do produto.'); return; }
                const novo = {
                    id: Date.now(),
                    titulo,
                    categoria: document.getElementById('newCategoria').value,
                    preco: parseFloat(document.getElementById('newPreco').value) || 0,
                    tagline: document.getElementById('newTagline').value.trim(),
                    descricao: document.getElementById('newDescricao').value.trim() || titulo,
                    status_ativo: true
                };
                produtos.push(novo);
                localStorage.setItem('produtosAdmin', JSON.stringify(produtos));
                form.style.display = 'none';
                renderTabela();
            };
            form.querySelector('.btnCancelarForm').onclick = () => { form.style.display = 'none'; };
        };
    };

    renderTabela();
}

function renderizarHistoricoVendas(areaDireita) {
    const historico = JSON.parse(localStorage.getItem('historicoVendas')) || [];

    if (historico.length === 0) {
        areaDireita.innerHTML = '<div class="crudContainer"><h3>Histórico de Vendas</h3><p style="margin-top:20px;color:#666;">Nenhuma venda registrada.</p></div>';
        return;
    }

    const linhas = historico.map(pedido => {
        const data = new Date(pedido.data).toLocaleDateString('pt-BR');
        const total = pedido.itens.reduce((s, i) => s + (i.precoUnitario * i.quantidade), 0);
        const itens = pedido.itens.map(i => i.titulo).join(', ');
        return `
            <tr>
                <td>#${pedido.pedidoId}</td>
                <td>${pedido.comprador.email}</td>
                <td>${itens}</td>
                <td>R$ ${total.toFixed(2).replace('.', ',')}</td>
                <td>${data}</td>
                <td><span class="badgeAtivo">Ativo</span></td>
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