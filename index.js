#!/usr/bin/env node

/**
 * OpenClaw Coinbase Agentic Wallet Skill
 * Main entry point
 */

const WalletManager = require('./lib/wallet');
const TradingEngine = require('./lib/trading');
const SafetyControls = require('./lib/safety');
const logger = require('./lib/logger');

class CoinbaseAgenticWalletSkill {
  constructor() {
    this.name = 'CoinbaseAgenticWallet';
    this.version = '1.0.0';
    this.wallet = new WalletManager();
    this.trading = new TradingEngine(this.wallet);
    this.safety = new SafetyControls();
    
    // Initialize configuration
    this.config = {
      network: process.env.AGENTIC_WALLET_NETWORK || 'base',
      maxSessionSpend: parseFloat(process.env.MAX_SESSION_SPEND) || 100,
      maxSingleTx: parseFloat(process.env.MAX_SINGLE_TX) || 50,
      dailySpendLimit: parseFloat(process.env.DAILY_SPEND_LIMIT) || 500,
      slippage: parseFloat(process.env.DEFAULT_SLIPPAGE) || 0.5,
      autoTrade: process.env.ENABLE_AUTO_TRADE === 'true'
    };
    
    this.sessionSpend = 0;
    this.initialized = false;
  }

  /**
   * Initialize the skill
   */
  async initialize() {
    try {
      logger.info('Initializing Coinbase Agentic Wallet Skill...');
      
      // Validate environment
      this.validateEnvironment();
      
      // Initialize wallet connection
      await this.wallet.initialize({
        apiKey: process.env.COINBASE_API_KEY,
        apiSecret: process.env.COINBASE_API_SECRET,
        network: this.config.network
      });
      
      // Load safety controls
      await this.safety.initialize(this.config);
      
      // Reset session spend
      this.sessionSpend = 0;
      this.initialized = true;
      
      logger.info('Skill initialized successfully');
      return { success: true, walletAddress: this.wallet.getAddress() };
    } catch (error) {
      logger.error('Failed to initialize skill:', error);
      throw error;
    }
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    const required = ['COINBASE_API_KEY', 'COINBASE_API_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Handle incoming actions from OpenClaw
   */
  async handleAction(action, params = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    logger.info(`Executing action: ${action}`, params);

    try {
      switch (action) {
        case 'balance':
          return await this.getBalance();
        case 'trade':
          return await this.executeTrade(params);
        case 'send':
          return await this.sendFunds(params);
        case 'config':
          return await this.updateConfig(params);
        case 'history':
          return await this.getTransactionHistory(params);
        case 'dca_setup':
          return await this.setupDCA(params);
        case 'emergency_withdraw':
          return await this.emergencyWithdraw(params);
        case 'kill_switch':
          return await this.killSwitch();
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      logger.error(`Action ${action} failed:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance() {
    const balance = await this.wallet.getBalance();
    const address = this.wallet.getAddress();
    
    return {
      success: true,
      address,
      network: this.config.network,
      balances: balance.tokens,
      totalUsdValue: balance.totalUsd,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute token trade
   */
  async executeTrade({ amount, fromToken, toToken, slippage }) {
    // Safety checks
    await this.safety.checkTradeAllowed(amount, this.sessionSpend, this.config);
    
    const tradeSlippage = slippage || this.config.slippage;
    
    logger.info(`Executing trade: ${amount} ${fromToken} -> ${toToken}`);
    
    const result = await this.wallet.trade({
      amount: parseFloat(amount),
      from: fromToken.toUpperCase(),
      to: toToken.toUpperCase(),
      slippage: tradeSlippage
    });
    
    // Update session spend
    this.sessionSpend += parseFloat(amount);
    
    // Log transaction
    await this.logTransaction({
      type: 'trade',
      amount,
      fromToken,
      toToken,
      txHash: result.txHash,
      status: 'completed'
    });
    
    return {
      success: true,
      action: 'trade',
      amount,
      from: fromToken,
      to: toToken,
      txHash: result.txHash,
      sessionSpend: this.sessionSpend,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send funds to address
   */
  async sendFunds({ amount, token, toAddress, memo }) {
    // Validate address
    if (!this.wallet.isValidAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }
    
    // Safety checks
    await this.safety.checkSendAllowed(amount, toAddress, this.sessionSpend, this.config);
    
    logger.info(`Sending ${amount} ${token} to ${toAddress}`);
    
    const result = await this.wallet.send({
      to: toAddress,
      amount: parseFloat(amount),
      currency: token.toUpperCase(),
      memo: memo || 'OpenClaw Agent Transfer'
    });
    
    // Update session spend
    this.sessionSpend += parseFloat(amount);
    
    // Log transaction
    await this.logTransaction({
      type: 'send',
      amount,
      token,
      to: toAddress,
      txHash: result.txHash,
      status: 'completed'
    });
    
    return {
      success: true,
      action: 'send',
      amount,
      token,
      to: toAddress,
      txHash: result.txHash,
      sessionSpend: this.sessionSpend,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Setup Dollar Cost Averaging
   */
  async setupDCA({ amount, fromToken, toToken, frequency }) {
    const validFrequencies = ['hourly', 'daily', 'weekly'];
    if (!validFrequencies.includes(frequency)) {
      throw new Error(`Invalid frequency. Choose from: ${validFrequencies.join(', ')}`);
    }
    
    logger.info(`Setting up DCA: ${amount} ${fromToken} -> ${toToken} (${frequency})`);
    
    return {
      success: true,
      action: 'dca_setup',
      config: {
        amount: parseFloat(amount),
        fromToken: fromToken.toUpperCase(),
        toToken: toToken.toUpperCase(),
        frequency,
        createdAt: new Date().toISOString(),
        active: true
      }
    };
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory({ limit = 10 }) {
    const history = await this.wallet.getTransactionHistory(limit);
    
    return {
      success: true,
      count: history.length,
      transactions: history,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Emergency withdraw all funds
   */
  async emergencyWithdraw({ safeAddress }) {
    logger.warn(`EMERGENCY WITHDRAWAL initiated to ${safeAddress}`);
    
    const result = await this.wallet.emergencyWithdraw(safeAddress);
    
    return {
      success: true,
      action: 'emergency_withdraw',
      safeAddress,
      amountTransferred: result.amount,
      txHash: result.txHash,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Kill switch - disable all operations
   */
  async killSwitch() {
    logger.warn('KILL SWITCH activated - all operations disabled');
    
    this.config.autoTrade = false;
    this.sessionSpend = Infinity; // Prevent any new transactions
    
    return {
      success: true,
      action: 'kill_switch',
      status: 'ALL_OPERATIONS_DISABLED',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update configuration
   */
  async updateConfig(params) {
    const allowedKeys = ['maxSessionSpend', 'maxSingleTx', 'dailySpendLimit', 'slippage'];
    
    for (const [key, value] of Object.entries(params)) {
      if (allowedKeys.includes(key)) {
        this.config[key] = parseFloat(value);
      }
    }
    
    return {
      success: true,
      action: 'config',
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log transaction to memory
   */
  async logTransaction(txData) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const logDir = path.join(__dirname, 'memory');
    const logFile = path.join(logDir, 'transactions.json');
    
    try {
      await fs.mkdir(logDir, { recursive: true });
      
      let logs = [];
      try {
        const data = await fs.readFile(logFile, 'utf8');
        logs = JSON.parse(data);
      } catch (e) {
        // File doesn't exist yet
      }
      
      logs.push({
        ...txData,
        timestamp: new Date().toISOString()
      });
      
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      logger.error('Failed to log transaction:', error);
    }
  }
}

// Export for OpenClaw
module.exports = CoinbaseAgenticWalletSkill;

// CLI support
if (require.main === module) {
  const skill = new CoinbaseAgenticWalletSkill();
  
  const action = process.argv[2];
  const params = JSON.parse(process.argv[3] || '{}');
  
  skill.handleAction(action, params)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error(JSON.stringify({ success: false, error: error.message }));
      process.exit(1);
    });
}
