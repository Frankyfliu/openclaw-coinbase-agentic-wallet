const logger = require('./logger');

class SafetyControls {
  constructor() {
    this.dailySpend = 0;
    this.lastReset = new Date().toDateString();
    this.whitelist = new Set();
  }

  async initialize(config) {
    this.config = config;
    this.loadWhitelist();
    
    // Reset daily spend if new day
    const today = new Date().toDateString();
    if (today !== this.lastReset) {
      this.dailySpend = 0;
      this.lastReset = today;
    }
  }

  loadWhitelist() {
    // Load from persistent storage
    this.whitelist.add('known-exchange-address');
  }

  async checkTradeAllowed(amount, sessionSpend, config) {
    // Check session limit
    if (sessionSpend + amount > config.maxSessionSpend) {
      throw new Error(
        `Session limit exceeded. Max: ${config.maxSessionSpend}, ` +
        `Current: ${sessionSpend}, Requested: ${amount}`
      );
    }

    // Check daily limit
    if (this.dailySpend + amount > config.dailySpendLimit) {
      throw new Error(`Daily limit exceeded: ${config.dailySpendLimit}`);
    }

    // Check single tx limit
    if (amount > config.maxSingleTx) {
      throw new Error(`Transaction too large. Max: ${config.maxSingleTx}`);
    }

    logger.info(`Trade approved: ${amount} USD`);
    return true;
  }

  async checkSendAllowed(amount, toAddress, sessionSpend, config) {
    await this.checkTradeAllowed(amount, sessionSpend, config);

    // Check if address is whitelisted for large amounts
    if (amount > 50 && !this.whitelist.has(toAddress)) {
      throw new Error(
        'Large transfers to new addresses require manual approval'
      );
    }

    return true;
  }

  addToWhitelist(address) {
    this.whitelist.add(address);
    logger.info(`Added to whitelist: ${address}`);
  }
}

module.exports = SafetyControls;
