const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const restaurantSchema = new Schema(
  {
    restaurantTitle: {
      type: String,
      required: true,
    },
    restaurantSubTitle: {
      type: String,
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    deliveryTime: {
      type: String,
      required: true,
    },
    offerPercent: {
      type: String,
    },
    offerCode: {
      type: String
    },
    address: {
      type: String,
      required: true
    },
    items: [
      {
        id: {
          type: String,
          required: true
        },
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
        creator: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        }
      }
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
