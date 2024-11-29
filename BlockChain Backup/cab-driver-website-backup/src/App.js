import React, { useState, useEffect } from "react";
import axios from "axios";
import { web3 } from "./utils/web3"; // Assuming you have web3 initialized in utils/web3.js
import "./App.css";

function App() {
  const [account, setAccount] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTokenIdValid, setIsTokenIdValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchedAccount, setFetchedAccount] = useState("");
  const [fareAmount, setFareAmount] = useState("");
  const [isFareAmountValid, setIsFareAmountValid] = useState(false);
  const [showFareSection, setShowFareSection] = useState(true);
  const [showFetchedAccount, setShowFetchedAccount] = useState(true);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0); // New state for token balance

  // Load blockchain data (connect to MetaMask)
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
    } catch (error) {
      console.error("Error loading blockchain data:", error);
      alert("Error loading blockchain data. Please check the console for details.");
    }
  };

  // Validate Token ID
  const validateTokenId = async () => {
    try {
      setLoading(true);
      const trimmedTokenId = tokenId.trim();

      const response = await axios.get(`http://localhost:5001/user/validate/${trimmedTokenId}`);
      setLoading(false);

      if (response.data.exists) {
        setIsTokenIdValid(true);
        setFetchedAccount(response.data.account);
        setShowFareSection(true);
        setShowFetchedAccount(true);
        alert(`Token ID validated. Account: ${response.data.account}`);
        fetchCalculatedFare(22.5726, 88.3639, 22.5964, 88.4003, 4.7); // Example coordinates and distance
      } else {
        setIsTokenIdValid(false);
        setShowFareSection(false);
        setShowFetchedAccount(false);
        alert(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      console.error("Error validating Token ID:", error);
      alert("Id not found.");
      setShowFareSection(false);
      setShowFetchedAccount(false);
    }
  };

  // Fetch Calculated Fare from Flask server
  const fetchCalculatedFare = async (pickup_latitude, pickup_longitude, destination_latitude, destination_longitude, distance) => {
    try {
      const response = await axios.post("http://localhost:5000/predict_fare", {
        pickup_latitude,
        pickup_longitude,
        destination_latitude,
        destination_longitude,
        distance,
      });

      if (response.data.fare) {
        setFareAmount(response.data.fare);
        console.log(`Fare Calculated: ${response.data.fare}`);
      } else {
        console.error("Error fetching calculated fare:", response.data.error);
      }
    } catch (error) {
      console.error("Error calling Flask API:", error);
      alert("Error calculating fare. Please check the console.");
    }
  };

  // Validate the fare amount
  useEffect(() => {
    if (fareAmount && fareAmount > 0) {
      setIsFareAmountValid(true);
    } else {
      setIsFareAmountValid(false);
    }
  }, [fareAmount]);

  // Handle Token Request
  const handleRequestTokens = async () => {
    try {
      const response = await axios.post("http://localhost:5001/user/requestTokens", {
        tokenId,
        fetchedAccount,
        walletAccount: account,
        fareAmount,
      });

      alert(response.data.message);
    } catch (error) {
      console.error("Error requesting tokens:", error);
      alert("Error requesting tokens. Please check the console.");
    }
  };

  // Check completed requests
  const checkCompletedRequests = async () => {
    try {
      const response = await axios.get("http://localhost:5001/user/checkCompletedRequests");
      const completedRequests = response.data.completedRequests;

      const completedWithPayment = completedRequests.filter(request => request.status === "done");
      setCompletedRequests(completedWithPayment);

      completedWithPayment.forEach(async (request) => {
        const updatedBalance = await fetchUpdatedTokenBalance(request.walletAccount);
        setTokenBalance(updatedBalance);
        alert(`Payment completed for Token ID: ${request.tokenId}. Fare Amount: ${request.fareAmount}`);
      });

    } catch (error) {
      console.error("Error checking completed requests:", error);
      alert("Error checking completed requests. Please check the server.");
    }
  };

  // Fetch updated token balance
  const fetchUpdatedTokenBalance = async (walletAddress) => {
    try {
      const response = await axios.get(`http://localhost:5001/user/getTokenBalance/${walletAddress}`);
      return response.data.balance;
    } catch (error) {
      console.error("Error fetching updated token balance:", error);
      return 0;
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", loadBlockchainData);
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
    loadBlockchainData();
    checkCompletedRequests();
    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener("accountsChanged", loadBlockchainData);
        window.ethereum.removeListener("chainChanged", loadBlockchainData);
      }
    };
  }, []);

  return (
    <div className="container">
      <h1>Transport Token System</h1>

      {!isConnected ? (
        <button
          onClick={async () => {
            try {
              await window.ethereum.request({ method: "eth_requestAccounts" });
              loadBlockchainData();
            } catch (err) {
              alert("Connection failed!");
            }
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <h3>Connected: {account}</h3>
        </div>
      )}

      {isConnected && (
        <div>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter Token ID"
          />
          <button onClick={validateTokenId} disabled={loading}>
            {loading ? "Validating..." : "Validate Token ID"}
          </button>

          {isTokenIdValid && (
            <div>
              {showFetchedAccount && <p>Fetched Account: {fetchedAccount}</p>}

              {showFareSection && (
                <div>
                  <input
                    type="number"
                    value={fareAmount}
                    onChange={(e) => setFareAmount(e.target.value)}
                    placeholder="Enter Fare Amount"
                  />
                  <button
                    onClick={handleRequestTokens}
                    disabled={!isFareAmountValid}
                  >
                    Request Tokens
                  </button>
                  {!isFareAmountValid && (
                    <p style={{ color: "red" }}>Please enter a valid fare amount greater than 0</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <h3>Your Token Balance: {tokenBalance}</h3>
      </div>

      <div>
        <h3>Completed Requests</h3>
        {completedRequests.length > 0 ? (
          completedRequests.map((request) => (
            <div key={request._id}>
              <p>Token ID: {request.tokenId}</p>
              <p>Account: {request.walletAccount}</p>
              <p>Fare Amount: {request.fareAmount}</p>
              {request.status === "done" && (
                <p style={{ color: "green" }}>
                  Payment Completed! Amount: {request.fareAmount} added to your balance.
                </p>
              )}
            </div>
          ))
        ) : (
          <p>No completed requests found.</p>
        )}
      </div>
    </div>
  );
}

export default App;
