const express = require('express'); // Node js framework helps in to write easy code
const bodyParser = require('body-parser'); // third party package which can parse an incoming request body
const helmet = require('helmet'); // third party package to secure node express application.
const compression = require('compression'); // third party package to decreases the downloadable amount of data that's served to users.(Improve performance of node app)
const restaurantsRoutes = require('./routes/restaurant');
const itemRoutes = require('./routes/item');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const ordersRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customer');
const mongoose = require('mongoose'); // It's ODM(object document mapping) which helps us to connect mongoDB sever to perform operations.
const path = require('path'); // Core node path package to construct absolute path

const app = express(); // express framework object

// It secure response headers, it adds extra special headers to response object
app.use(helmet());
// It improve performance of Node.js applications, reduce size of main.js and css content
app.use(compression());

app.use(bodyParser.json()); // Middleware with body parser(application/json type) to every incoming request to parse data

// Static serving to images folder with core node 'path' package.
app.use('/images', express.static(path.join(__dirname, "images")));

/**
 * To allow other servers to connect to this server localhost:8080
 * with below mentioned methods and headers.
 */
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', "*");
  res.setHeader('Access-Control-Allow-Methods', "OPTIONS, GET, POST, PUT, PATCH, DELETE");
  res.setHeader('Access-Control-Allow-Headers', "Origin, Content-Type, Authorization");
  next(); // go to next middldeware available untill response is sent back
});

// Registering routes here with difference middlewares
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/item', itemRoutes);
app.use('/auth', authRoutes);
app.use('/api/cart', shopRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/customer', customerRoutes);

// Error handling middleware at one place to handle all types of errors and send error response.
app.use((error, req, res, next) => {
  const code = error.statusCode || 500; // if statusCode not defined then takes 500 by default.
  const message = error.message;
  res.status(code).json({
    response: null,
    status: {
      code: code,
      message: message,
      status: 'failed'
    }
  });
});
/**
 * mongoose will connect to the mongo db and then start server http://localhost:8080
 */
mongoose
  .connect("mongodb+srv://" + process.env.MONGODB_USER + ":" + process.env.MONGODB_ATLAS_PWD + "@cluster0.ntzkd.mongodb.net/" + process.env.MONGODB_DEFAULT_DATABASE + "?retryWrites=true&w=majority", { useUnifiedTopology: true }, { useNewUrlParser: true })
  .then(result => {
    const server = app.listen(process.env.PORT || 8080);
    const io = require('./socket-io').init(server);
    io.on('connection', socket => {
      console.log("user is connected")
    });
  }).catch(error => console.log('i am error', error));
