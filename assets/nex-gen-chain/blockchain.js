// File: blockchain.js
const Block = require('./block');
const Transaction = require('./transaction');

class Blockchain {
  constructor() {
    this.chain = [];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100; // Example: mining reward for adding a new block
  }

  createGenesisBlock() {
    return new Block(0, '01/02/2024', 'Genesis Block', '0');
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
}

module.exports = Blockchain;