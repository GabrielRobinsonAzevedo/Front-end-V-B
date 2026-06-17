const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.login = async (req, res) => {
  const email = req.body.email;
  const password = req.body.senha || req.body.password;

  if (!email || !password) {
    return res.status(400).json({ sucesso: false, mensagem: 'E-mail e senha são obrigatórios' });
  }

  try {
    const adminQuery = await db.query('SELECT * FROM administrador WHERE email = $1', [email]);
    if (adminQuery.rows.length > 0) {
      const admin = adminQuery.rows[0];
      const match = await bcrypt.compare(password, admin.senha_hash);
      if (match) {
        return res.json({
          sucesso: true,
          usuario: { id: admin.id, nome: admin.nome, email: admin.email, tipo: 'admin' }
        });
      }
    }

    const clientQuery = await db.query('SELECT * FROM cliente WHERE email = $1', [email]);
    if (clientQuery.rows.length > 0) {
      const client = clientQuery.rows[0];
      if (!client.senha_hash) {
        return res.status(400).json({ 
          sucesso: false, 
          mensagem: 'Esta conta ainda não possui senha configurada. Verifique o link enviado.' 
        });
      }
      
      const match = await bcrypt.compare(password, client.senha_hash);
      if (match) {
        return res.json({
          sucesso: true,
          usuario: { id: client.id, nome: client.email.split('@')[0], email: client.email, tipo: 'cliente' }
        });
      }
    }

    res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha incorretos' });
  } catch (err) {
    console.error('erro ao realizar login:', err.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor' });
  }
};

exports.redefinirSenha = async (req, res) => {
  const { email } = req.body;
  const novaSenha = req.body.novaSenha || req.body.password || req.body.senha;

  if (!email || !novaSenha) {
    return res.status(400).json({ sucesso: false, mensagem: 'E-mail e nova senha são obrigatórios' });
  }

  try {
    const checkClient = await db.query('SELECT * FROM cliente WHERE email = $1', [email]);
    if (checkClient.rows.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Cliente não cadastrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(novaSenha, salt);

    await db.query(
      'UPDATE cliente SET senha_hash = $1, status_conta = \'Ativo\' WHERE email = $2',
      [hash, email]
    );

    res.json({ sucesso: true, mensagem: 'Senha cadastrada com sucesso!' });
  } catch (err) {
    console.error('erro ao redefinir senha:', err.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor' });
  }
};
