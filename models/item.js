const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    itemName: {
      type: String,
      required: true
    },
    itemPrice: {
      type: Number,
      required: true
    },
    offerCode: {
      type: String
    },
    offerPercent: {
      type: String
    },
    itemCategory: {
      type: String,
      required: true
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    restaurantImagePath: {
      type: String,
      required: true
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
