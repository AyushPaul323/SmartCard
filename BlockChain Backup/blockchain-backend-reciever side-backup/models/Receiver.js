const mongoose = require("mongoose");

// Define the schema for receiver data
const receiverSchema = new mongoose.Schema({
  account: {
    type: String,
    required: true,
    unique: true,
  },
  tokenBalance: {
    type: Number,
    default: 0,
  },
});

// Create a model from the schema
const Receiver = mongoose.model("Receiver", receiverSchema);

module.exports = Receiver;
