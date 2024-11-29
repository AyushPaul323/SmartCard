const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5001;

// Environment variables
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// User Schema (users collection stores tokenId and associated account)
const userSchema = new mongoose.Schema({
  tokenId: String,
  account: String,
  tokenBalance: String,
});

const User = mongoose.model("User", userSchema);

// Request Schema (stores token request details)
const requestSchema = new mongoose.Schema({
  tokenId: String,
  fetchedAccount: String,
  walletAccount: String,
  fareAmount: Number,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Request = mongoose.model("Request", requestSchema);

// Validate Token ID Route
app.get("/user/validate/:tokenId", async (req, res) => {
  const tokenId = req.params.tokenId.trim();
  try {
    const user = await User.findOne({ tokenId });
    if (!user) {
      return res.status(200).json({
        exists: false,
        message: "Token ID not found in User collection.",
      });
    }
    return res.status(200).json({
      exists: true,
      account: user.account,
      tokenBalance: user.tokenBalance,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle token requests
app.post("/user/requestTokens", async (req, res) => {
  const { tokenId, fetchedAccount, walletAccount, fareAmount } = req.body;
  try {
    const newRequest = new Request({
      tokenId,
      fetchedAccount,
      walletAccount,
      fareAmount,
      status: "pending",
    });
    await newRequest.save();
    res.status(200).json({ message: "Token request submitted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to check for completed requests with status "done"
app.get("/user/checkCompletedRequests", async (req, res) => {
  try {
    const completedRequests = await Request.find({ status: "done" });

    if (completedRequests.length > 0) {
      for (const request of completedRequests) {
        const user = await User.findOne({ account: request.walletAccount });

        if (!user) {
          console.log(`User not found for walletAccount: ${request.walletAccount}`);
          continue;
        }

        // Add the fare amount to the user's token balance
        user.tokenBalance += request.fareAmount;
        await user.save();

        // Delete the completed request from the database
        await Request.findByIdAndDelete(request._id);

        console.log(`Request for ${request.walletAccount} completed. Fare Amount: ${request.fareAmount}, Token Balance Updated.`);
      }
    }

    res.status(200).json({ message: "Completed requests checked and processed.", completedRequests });
  } catch (error) {
    console.error("Error checking completed requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
