const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatController');

router.get('/clientes', controller.listarClientes);
router.get('/mensagens', controller.obterMensagens);
router.post('/mensagens', controller.enviarMensagem);

module.exports = router;
