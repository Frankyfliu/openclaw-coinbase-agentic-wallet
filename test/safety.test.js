const assert = require('assert');
const SafetyControls = require('../lib/safety');

describe('SafetyControls', () => {
  let safety;
  const config = {
    maxSessionSpend: 100,
    maxSingleTx: 50,
    dailySpendLimit: 500
  };

  beforeEach(() => {
    safety = new SafetyControls();
    safety.initialize(config);
  });

  describe('checkTradeAllowed', () => {
    it('should allow trades under limits', async () => {
      const result = await safety.checkTradeAllowed(30, 0, config);
      assert.strictEqual(result, true);
    });

    it('should reject trades exceeding session limit', async () => {
      try {
        await safety.checkTradeAllowed(50, 60, config);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('Session limit exceeded'));
      }
    });

    it('should reject trades exceeding single tx limit', async () => {
      try {
        await safety.checkTradeAllowed(60, 0, config);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('Transaction too large'));
      }
    });
  });
});
