const jwt = require('jsonwebtoken'); // Third party package to create Json web token

/**
 * It checks every incoming request and reject if authorization token
 * is not attached in it.
 */
module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    // varifying token for every request coming to server with secret key known by only server
    decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated');
    error.statusCode = 401;
    throw error;
  }
  // adding userId to request which can be accessed at every middlewares.
  req.userId = decodedToken.userId;

  next(); // Go to next middleware available.
}
