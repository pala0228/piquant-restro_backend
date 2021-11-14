const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const verificationSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  contactNumber: {
    type: Number,
    required: true
  },
  verificationCode: {
    type: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Verification', verificationSchema);
