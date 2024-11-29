require("dotenv").config();  // Add this at the top of your file to load environment variables

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection using environment variable
const mongoURI = process.env.MONGO_URI;  // Use the MONGO_URI from the .env file
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  account: String,
  tokenId: Number,
  tokenBalance: Number,
});

const requestSchema = new mongoose.Schema({
  tokenId: Number,
  fetchedAccount: String,
  walletAccount: String,
  fareAmount: Number,
  status: { type: String, default: "pending" },
});

const User = mongoose.model("User", userSchema);
const Request = mongoose.model("Request", requestSchema);

// Endpoint to create a new user
app.post("/user", async (req, res) => {
  const { account, tokenId, tokenBalance } = req.body;
  try {
    const newUser = new User({ account, tokenId, tokenBalance });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});

// Endpoint to fetch user by account
app.get("/user/:account", async (req, res) => {
  const { account } = req.params;
  try {
    const user = await User.findOne({ account });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

// Endpoint to update user token balance
app.post("/user/update", async (req, res) => {
  const { account, tokenBalance } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { account },
      { tokenBalance },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User data updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user data", error });
  }
});

// Endpoint to create a new request
app.post("/requests", async (req, res) => {
  const { tokenId, fetchedAccount, walletAccount, fareAmount } = req.body;
  try {
    const newRequest = new Request({
      tokenId,
      fetchedAccount,
      walletAccount,
      fareAmount,
    });
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: "Error creating request", error });
  }
});

// Endpoint to fetch all requests
app.get("/requests", async (req, res) => {
  try {
    const requests = await Request.find();
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests", error });
  }
});

// Endpoint to update request status
app.post("/requests/update", async (req, res) => {
  const { id, status } = req.body;
  try {
    const request = await Request.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ message: "Request updated successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Error updating request", error });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
