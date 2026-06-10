let itensCarrinho = JSON.parse(localStorage.getItem('carrinhoConectaMidia')) || [];

/* ========================================================
   1. INDEX
   ======================================================== */


// carrega produtos da vitrine
async function carregarProdutos() {
    try {
        const resposta = await fetch('testFiles/produtos.json');
        const dados = await resposta.json();

        console.log("Dados carregados com sucesso", dados);
        for (const produto of dados) {
            if (!produto.status_ativo) continue;
            construtorDeCartao(produto);
        }

        configurarCliquesVitrine(dados);
    } catch (erro) {
        console.log("Erro ao carregar o arquivo JSON:", erro);
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
    const containerEmail = document.getElementById("identificacaoUsuario");

    if (containerEmail) {
        if (!usuarioLogado && carrinho.length > 0) {
            containerEmail.style.display = "block"; 
        } else {
            containerEmail.style.display = "none";  
        }
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
   5. CONTROLE
   ======================================================== */

function atualizarBotaoCabecalho() {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    const botaoEntrar = document.querySelector(".entrar");
    
    if (botaoEntrar && usuarioLogado) {
        botaoEntrar.innerHTML = `<a href="minhaConta.html">Minha Conta</a>`;
    }
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