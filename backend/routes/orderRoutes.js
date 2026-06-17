const express = require('express');
const router = express.Router();
const controller = require('../controllers/orderController');

router.post('/pedidos', controller.criar);
router.get('/pedidos/historico', controller.historico);

module.exports = router;
