const express = require('express');
const isAuth = require('../middleware/isAuthenticated');
const customerController = require('../controllers/customer');
const authController = require('../controllers/auth');

const router = express.Router();

router.post('/update-profile', isAuth, customerController.updateProfile);
router.post('/update-password', isAuth, authController.updatePassword);

module.exports = router;
