# OpenClaw Coinbase Agentic Wallet Skill

Enable OpenClaw AI agents to autonomously manage crypto assets using [Coinbase Agentic Wallets](https://www.coinbase.com/developer-platform).

## ✨ Features

- 🔐 **Secure by Design**: Private keys never exposed to AI agents
- 💱 **Gasless Trading**: Zero gas fees on Base network
- 🛡️ **Built-in Safety**: Programmable spending limits and KYT screening
- 🤖 **AI-Native**: Designed specifically for autonomous AI agents

## 🚀 Quick Start

```bash
git clone https://github.com/Frankyfliu/openclaw-coinbase-agentic-wallet.git
cd openclaw-coinbase-agentic-wallet
npm install
cp .env.example .env
# Edit .env with your Coinbase API credentials
```

## Usage

```javascript
const Skill = require('./index');
const skill = new Skill();

// Initialize
await skill.initialize();

// Check balance
const balance = await skill.handleAction('balance');
console.log(balance);

// Execute trade
const trade = await skill.handleAction('trade', {
  amount: 50,
  fromToken: 'USDC',
  toToken: 'ETH'
});

// Send funds
const send = await skill.handleAction('send', {
  amount: 10,
  token: 'USDC',
  toAddress: '0x...'
});
```

## Environment Variables

- `COINBASE_API_KEY` - Your Coinbase Developer Platform API key
- `COINBASE_API_SECRET` - Your API secret
- `AGENTIC_WALLET_NETWORK` - Network to use (base/ethereum/solana)
- `MAX_SESSION_SPEND` - Maximum spend per session (default: 100 USD)
- `MAX_SINGLE_TX` - Maximum per transaction (default: 50 USD)
- `DAILY_SPEND_LIMIT` - Daily spending cap (default: 500 USD)

## API Reference

### Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `balance` | Get wallet balance | none |
| `trade` | Execute token swap | `amount`, `fromToken`, `toToken`, `slippage` |
| `send` | Transfer tokens | `amount`, `token`, `toAddress`, `memo` |
| `history` | View transactions | `limit` |
| `config` | Update settings | `maxSessionSpend`, `maxSingleTx`, etc. |
| `dca_setup` | Configure DCA | `amount`, `fromToken`, `toToken`, `frequency` |
| `emergency_withdraw` | Emergency withdrawal | `safeAddress` |
| `kill_switch` | Disable all operations | none |

## Security

- Private keys stored in Coinbase's secure enclave (TEE)
- KYT (Know Your Transaction) screening
- Comprehensive audit logging
- Emergency kill switch

## Testing

```bash
npm test
```

## License

MIT © [Frank](https://github.com/Frankyfliu)
