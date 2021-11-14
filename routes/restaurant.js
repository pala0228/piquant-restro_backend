const express = require('express');
const extractFile = require('../middleware/file');
const restaurantController = require('../controllers/restaurant');
const isAuth = require('../middleware/isAuthenticated');

const router = express.Router();

router.post('/available', restaurantController.getRestaurants);
router.post('/search', isAuth, restaurantController.getRestaurants);
router.post('/add', isAuth, extractFile, restaurantController.addRestaurant);
router.put('/update/:restaurantId', isAuth, extractFile, restaurantController.updateRestaurant);
router.delete('/delete/:restaurantId', isAuth, restaurantController.deleteRestaurant);

router.get('/USER_LOGOUT', restaurantController.getUserIdelAndTimeoutDetails);

module.exports = router;
