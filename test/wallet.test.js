const assert = require('assert');
const WalletManager = require('../lib/wallet');

describe('WalletManager', () => {
  let wallet;

  beforeEach(() => {
    wallet = new WalletManager();
  });

  describe('isValidAddress', () => {
    it('should validate Ethereum addresses', () => {
      wallet.network = 'base';
      assert.strictEqual(
        wallet.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'),
        false // Invalid (too short)
      );
      assert.strictEqual(
        wallet.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbD'),
        true // Valid
      );
    });

    it('should validate Solana addresses', () => {
      wallet.network = 'solana';
      assert.strictEqual(
        wallet.isValidAddress('HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH'),
        true
      );
    });
  });
});
