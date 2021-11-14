const express = require('express');
const isAuth = require('../middleware/isAuthenticated');
const ordersController = require('../controllers/orders');

const router = express.Router();

// get all orders by user id logged in
router.get('/search', isAuth, ordersController.getOrders);

// create and download invoice of order placed
router.post('/download-invoice', isAuth, ordersController.downloadInvoice);


module.exports = router;
