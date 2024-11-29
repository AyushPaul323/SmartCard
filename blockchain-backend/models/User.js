const mongoose = require('mongoose');

// Define the schema for user data
const userSchema = new mongoose.Schema({
  account: {
    type: String,
    required: true,
    unique: true,
  },
  tokenId: {
    type: String,
    required: true,
  },
  tokenBalance: {
    type: Number,
    required: true,
    default: 0,
  },
});

// Create a model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
