const Restaurant = require('../models/restaurant');
const User = require('../models/user');
const fs = require('fs'); // Core node file system package to play with files
const path = require('path'); // Core node path package to construct absolute path
const io = require('../socket-io');
const connection = require('../common/connections.js');
const CONSTANTS = require('../common/constants');

/**
 * Function to add restaurant to database
 */
exports.addRestaurant = (req, res, next) => {
  if (!req.file) {
    const error = new Error('No image is provided.');
    error.statusCode = 422;
    throw error;
  }
  const restaurant = new Restaurant({
    restaurantTitle: req.body.restaurantTitle,
    restaurantSubTitle: req.body.restaurantSubTitle,
    imagePath: "/images/" + req.file.filename,
    rating: req.body.rating,
    deliveryTime: req.body.deliveryTime,
    offerPercent: req.body.offerPercent,
    offerCode: req.body.offerCode,
    address: req.body.address,
    items: [],
    creator: req.userId
  });

  restaurant.save()
    .then(result => {
      if (result) {
        return User.findById(req.userId);
      }
    })
    .then((user) => {
      user.restaurants.push(restaurant);
      return user.save();
    })
    .then((result) => {
      /**
       * Getting io connectin and emit an event to all other users
       * who connected to server with action channel and its respective
       * data being added.
       * Whoever got connected through websock from client will be intimated
       * with this action and its respective data
       */
      io.getIO().emit(connection.Restaurant, { action: connection.Create, restaurant: restaurant });

      res.status(201).json({
        response: {
          restaurant: restaurant
        },
        status: {
          code: 201,
          message: 'Restaurant is added successfully.',
          status: 'success'
        }
      });
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error while adding new restaurant.';
      }
      return next(error);
    });
}

/**
 * Function to fetch available restaurants from database
 */
exports.getRestaurants = (req, res, next) => {
  const userType = req.body.userType;
  const currentPage = +req.query.currentPage || 1; // query parameters added by ? to the route
  const itemsPerPage = +req.query.itemsPerPage || 8;

  let totalItems = 0;

  if (userType === CONSTANTS.ADMIN) {
    Restaurant.find({ creator: req.userId })
      .countDocuments() // gives total number of documents found
      .then((count) => {
        totalItems = count;
        return Restaurant.find({ creator: req.userId }) // returns array of objects
          .skip((currentPage - 1) * itemsPerPage) // skipping items for prev pages
          .limit(itemsPerPage) // return only itemsPerPage number passed in
      })
      .then((restaurants) => {
        let message = 'Restaurants are fetched successfully';
        if (restaurants.length === 0) {
          totalItems = 0;
          message = "No restaurants are found by logged admin user id. Please add them."
        }
        res.status(200).json({
          response: {
            restaurants: restaurants,
            totalRestaurants: totalItems
          },
          status: {
            code: 200,
            message: message,
            status: 'success'
          }
        })
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
          error.message = 'Error while fetching restaurants.'
        }
        return next(error);
      });
  } else if (userType === CONSTANTS.USER || userType === CONSTANTS.SUPERADMIN) {
    Restaurant.find()
      .countDocuments()
      .then((count) => {
        totalItems = count;
        return Restaurant.find()
          .skip((currentPage - 1) * itemsPerPage)
          .limit(itemsPerPage)
      })
      .then((restaurants) => {
        let message = 'Restaurants are fetched successfully';
        if (totalItems === 0) {
          message = "No restaurants are available."
        }
        res.status(200).json({
          response: {
            restaurants: restaurants,
            totalRestaurants: totalItems
          },
          status: {
            code: 200,
            message: message,
            status: 'success'
          }
        })
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
          error.message = 'Error while fetching restaurants.'
        }
        return next(error);
      });
  }
}

/**
 * Function to update restaurant
 */
exports.updateRestaurant = (req, res, next) => {
  const id = req.params.restaurantId;

  const restaurantTitle = req.body.restaurantTitle;
  const restaurantSubTitle = req.body.restaurantSubTitle;
  let imagePath = req.body.image;
  const rating = req.body.rating;
  const deliveryTime = req.body.deliveryTime;
  const offerPercent = req.body.offerPercent;
  const offerCode = req.body.offerCode;
  const address = req.body.address;
  const creator = req.userId;

  if (req.file) {
    imagePath = "/" + req.file.path;
  }
  if (!imagePath) {
    const error = new Error('No image is selected.');
    error.statusCode = 422;
    throw error;
  }

  Restaurant.findById(id)
    .then(restaurant => {
      if (!restaurant) {
        const error = new Error('Restaurant is not found to save changes made. Please contact support team.');
        error.statusCode = 404;
        throw error;
      }
      restaurant.restaurantTitle = restaurantTitle;
      restaurant.restaurantSubTitle = restaurantSubTitle;
      if (imagePath !== restaurant.imagePath) {
        clearImage(restaurant.imagePath);
      }
      restaurant.imagePath = imagePath;
      restaurant.rating = rating;
      restaurant.deliveryTime = deliveryTime;
      restaurant.offerPercent = offerPercent;
      restaurant.offerCode = offerCode;
      restaurant.address = address;
      restaurant.creator = creator;
      return restaurant.save();
    }).then(result => {
      /**
       * Getting io connectin and emit an event to all other users
       * who connected to server with action channel and its respective
       * data being added.
       * Whoever got connected through websock from client will be intimated
       * with this action and its respective data
       */
      io.getIO().emit(connection.Restaurant, { action: connection.Update, restaurant: result });

      res.status(200).json({
        response: {
          restaurants: result
        },
        status: {
          code: 200,
          message: 'Restaurant is updated successfully.',
          status: 'success'
        }
      })
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error while updating restaurant.'
      }
      return next(error);
    });
}

/**
 * Function to delete restaurant from a database
 */
exports.deleteRestaurant = (req, res, next) => {
  const id = req.params.restaurantId;

  Restaurant.findById(id)
    .then(restaurant => {
      if (!restaurant) {
        const error = new Error('Restaurant is not found to delete. Please contact support team.');
        error.statusCode = 404;
        throw error;
      }
      clearImage(restaurant.imagePath);
      return Restaurant.findByIdAndRemove(id)
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then((user) => {
      if (user) {
        user.restaurants.pull(id);
        return user.save();
      }
    })
    .then((user) => {
      /**
       * Getting io connectin and emit an event to all other users
       * who connected to server with action channel and its respective
       * data being added.
       * Whoever got connected through websock from client will be intimated
       * with this action and its respective data
       */
      io.getIO().emit(connection.Restaurant, { action: connection.Delete, restaurantId: id });

      res.status(200).json({
        response: null,
        status: {
          code: 200,
          message: 'Restaurant is deleted successfully',
          status: 'success'
        }
      })
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error while deleting restaurant.'
      }
      return next(error);
    })
}
/**
 * Function to return user idle and time out details
 */
exports.getUserIdelAndTimeoutDetails = (req, res, next) => {
  res.status(200).json({
    response: {
      idleSeconds: CONSTANTS.USER_IDLE_SECONDS,
      timeoutSeconds: CONSTANTS.TIME_OUT_SECONDS
    },
    status: {
      code: 200,
      message: 'Restaurant is deleted successfully',
      status: 'success'
    }
  });
}

/**
 * helper function to clear image.
 */
const clearImage = filePath => {
  // getting file path with path package.
  filePath = path.join(__dirname, '..', filePath);
  // deleting image with file system package with file path found by path package
  fs.unlink(filePath, error => {
    console.log(error);
  });
}
