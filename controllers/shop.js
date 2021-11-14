const Cart = require('../models/cart');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Restaurant = require('../models/restaurant');

/**
 * Function to activate thrid party checkout page for payment and
 * save cart items into database
 */
exports.getCheckout = (req, res, next) => {
  const restaurantId = req.body.restaurantId;
  const restaurantName = req.body.restaurantName;
  const restaurantSubTitle = req.body.restaurantSubTitle;
  const restaurantAddress = req.body.restaurantAddress;
  const restaurantImage = req.body.restaurantImage;
  const creator = req.body.creator;
  const discountPrice = req.body.discountPrice;
  const GST = req.body.GST;
  const totalPayableAmount = req.body.totalPayableAmount;
  const cartItems = req.body.cartItems;
  const invoiceNumber = req.body.invoiceNumber;

  let sessionId;

  Restaurant.findById(restaurantId)
    .then((restaurant) => {
      let lineItems = cartItems.map(item => {
        return {
          name: item.itemName,
          description: `from ${restaurant.restaurantTitle}`,
          amount: item.itemPrice * 100,
          quantity: item.itemQuantity,
          currency: 'INR',
          tax_rates: ['txr_1IS4uMEQfbnSFn12gPWiAORz']
        }
      });
      // configuring stripe checkout session
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: req.get('origin') + '/checkout/success',
        cancel_url: req.get('origin') + '/checkout/failure',
        mode: 'payment',
        allow_promotion_codes: true
      });
    })
    .then(session => {
      sessionId = session.id;
      const cart = new Cart({
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        restaurantSubTitle: restaurantSubTitle,
        restaurantAddress: restaurantAddress,
        restaurantImage: restaurantImage,
        creator: creator,
        discountPrice: discountPrice,
        GST: GST,
        totalPayableAmount: totalPayableAmount,
        cartItems: cartItems,
        invoiceNumber: invoiceNumber
      });
      return cart.save();
    })
    .then(result => {
      res.status(201).json({
        response: {
          cart: result,
          sessionId: sessionId
        },
        status: {
          code: 201,
          message: 'Items are stored and stripe session is created successfully',
          status: 'success'
        }
      });
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error while creating stripe session for payment process. Please contact support team.';
      }
      return next(error);
    });
}
