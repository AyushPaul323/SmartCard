import React, { useState, useEffect } from "react";
import axios from "axios";
import { web3, transportToken } from "./utils/web3";
import Modal from "react-modal"; // Importing Modal for pop-up
import "./App.css";

Modal.setAppElement("#root"); // Accessibility setting for Modal

function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [tokens, setTokens] = useState(0);
  const [amountToBuy, setAmountToBuy] = useState(0);
  const [userId, setUserId] = useState("");
  const [receiverAccount, setReceiverAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null); // New state for pending request modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state

  // Validate Ethereum Address
  const isValidEthereumAddress = (address) => web3.utils.isAddress(address);

  // Load blockchain data
  const loadBlockchainData = async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask to use this app.");
        return;
      }

      const accounts = await web3.eth.getAccounts();
      if (accounts.length === 0) {
        alert("No accounts found. Please connect your wallet.");
        return;
      }

      setAccount(accounts[0]);
      setIsConnected(true);

      const balance = await transportToken.methods.balanceOf(accounts[0]).call();
      setBalance(web3.utils.fromWei(balance, "ether"));

      try {
        const userData = await axios.get(`http://localhost:5000/user/${accounts[0]}`);
        setUserId(userData.data.tokenId);
        setTokens(userData.data.tokenBalance || 0);
      } catch (error) {
        if (error.response?.status === 404) {
          const newUserId = Math.floor(1000 + Math.random() * 9000);
          setUserId(newUserId);

          await axios.post("http://localhost:5000/user", {
            account: accounts[0],
            tokenId: newUserId,
            tokenBalance: 0,
          });
        } else {
          console.error("Error fetching user data:", error);
        }
      }
    } catch (error) {
      console.error("Error loading blockchain data:", error);
      alert("Error loading blockchain data.");
    }
  };

  // Process pending requests and show the modal
  useEffect(() => {
    const processRequests = async () => {
      if (!userId) return;

      try {
        const response = await axios.get("http://localhost:5000/requests");
        const requests = response.data;

        for (const request of requests) {
          if (request.tokenId === userId && request.status === "pending") {
            setPendingRequest(request); // Set the request for the modal
            setIsModalOpen(true); // Open the modal
          }
        }
      } catch (error) {
        console.error("Error processing requests:", error);
      }
    };

    const interval = setInterval(processRequests, 1000);
    return () => clearInterval(interval);
  }, [userId]);

  // Handle the "Done" action in the modal
  const handleDone = async () => {
    try {
      if (pendingRequest) {
        const newTokenBalance = tokens - pendingRequest.fareAmount;
        if (newTokenBalance < 0) {
          alert("Insufficient tokens to process the request.");
          return;
        }

        // Deduct tokens from the user balance
        setTokens(newTokenBalance);

        await axios.post("http://localhost:5000/requests/update", {
          id: pendingRequest._id,
          status: "done", // Mark request as completed
        });

        await axios.post("http://localhost:5000/user/update", {
          account,
          tokenBalance: newTokenBalance,
        });

        alert("Request processed successfully!");
        setIsModalOpen(false); // Close the modal
        loadBlockchainData(); // Reload data
      }
    } catch (error) {
      console.error("Error processing request:", error);
      alert("Error processing the request.");
    }
  };

  // Handle the "Cancel" action in the modal
  const handleCancel = () => {
    setIsModalOpen(false); // Simply close the modal without doing anything
  };

  // Handle token purchase
  const buyTokens = async () => {
    try {
      const tokenCost = 100;
      const amountInTokens = parseFloat(amountToBuy) * tokenCost;
      const weiAmount = web3.utils.toWei(amountInTokens.toString(), "ether");

      if (amountToBuy <= 0) {
        alert("Please enter a valid amount greater than 0.");
        return;
      }

      if (!isValidEthereumAddress(receiverAccount)) {
        alert("Please enter a valid Ethereum address.");
        return;
      }

      await transportToken.methods
        .transfer(receiverAccount, weiAmount)
        .send({ from: account });

      const updatedTokens = tokens + amountInTokens;
      setTokens(updatedTokens);

      await axios.post("http://localhost:5000/user/update", {
        account,
        tokenId: userId,
        tokenBalance: updatedTokens,
      });

      alert("Token purchase successful!");
      loadBlockchainData();
    } catch (error) {
      console.error("Token purchase failed:", error);
      alert("Token purchase failed: " + error.message);
    }
  };

  // Handle logout
  const logout = () => {
    setAccount("");
    setBalance("0");
    setTokens(0);
    setUserId("");
    setIsConnected(false);
  };

  // Listen to MetaMask account/network changes
  useEffect(() => {
    const handleAccountsChanged = () => loadBlockchainData();
    const handleChainChanged = () => window.location.reload();

    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    loadBlockchainData();

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  return (
    <div className="container">
      <h1>Transport Token System</h1>

      {!isConnected ? (
        <button
          onClick={async () => {
            await loadBlockchainData();
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <h3>Account: {account}</h3>
          <h3>Token Balance: {balance} TPT</h3>
          <h3>Tokens Purchased: {tokens}</h3>
          <h3>Your User ID: {userId}</h3>
          <button onClick={logout}>Logout</button>
        </div>
      )}

      {isConnected && (
        <div>
          <input
            type="text"
            value={receiverAccount}
            onChange={(e) => setReceiverAccount(e.target.value)}
            placeholder="Receiver's Ethereum address"
          />
          <input
            type="number"
            value={amountToBuy}
            onChange={(e) => setAmountToBuy(e.target.value)}
            placeholder="Amount to buy (in TPT)"
          />
          <button onClick={buyTokens}>Buy Tokens</button>
        </div>
      )}

      {/* Modal for pending request */}
      <Modal isOpen={isModalOpen} onRequestClose={handleCancel}>
        {pendingRequest && (
          <>
            <h2>Request Details</h2>
            <div className="modal-content">
              <p><strong>Fare Amount:</strong> {pendingRequest.fareAmount} Tokens</p>
              <p><strong>From Account:</strong> {pendingRequest.walletAccount}</p>
              <p><strong>Status:</strong> {pendingRequest.status}</p>
            </div>
            <div className="modal-buttons">
              <button onClick={handleDone}>Done</button>
              <button className="cancel" onClick={handleCancel}>Cancel</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default App;
