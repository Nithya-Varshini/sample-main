// File: transaction.js
class Transaction {
    constructor(fromAddress, toAddress, amount) {
      this.fromAddress = fromAddress;
      this.toAddress = toAddress;
      this.amount = amount;
    }
  
    toJSON() {
      return {
        fromAddress: this.fromAddress,
        toAddress: this.toAddress,
        amount: this.amount,
      };
    }
  }
  
  module.exports = Transaction;