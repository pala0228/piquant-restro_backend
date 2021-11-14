const Item = require('../models/item');
const Restaurant = require('../models/restaurant');
const io = require('../socket-io');
const connection = require('../common/connections');

/**
 * Function to add food item to a restaurant
 */
exports.addItem = (req, res, next) => {
  const item = new Item({
    itemName: req.body.itemName,
    itemPrice: req.body.itemPrice,
    offerCode: req.body.offerCode,
    offerPercent: req.body.offerPercent,
    itemCategory: req.body.itemCategory,
    restaurant: req.body.restaurantId,
    restaurantImagePath: req.body.restaurantImagePath,
    creator: req.userId
  });

  item.save()
    .then((result) => {
      if (result) {
        return Restaurant.findById(req.body.restaurantId)
      }
    })
    .then((restaurant) => {
      const itemAdded = {
        id: item._id,
        itemName: item.itemName,
        itemPrice: item.itemPrice,
        offerCode: item.offerCode,
        offerPercent: item.offerPercent,
        itemCategory: item.itemCategory,
        restaurant: item.restaurant,
        creator: item.creator,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }
      restaurant.items.push(itemAdded);

      return restaurant.save();
    })
    .then((result) => {
      /**
       * Getting io connectin and emit an event to all other users
       * who connected to server with action channel and its respective
       * data being added.
       * Whoever got connected through websock from client will be intimated
       * with this action and its respective data
       */
      io.getIO().emit(connection.Item, { action: connection.Create, item: item });

      res.status(201).json({
        response: {
          item: item
        },
        status: {
          code: 201,
          message: 'Item is added successfully.',
          status: 'success'
        }
      });
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error while adding item to the restaurant.';
      }
      return next(error);
    });
}

/**
 * Function to get items available for a restaurant.
 */
exports.getItems = (req, res, next) => {
  const restaurantId = req.query.restaurantId;
  const itemCategory = req.query.itemCategory;

  Item.find({ restaurant: restaurantId, itemCategory: itemCategory })
    .then((items) => {
      let message = `${itemCategory} are fetched successfully.`;
      if (items.length === 0) {
        totalItems = 0;
        message = `No ${itemCategory} found. Please add them.`
      }
      res.status(200).json({
        response: {
          items: items
        },
        status: {
          code: 200,
          message: message,
          status: 'success'
        }
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error while fetching items for the restaurant.'
      }
      return next(error);
    });
}

/**
 * Function to delete an item for a restaurant
 */
exports.deleteItem = (req, res, next) => {
  const itemId = req.query.itemId;
  const restaurantId = req.query.restaurantId;

  let loadedItem;

  Item.findById(itemId)
    .then((item) => {
      if (!item) {
        const error = new Error("Item is not found to delete. Please contact support team.");
        error.statusCode = 404;
        throw error;
      }
      loadedItem = item;

      return Item.findByIdAndRemove(itemId);
    })
    .then((result) => {
      if (result) {
        return Restaurant.findById(restaurantId);
      }
    })
    .then((restaurant) => {
      restaurant.items = restaurant.items.filter((object) => object.id !== itemId);
      return restaurant.save();
    })
    .then((result) => {
      res.status(200).json({
        response: {
          item: loadedItem
        },
        status: {
          code: 200,
          message: 'Item is deleted successfully.',
          status: 'success'
        }
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = "Error while deleting item from the restaurant."
      }
    });
}

/**
 * Function to update existing item for a restaurant
 */
exports.updateItem = (req, res, next) => {
  const itemId = req.params.itemId;

  const itemName = req.body.itemName;
  const itemPrice = req.body.itemPrice;
  const offerCode = req.body.offerCode;
  const offerPercent = req.body.offerPercent;
  const itemCategory = req.body.itemCategory;
  const restaurant = req.body.restaurantId;
  const creator = req.userId;

  Item.findById(itemId)
    .then((item) => {
      if (!item) {
        const error = new Error('Item is not found to update. Please check with admin team.');
        error.statusCode = 404;
        throw error;
      }

      item.itemName = itemName;
      item.itemPrice = itemPrice;
      item.offerCode = offerCode;
      item.offerPercent = offerPercent;
      item.itemCategory = itemCategory;
      item.restaurant = restaurant;
      item.creator = creator;

      return item.save();
    })
    .then((updatedItem) => {
      /**
       * Getting io connectin and emit an event to all other users
       * who connected to server with action channel and its respective
       * data being added.
       * Whoever got connected through websock from client will be intimated
       * with this action and its respective data
       */
      io.getIO().emit(connection.Item, { action: connection.Update, item: updatedItem });

      res.status(200).json({
        response: {
          item: updatedItem
        },
        status: {
          code: 200,
          message: 'Item is updated successfully.',
          status: 'success'
        }
      })
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error while updating item in the restaurant.'
      }
      return next(error);
    });
}
