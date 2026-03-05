const { Coinbase } = require('@coinbase/coinbase-sdk');
const logger = require('./logger');

class WalletManager {
  constructor() {
    this.client = null;
    this.wallet = null;
    this.address = null;
    this.network = 'base';
  }

  async initialize({ apiKey, apiSecret, network = 'base' }) {
    this.network = network;
    
    // Initialize Coinbase SDK
    this.client = new Coinbase({
      apiKey,
      apiSecret
    });
    
    // Create or load existing Agentic Wallet
    this.wallet = await this.client.createAgenticWallet({
      networkId: network === 'base' ? 'base-mainnet' : 
                 network === 'ethereum' ? 'ethereum-mainnet' : 'solana-mainnet'
    });
    
    this.address = await this.wallet.getDefaultAddress();
    logger.info(`Wallet initialized: ${this.address} on ${network}`);
    
    return this.address;
  }

  getAddress() {
    return this.address;
  }

  isValidAddress(address) {
    if (this.network === 'solana') {
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    }
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  async getBalance() {
    const balances = await this.wallet.listBalances();
    
    const tokens = {};
    let totalUsd = 0;
    
    for (const [asset, amount] of Object.entries(balances)) {
      tokens[asset] = {
        amount: amount.toString(),
        usdValue: await this.getUsdValue(asset, amount)
      };
      totalUsd += tokens[asset].usdValue;
    }
    
    return { tokens, totalUsd };
  }

  async getUsdValue(asset, amount) {
    // Simplified - in production use price oracle
    if (asset === 'USDC' || asset === 'USDT') return parseFloat(amount);
    // Fetch from API for other assets
    return 0; // Placeholder
  }

  async trade({ amount, from, to, slippage }) {
    try {
      // Use Coinbase's built-in trading
      const trade = await this.wallet.trade({
        amount: amount.toString(),
        fromAssetId: from,
        toAssetId: to,
        slippageTolerance: slippage / 100
      });
      
      await trade.wait();
      
      return {
        txHash: trade.getTransactionHash(),
        gasUsed: trade.getTransaction().getGasUsed(),
        status: 'completed'
      };
    } catch (error) {
      logger.error('Trade failed:', error);
      throw error;
    }
  }

  async send({ to, amount, currency, memo }) {
    try {
      const transfer = await this.wallet.transfer({
        amount: amount.toString(),
        assetId: currency,
        destination: to,
        memo
      });
      
      await transfer.wait();
      
      return {
        txHash: transfer.getTransactionHash(),
        status: 'completed'
      };
    } catch (error) {
      logger.error('Transfer failed:', error);
      throw error;
    }
  }

  async getTransactionHistory(limit = 10) {
    // Fetch from Coinbase API or local logs
    const transfers = await this.wallet.listTransfers({ limit });
    return transfers.map(t => ({
      type: t.getType(),
      amount: t.getAmount(),
      asset: t.getAssetId(),
      status: t.getStatus(),
      txHash: t.getTransactionHash(),
      timestamp: t.getCreatedAt()
    }));
  }

  async emergencyWithdraw(safeAddress) {
    const balances = await this.getBalance();
    const results = [];
    
    for (const [asset, data] of Object.entries(balances.tokens)) {
      if (parseFloat(data.amount) > 0) {
        const result = await this.send({
          to: safeAddress,
          amount: data.amount,
          currency: asset,
          memo: 'Emergency Withdrawal'
        });
        results.push({ asset, ...result });
      }
    }
    
    return results;
  }
}

module.exports = WalletManager;
