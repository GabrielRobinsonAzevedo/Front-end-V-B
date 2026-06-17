const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');

router.get('/produtos', controller.listarAtivos);
router.get('/admin/produtos', controller.listarTodos);
router.post('/admin/produtos', controller.criar);
router.put('/admin/produtos/:id', controller.atualizar);
router.delete('/admin/produtos/:id', controller.deletar);

module.exports = router;
