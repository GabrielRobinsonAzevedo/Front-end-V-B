const db = require('../config/db');

exports.criar = async (req, res) => {
  const clientData = req.body.cliente || req.body.comprador;
  const orderData = req.body.pedido;
  const itemsData = req.body.itens || (orderData && orderData.itens);

  if (!clientData || !clientData.email || !itemsData || itemsData.length === 0) {
    return res.status(400).json({ sucesso: false, mensagem: 'Corpo da requisição inválido' });
  }

  const clientEmail = clientData.email;
  const clientCpfCnpj = clientData.cpf_cnpj || '000.000.000-00';

  try {
    await db.query('BEGIN');

    let clientRes = await db.query('SELECT * FROM cliente WHERE email = $1', [clientEmail]);
    let clientId;
    let isNew = false;

    if (clientRes.rows.length === 0) {
      isNew = true;
      const insertRes = await db.query(
        'INSERT INTO cliente (email, cpf_cnpj, status_conta) VALUES ($1, $2, \'Pendente\') RETURNING *',
        [clientEmail, clientCpfCnpj]
      );
      clientId = insertRes.rows[0].id;
    } else {
      clientId = clientRes.rows[0].id;
      if (clientRes.rows[0].status_conta === 'Pendente' && clientCpfCnpj !== '000.000.000-00') {
        await db.query('UPDATE cliente SET cpf_cnpj = $1 WHERE id = $2', [clientCpfCnpj, clientId]);
      }
    }

    let calculatedTotal = 0;
    const finalItems = [];

    for (const item of itemsData) {
      const prodId = item.id_produto || item.id;
      const qty = item.quantidade || 1;
      
      const prodRes = await db.query('SELECT preco FROM produto WHERE id = $1', [prodId]);
      if (prodRes.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({ sucesso: false, mensagem: `Produto ${prodId} não encontrado` });
      }
      
      const unitPrice = parseFloat(prodRes.rows[0].preco);
      calculatedTotal += unitPrice * qty;
      finalItems.push({ prodId, qty, unitPrice });
    }

    const total = orderData && orderData.valor_total ? parseFloat(orderData.valor_total) : calculatedTotal;

    const orderRes = await db.query(
      `INSERT INTO pedido (id_cliente, valor_total, status_pagamento, status_servico)
       VALUES ($1, $2, 'Pago', 'Pendente') RETURNING *`,
      [clientId, total]
    );
    const orderId = orderRes.rows[0].id;

    for (const item of finalItems) {
      await db.query(
        `INSERT INTO pedido_item (id_pedido, id_produto, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.prodId, item.qty, item.unitPrice]
      );
    }

    await db.query('COMMIT');

    if (isNew) {
      const port = process.env.PORT || 3000;
      const url = `http://localhost:${port}/redefinicaoDeSenha.html?email=${encodeURIComponent(clientEmail)}`;
      console.log(`[Email Simulado] Boas vindas enviado para: ${clientEmail}. Ativação da conta: ${url}`);
    }

    res.json({
      sucesso: true,
      mensagem: 'Pedido registrado no servidor!',
      pedidoId: orderId
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('erro ao processar checkout:', err.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao realizar compra' });
  }
};

exports.historico = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'O parâmetro email é obrigatório' });
  }

  try {
    let queryText;
    let params = [];

    if (email === 'admin@conecta.com') {
      queryText = `
        SELECT 
          p.id, p.data_pedido, p.valor_total, p.status_pagamento, p.status_servico,
          c.email AS cliente_email, c.cpf_cnpj AS cliente_cpf_cnpj
        FROM pedido p
        JOIN cliente c ON p.id_cliente = c.id
        ORDER BY p.data_pedido DESC
      `;
    } else {
      queryText = `
        SELECT 
          p.id, p.data_pedido, p.valor_total, p.status_pagamento, p.status_servico,
          c.email AS cliente_email
        FROM pedido p
        JOIN cliente c ON p.id_cliente = c.id
        WHERE c.email = $1
        ORDER BY p.data_pedido DESC
      `;
      params = [email];
    }

    const { rows: orders } = await db.query(queryText, params);

    for (const order of orders) {
      const itemsRes = await db.query(
        `SELECT pi.id, pi.quantidade, pi.preco_unitario, pr.titulo, pr.categoria
         FROM pedido_item pi
         JOIN produto pr ON pi.id_produto = pr.id
         WHERE pi.id_pedido = $1`,
        [order.id]
      );
      order.itens = itemsRes.rows;
    }

    res.json(orders);
  } catch (err) {
    console.error('erro ao buscar histórico:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
