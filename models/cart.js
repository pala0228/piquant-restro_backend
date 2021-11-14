const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    restaurantId: {
      type: String,
      required: true
    },
    restaurantName: {
      type: String,
      required: true
    },
    restaurantSubTitle: {
      type: String,
      required: true
    },
    restaurantAddress: {
      type: String,
      required: true
    },
    restaurantImage: {
      type: String,
      required: true
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    discountPrice: {
      type: Number
    },
    GST: {
      type: Number,
      required: true
    },
    totalPayableAmount: {
      type: Number,
      required: true
    },
    cartItems: [
      {
        itemName: {
          type: String,
          required: true
        },
        itemPrice: {
          type: Number,
          required: true
        },
        itemCategory: {
          type: String,
          required: true
        },
        itemQuantity: {
          type: Number,
          required: true
        },
        itemTotalPrice: {
          type: Number,
          required: true
        },
        createdOn: {
          type: String,
          required: true
        }
      }
    ],
    invoiceNumber: {
      type: String,
      required: true
    }
  }, { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
