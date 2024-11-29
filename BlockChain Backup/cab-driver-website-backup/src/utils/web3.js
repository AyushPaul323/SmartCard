import Web3 from "web3";
import ContractABI from "../abi/TransportToken.json"; // Ensure this is correctly pointing to your ABI file

const web3 = new Web3(window.ethereum); // Connect MetaMask
const contractAddress = "0xDDC10067A2f127EDBA373bE87152D588C0532367"; // Replace with Remix-deployed contract address
const transportToken = new web3.eth.Contract(ContractABI, contractAddress);

console.log("ABI:", ContractABI); // Debugging: Check ABI content
console.log("Transport Token Contract:", transportToken); // Debugging: Check contract instance

export { web3, transportToken };
