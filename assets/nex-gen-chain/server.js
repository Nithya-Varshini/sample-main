// File: server.js
const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const Transaction = require('./transaction');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with your service account key JSON file
const serviceAccount = require('./fir-181be-firebase-adminsdk-wy43d-9f6732f3ea.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

const app = express();
app.use(bodyParser.json());

const myBlockchain = new Blockchain();

// Get the entire blockchain
app.get('/blockchain', async (req, res) => {
  res.json(myBlockchain);
});

// Mine a new block
app.post('/mineBlock', async (req, res) => {
  const newBlockData = req.body.data;
  myBlockchain.minePendingTransactions('miner-address'); // Replace with an actual miner's address
  res.json({ message: 'Block Mined Successfully', blockchain: myBlockchain });
});

// Add a new transaction to pending transactions
app.post('/addTransaction', (req, res) => {
  const { fromAddress, toAddress, amount } = req.body;
  const newTransaction = new Transaction(fromAddress, toAddress, amount);
  myBlockchain.addTransaction(newTransaction);
  res.json({ message: 'Transaction Added To Pending Transactions', transaction: newTransaction });
});

// Run the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server Is Running ⚓ On Port ${PORT}`);
});