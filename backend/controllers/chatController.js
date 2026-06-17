const db = require('../config/db');

exports.listarClientes = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT c.id, c.email, c.status_conta
      FROM cliente c
      JOIN pedido p ON p.id_cliente = c.id
      ORDER BY c.email ASC
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('erro ao listar clientes:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

exports.obterMensagens = async (req, res) => {
  const { id_pedido, cliente_email } = req.query;

  try {
    let orderId = id_pedido ? parseInt(id_pedido, 10) : null;

    if (!orderId && cliente_email) {
      const latestRes = await db.query(
        `SELECT p.id 
         FROM pedido p
         JOIN cliente c ON p.id_cliente = c.id
         WHERE c.email = $1
         ORDER BY p.data_pedido DESC LIMIT 1`,
        [cliente_email]
      );
      if (latestRes.rows.length > 0) {
        orderId = latestRes.rows[0].id;
      }
    }

    if (!orderId) {
      return res.json([]);
    }

    const { rows: messages } = await db.query(
      `SELECT * FROM mensagem_atendimento 
       WHERE id_pedido = $1 
       ORDER BY data_envio ASC`,
      [orderId]
    );

    res.json(messages);
  } catch (err) {
    console.error('erro ao buscar mensagens:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

exports.enviarMensagem = async (req, res) => {
  const { id_pedido, id_remetente, remetente_tipo, texto, url_anexo, cliente_email } = req.body;

  if (!texto) {
    return res.status(400).json({ error: 'Texto da mensagem é obrigatório' });
  }

  try {
    let orderId = id_pedido ? parseInt(id_pedido, 10) : null;
    let senderId = id_remetente ? parseInt(id_remetente, 10) : null;

    if (!orderId && cliente_email) {
      const latestRes = await db.query(
        `SELECT p.id, p.id_cliente 
         FROM pedido p
         JOIN cliente c ON p.id_cliente = c.id
         WHERE c.email = $1
         ORDER BY p.data_pedido DESC LIMIT 1`,
        [cliente_email]
      );
      if (latestRes.rows.length === 0) {
        return res.status(400).json({ error: 'Nenhum pedido encontrado para o cliente.' });
      }
      orderId = latestRes.rows[0].id;
      if (!senderId) {
        senderId = latestRes.rows[0].id_cliente;
      }
    }

    if (!orderId) {
      return res.status(400).json({ error: 'O id_pedido é obrigatório' });
    }

    if (!senderId && remetente_tipo === 'admin') {
      const adminRes = await db.query('SELECT id FROM administrador LIMIT 1');
      senderId = adminRes.rows[0].id;
    } else if (!senderId) {
      const clientOrder = await db.query('SELECT id_cliente FROM pedido WHERE id = $1', [orderId]);
      if (clientOrder.rows.length > 0) {
        senderId = clientOrder.rows[0].id_cliente;
      } else {
        return res.status(400).json({ error: 'Pedido inválido' });
      }
    }

    const query = `
      INSERT INTO mensagem_atendimento (id_pedido, id_remetente, remetente_tipo, texto, url_anexo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const params = [orderId, senderId, remetente_tipo || 'cliente', texto, url_anexo || null];
    const { rows } = await db.query(query, params);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('erro ao enviar mensagem:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
