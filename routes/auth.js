const express = require('express');
const userController = require('../controllers/auth');

const router = express.Router();

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/forgot-password/verification-code', userController.sendVerificationCode);
router.post('/update-password', userController.updatePassword);

module.exports = router;
