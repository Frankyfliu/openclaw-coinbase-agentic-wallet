# Coinbase Agentic Wallet Skill

## Purpose
Enable OpenClaw AI agents to autonomously manage crypto assets, execute trades, and interact with DeFi protocols using Coinbase Agentic Wallets.

## Capabilities
- Create and manage Agentic Wallets on Base, Ethereum, and Solana
- Execute token swaps (gasless on Base)
- Send/receive USDC and other tokens
- Automated DeFi yield optimization
- Dollar-cost averaging (DCA) strategies
- Real-time portfolio monitoring

## Security Guardrails
- Hard spending limits enforced at infrastructure level
- Session caps and per-transaction limits
- KYT (Know Your Transaction) screening
- Private keys never exposed to agent or LLM
- All transactions logged with full audit trail

## Environment Variables Required
- COINBASE_API_KEY          # Coinbase Developer Platform API Key
- COINBASE_API_SECRET       # Coinbase Developer Platform API Secret
- AGENTIC_WALLET_NETWORK    # base | ethereum | solana (default: base)
- MAX_SESSION_SPEND         # Maximum per session (default: 100 USD)
- MAX_SINGLE_TX             # Maximum per transaction (default: 50 USD)
- DAILY_SPEND_LIMIT         # Daily spending cap (default: 500 USD)

## Optional Variables
- DEFAULT_SLIPPAGE          # Default slippage tolerance (default: 0.5%)
- ENABLE_AUTO_TRADE         # Enable autonomous trading (default: false)
- ALERT_THRESHOLD           # Balance alert threshold (default: 20 USD)

## Dependencies
- @coinbase/coinbase-sdk
- node-fetch
- winston (logging)

## Installation
```bash
npm install @coinbase/coinbase-sdk node-fetch winston
```

## Usage Examples
```
# Check wallet balance
/check balance

# Execute trade
/trade 50 USDC to ETH

# Set up DCA
/dca setup 10 USDC to ETH daily

# Send funds
/send 5 USDC to 0x1234...

# Configure limits
/config set max_tx 25

# View transaction history
/history --last 10
```

## Risk Levels
- **Low**: Balance queries, price checks, transaction history
- **Medium**: Token swaps under $50, transfers to known addresses
- **High**: Swaps over $50, new address transfers, protocol interactions

## Emergency Controls
- Kill switch: Instantly revoke all agent permissions
- Pause trading: Temporarily halt all transactions
- Emergency withdrawal: Transfer all funds to safe address
