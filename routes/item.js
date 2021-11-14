const express = require('express');
const isAuth = require('../middleware/isAuthenticated');
const itemController = require('../controllers/item');

const router = express.Router();

router.post('/add', isAuth, itemController.addItem);
router.get('/search', isAuth, itemController.getItems);
router.delete('/delete', isAuth, itemController.deleteItem);
router.put('/update/:itemId', isAuth, itemController.updateItem);

module.exports = router;
