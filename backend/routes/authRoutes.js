const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');

router.post('/auth/login', controller.login);
router.post('/auth/redefinir-senha', controller.redefinirSenha);

module.exports = router;
