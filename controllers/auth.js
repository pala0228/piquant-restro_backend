const User = require('../models/user');
const bcrypt = require('bcryptjs'); // Third party package to encrypt password
const jwt = require('jsonwebtoken'); // Third party package to create Json web token
const ACCESS_MATRIX = require('../common/access-matrix');
const CONSTANTS = require('../common/constants');
const Verification = require('../models/verification');
const fast2sms = require('fast-two-sms'); // Third party package to send message to mobile number within india
const FAST2SMS_SECRET_KEY = process.env.FAST2SMS_SECRET_KEY;

/**
 * Function to allow user signup into application
 */
exports.signup = (req, res, next) => {
  const email = req.body.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const userType = req.body.userType;
  const DOB = req.body.DOB;
  const contactNumber = req.body.contactNumber;
  const address = req.body.address
  const password = req.body.password;
  const restaurants = req.body.restaurants

  User.findOne({ email: email }) // gives us single object if exist
    .then((userFound) => {
      if (userFound) {
        res.status(422).json({
          response: {
            user: userFound
          },
          status: {
            code: 422,
            message: 'Email is already registered. Please login with registered password.',
            status: 'success'
          }
        });
      }
      /**
       * To hash password to be in more secured way
       */
      return bcrypt.hash(password, 12)
    })
    .then((hashPwd) => {
      const user = new User({
        email: email,
        password: hashPwd,
        firstName: firstName,
        lastName: lastName,
        userType: userType,
        DOB: DOB,
        contactNumber: contactNumber,
        address: address,
        restaurants: restaurants,
        funcIds: getFunctionIds(userType)
      });
      return user.save();
    })
    .then((user) => {
      res.status(201).json({
        response: {
          user: user
        },
        status: {
          code: 201,
          message: 'Signup process has been completed. Please login.',
          status: 'success'
        }
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error while user details being registered.';
      }
      return next(error);
    });
}

/**
 * Function to reset password if user forget he/she password
 */
exports.updatePassword = (req, res, next) => {
  const email = req.body.email;
  const newPassword = req.body.newPassword;

  let userInfo;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error('Error while fetching user details to update new password, Please check with admin team.')
        error.statusCode = 500;
        throw error; // throwing error finds out next available error middleware
      }
      userInfo = user;
      /**
       * To hash password to be in more secured way
       */
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashPsd) => {
      userInfo.password = hashPsd;
      return userInfo.save();
    })
    .then((updatedUser) => {
      if (updatedUser) {
        res.status(200).json({
          response: {
            message: 'Reset password is completed successfully. Please login with newly changed password.'
          },
          status: {
            code: 200,
            message: 'Reset password is completed successfully. Please login with newly changed password.',
            status: 'success'
          }
        });
      }
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Resetting password is failed.';
      }
      return next(error);
    });
}

/**
 * Function to allow user to login into application
 */
exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error('User is not found. Please signup for new account.');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      /**
       * To compare password stored in DB with user entered password
       */
      return bcrypt.compare(password, user.password)
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error('Password is invalid. Please enter registered password.');
        error.statusCode = 401;
        throw error;
      }
      /**
       * jwt.sign() method creates a new signature and packs it into new json web token
       */
      const token = jwt.sign(
        {
          email: loadedUser.email, userId: loadedUser._id.toString() // storing user email and id
        },
        process.env.JWT_SECRET_KEY, // secret key that is known only to the server
        {
          expiresIn: '9h' // Expires token within 9 hours once it is created, securit machanisam
        }
      );

      res.status(200).json({
        response: {
          token: token,
          user: loadedUser
        },
        status: {
          code: 200,
          message: 'Login is successfull. Congratulations..!',
          status: 'success'
        }
      })
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Logging in user is failed.'
      }
      return next(error);
    });
}

/**
 * Function to send verification code to the user for resetting
 * their password.
 */
exports.sendVerificationCode = (req, res, next) => {
  const email = req.body.email;
  const contactNumber = req.body.contactNumber;

  const verificationCode = generateCode();

  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        if (user.contactNumber === contactNumber) {
          let message = `Hi ${user.firstName} ${user.lastName}, Here is the code - ${verificationCode} to reset your password. Thank you!`
          let options = {
            authorization: FAST2SMS_SECRET_KEY,
            message: message,
            numbers: [contactNumber]
          };
          return fast2sms.sendMessage(options);
        } else {
          const error = new Error('Mobile number is invalid. Please enter registered mobile number.');
          error.statusCode = 401;
          throw error;
        }
      } else {
        const error = new Error('User is not found. Please signup for new account.');
        error.statusCode = 401;
        throw error;
      }
    })
    .then((sendSMSResponse) => {
      if (sendSMSResponse.return) {
        return Verification.findOne({ email: email });
      } else {
        const error = new Error('Error while sending verification code to your mobile. Please check with admin team.');
        error.statusCode = 401;
        throw error;
      }
    })
    .then((row) => {
      if (row) {
        row.email = email;
        row.contactNumber = contactNumber;
        row.verificationCode = verificationCode;
        return row.save();
      } else {
        const verification = new Verification({
          email: email,
          contactNumber: contactNumber,
          verificationCode: verificationCode
        });
        return verification.save();
      }
    })
    .then((result) => {
      if (result) {
        res.status(200).json({
          response: {
            verificationData: {
              verificationCode: result.verificationCode,
              updatedOn: result.updatedAt
            }
          },
          status: {
            code: 200,
            message: 'Verification code is sent to registered mobile number successfully.',
            status: 'success'
          }
        });
      }
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Sending verification code is failed.'
      }
      return next(error);
    });
}


/**
 * helper functions
 */

/**
 * To get function ids based on user type
 */
const getFunctionIds = (userType) => {
  let functionIds = [];
  switch (userType) {
    case CONSTANTS.USER:
      functionIds = ACCESS_MATRIX.CUSTOUMER;
      break;
    case CONSTANTS.ADMIN:
      functionIds = ACCESS_MATRIX.CUSTOUMER.concat(ACCESS_MATRIX.ADMIN);
      break;
    case CONSTANTS.SUPERADMIN:
      functionIds = ACCESS_MATRIX.CUSTOUMER.concat(ACCESS_MATRIX.ADMIN);
      break;
  }
  return functionIds || [];
}

/**
 * Function to generate 6 digits verification code
 */
const generateCode = () => {
  let min = Math.ceil(1);
  let max = Math.floor(1000000);
  let code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString().padEnd(6, "0");
}
