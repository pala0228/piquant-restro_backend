const Cart = require('../models/cart');
const path = require('path');
const fs = require('fs');
const createInvoice = require('../common/createInvoice');
const User = require('../models/user');

/**
 * Function to get user placed orders
 */
exports.getOrders = (req, res, next) => {
  const currentPage = +req.query.currentPage || 1; // query parameters added by ? to a route.
  const itemsPerPage = +req.query.itemsPerPage || 6;

  let totalOrders = 0;

  Cart.find({ creator: req.userId })
    .countDocuments() // gives total number of documents found
    .then((count) => {
      totalOrders = count;
      return Cart.find({ creator: req.userId }) // returns array of objects
        .populate(["creator"]) // expand User object while returning data
        .skip((currentPage - 1) * itemsPerPage) // skipping items for prev pages
        .limit(itemsPerPage) // return only itemsPerPage number passed in
    })
    .then((orders) => {
      let updatedOrders = orders.map(order => {
        return {
          id: order._id,
          restaurantId: order.restaurantId,
          restaurantName: order.restaurantName,
          address: order.restaurantAddress,
          restaurantImage: order.restaurantImage,
          items: order.cartItems.map(cartItem => {
            return {
              id: cartItem._id,
              itemName: cartItem.itemName,
              itemPrice: cartItem.itemPrice,
              itemCategory: cartItem.itemCategory,
              itemQuantity: cartItem.itemQuantity,
              itemTotalPrice: cartItem.itemTotalPrice
            }
          }),
          totalItemsCost: order.totalPayableAmount,
          discountedCost: order.discountPrice,
          GST: order.GST,
          invoiceNumber: order.invoiceNumber,
          createdOn: order.createdAt,
          createdBy: order.creator.firstName + ' ' + order.creator.lastName,
          paymentStatus: 'Success'
        }
      });
      let message = 'Orders are fetched successfully.';
      if (totalOrders === 0) {
        message = "No orders are found."
      }
      res.status(200).json({
        response: {
          ordersList: updatedOrders,
          totalOrders: totalOrders
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
        error.message = 'Error while fetching placed orders.'
      }
      return next(error);
    });
}

/**
 * Function to download an invoice
 */
exports.downloadInvoice = (req, res, next) => {
  const purchasedItems = req.body.items;
  const totalItemsPrice = req.body.subtotal;
  const totalPaidAmount = req.body.paid;
  const invoiceNumber = req.body.invoiceNumber;
  const GST = req.body.GST;
  const cartId = req.body.cartId;
  const createdOn = req.body.createdOn;

  let userData = '';

  User.findById(req.userId)
    .then((userInfo) => {
      if (userInfo) {
        userData = userInfo;
        return Cart.findById(cartId)
      }
    })
    .then((orderInfo) => {
      if (orderInfo) {
        const invoice = {
          restaurantImagePath: orderInfo.restaurantImage,
          restaurantSubTitle: orderInfo.restaurantSubTitle,
          restaurantName: orderInfo.restaurantName,
          restaurantAddress: orderInfo.restaurantAddress,
          shipping: {
            name: userData.firstName + ' ' + userData.lastName,
            address: userData.address,
            email: userData.email,
            contactNumber: userData.contactNumber
          },
          items: purchasedItems,
          subtotal: totalItemsPrice,
          paid: totalPaidAmount,
          invoice_nr: invoiceNumber,
          createdOn: createdOn,
          GST: GST
        };
        let fileName = "Invoice_" + invoiceNumber + ".pdf";
        let invoicePath = path.join(__dirname, '..', "/invoices/" + fileName);
        createInvoice(invoice, invoicePath); // generate data into pdf doc and write Stream into given path

        setTimeout(() => {
          var file = fs.createReadStream(invoicePath); // read stream from given path
          var stat = fs.statSync(invoicePath);
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
          file.pipe(res);

          clearPdf(fileName); // Removing pdf file saved once it is sent

        }, 1000)
      }
    })
    .catch(error => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error while downloading an invoice pdf document.';
      }
      return next(error);
    });
}

/**
 * Function to remove pdf file once it is sent
 */
const clearPdf = filePath => {
  filePath = path.join(__dirname, '..', "/invoices/" + filePath);
  fs.unlink(filePath, error => {
    console.log(error);
  });
}
