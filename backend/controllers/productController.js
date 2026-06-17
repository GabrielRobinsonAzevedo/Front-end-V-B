const db = require('../config/db');

exports.listarAtivos = async (req, res) => {
  try {
    const query = 'SELECT * FROM produto WHERE status_ativo = true ORDER BY id ASC';
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('erro ao buscar produtos ativos:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

exports.listarTodos = async (req, res) => {
  try {
    const query = 'SELECT * FROM produto ORDER BY id ASC';
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('erro ao buscar todos os produtos:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

exports.criar = async (req, res) => {
  const { titulo, descricao, categoria, preco, status_ativo } = req.body;
  
  if (!titulo || !categoria || preco === undefined) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const query = `
      INSERT INTO produto (titulo, descricao, categoria, preco, status_ativo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const params = [titulo, descricao || '', categoria, parseFloat(preco), status_ativo !== false];
    const { rows } = await db.query(query, params);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('erro ao criar produto:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, categoria, preco, status_ativo } = req.body;

  if (!titulo || !categoria || preco === undefined) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const query = `
      UPDATE produto
      SET titulo = $1, descricao = $2, categoria = $3, preco = $4, status_ativo = $5
      WHERE id = $6
      RETURNING *
    `;
    const params = [titulo, descricao || '', categoria, parseFloat(preco), status_ativo !== false, parseInt(id, 10)];
    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('erro ao atualizar produto:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

exports.deletar = async (req, res) => {
  const { id } = req.params;
  const prodId = parseInt(id, 10);

  try {
    const ref = await db.query('SELECT 1 FROM pedido_item WHERE id_produto = $1 LIMIT 1', [prodId]);
    
    if (ref.rows.length > 0) {
      const query = 'UPDATE produto SET status_ativo = false WHERE id = $1 RETURNING *';
      const { rows } = await db.query(query, [prodId]);
      return res.json({ 
        message: 'Produto possui pedidos vinculados. Apenas inativado.', 
        product: rows[0] 
      });
    }

    const { rows } = await db.query('DELETE FROM produto WHERE id = $1 RETURNING *', [prodId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto removido com sucesso', product: rows[0] });
  } catch (err) {
    console.error('erro ao deletar produto:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
