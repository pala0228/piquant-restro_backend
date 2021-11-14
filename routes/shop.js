const express = require('express');
const isAuth = require('../middleware/isAuthenticated');
const shopController = require('../controllers/shop');

const router = express.Router();

router.post('/create-checkout', isAuth, shopController.getCheckout);

module.exports = router;
