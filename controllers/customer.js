const User = require('../models/user');
const Verification = require('../models/verification');

/**
 * Function to update user profile information
 */
exports.updateProfile = (req, res, next) => {
  const userId = req.body.userId;
  const contactNumber = req.body.contactNumber;
  const address = req.body.address

  let userInfo;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error('User is not found. Please check with admin team.');
        error.statusCode = 500;
        throw error;
      }
      userInfo = user;
      userInfo.contactNumber = contactNumber;
      userInfo.address = address;

      return userInfo.save();
    })
    .then((updatedUser) => {
      if (updatedUser) {
        return Verification.findOne({ email: userInfo.email });
      }
    })
    .then((row) => {
      if (!row) {
        res.status(200).json({
          response: {
            user: userInfo
          },
          status: {
            code: 200,
            message: 'User profile is updated successfully.',
            status: 'success'
          }
        });
      } else {
        row.contactNumber = contactNumber;
        return row.save();
      }
    })
    .then((result) => {
      if (result) {
        res.status(200).json({
          response: {
            user: userInfo
          },
          status: {
            code: 200,
            message: 'User profile is updated successfully.',
            status: 'success'
          }
        });
      }
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Updating user profile is failed.';
      }
      return next(error);
    });
}
