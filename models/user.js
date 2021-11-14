const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true
  },
  DOB: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  restaurants: [{
    type: Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  funcIds: [{
    type: String,
    required: true
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
