const express = require('express');
const bodyParser = require('body-parser');
const sha256 = require('sha256');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with your service account key JSON file
const serviceAccount = require('./fir-181be-firebase-adminsdk-wy43d-9f6732f3ea.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// Define a Block class
class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return sha256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
    );
  }

  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  // Save the block to Firestore
  async saveToFirestore() {
    const blockData = {
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash,
      hash: this.hash,
      nonce: this.nonce,
    };

    await firestore.collection('blocks').doc(this.index.toString()).set(blockData);
  }
}

// Define a Blockchain class
class Blockchain {
  constructor() {
    this.chain = [];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100; // Example: mining reward for adding a new block
  }

  createGenesisBlock() {
    return new Block(0, '01/01/2024', 'Genesis Block', '0');
  }

  getLatestBlock() {
    return this.chain.length > 0 ? this.chain[this.chain.length - 1] : null;
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTransaction = new Transaction(
      null,
      miningRewardAddress,
      this.miningReward
    );
    this.pendingTransactions.push(rewardTransaction);
  
    const latestBlock = this.getLatestBlock();
  
    if (!latestBlock) {
      // Create the genesis block if the chain is empty
      const genesisBlock = this.createGenesisBlock();
      this.chain.push(genesisBlock);
    }
  
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      latestBlock ? latestBlock.hash : '0' // Use '0' if the chain is empty
    );
    newBlock.mineBlock(this.difficulty);
  
    this.chain.push(newBlock);
    this.pendingTransactions = [];
  }  

  addTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

// Save the entire blockchain to Firestore
async saveBlockchainToFirestore() {
    const blockchainData = this.chain.map((block) => {
      const data =
        Array.isArray(block.data)
          ? block.data.map((transaction) =>
              transaction && typeof transaction.toJSON === 'function'
                ? transaction.toJSON()
                : transaction
            )
          : block.data && typeof block.data.toJSON === 'function'
          ? block.data.toJSON()
          : block.data;
  
      return {
        index: block.index,
        timestamp: block.timestamp,
        data,
        previousHash: block.previousHash,
        hash: block.hash,
        nonce: block.nonce,
      };
    });
  
    await firestore.collection('blockchain').doc('chain').set({ chain: blockchainData });
  }  

  // Load the entire blockchain from Firestore
  async loadBlockchainFromFirestore() {
    const blockchainSnapshot = await firestore.collection('blockchain').doc('chain').get();

    if (blockchainSnapshot.exists) {
      const blockchainData = blockchainSnapshot.data().chain;
      this.chain = blockchainData.map(
        (blockData) =>
          new Block(
            blockData.index,
            blockData.timestamp,
            blockData.data,
            blockData.previousHash
          )
      );
    }
  }
}

// Define a Transaction class (for the pending transactions)
class Transaction {
    constructor(fromAddress, toAddress, amount) {
      this.fromAddress = fromAddress;
      this.toAddress = toAddress;
      this.amount = amount;
    }
  
    // Convert the Transaction object to a plain JavaScript object
    toJSON() {
      return {
        fromAddress: this.fromAddress,
        toAddress: this.toAddress,
        amount: this.amount,
      };
    }
  }

// Create a simple express web server
const app = express();
app.use(bodyParser.json());

const myBlockchain = new Blockchain();

// Load the blockchain from Firestore on startup
myBlockchain.loadBlockchainFromFirestore().then(() => {
  // Get the entire blockchain
  app.get('/blockchain', async (req, res) => {
    await myBlockchain.saveBlockchainToFirestore();
    res.json(myBlockchain);
  });

  // Mine a new block
  app.post('/mineBlock', async (req, res) => {
    const newBlockData = req.body.data;
    myBlockchain.minePendingTransactions('miner-address'); // Replace with an actual miner's address
    await myBlockchain.saveBlockchainToFirestore();
    res.json({ message: 'Block mined successfully', blockchain: myBlockchain });
  });

  // Add a new transaction to pending transactions
  app.post('/addTransaction', (req, res) => {
    const { fromAddress, toAddress, amount } = req.body;
    const newTransaction = new Transaction(fromAddress, toAddress, amount);
    myBlockchain.addTransaction(newTransaction);
    res.json({ message: 'Transaction added to pending transactions', transaction: newTransaction });
  });

  // Run the server
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server Is Running ⚓ On Port ${PORT}`);
  });
});