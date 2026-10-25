# Gasless product purchases

1. Open [contracts/GymToken.sol](contracts/GymToken.sol) in Remix, compile it with Solidity 0.8.34 or newer, and deploy it on Sepolia. Remix resolves the OpenZeppelin imports.
2. Copy `.env.example` to `.env.local`. Put the **new** contract address in `NEXT_PUBLIC_GYMTOKEN_ADDRESS`, a Sepolia **JSON-RPC endpoint** in `SEPOLIA_RPC_URL`, and a funded sponsor wallet key in `RELAYER_PRIVATE_KEY`. The Etherscan explorer URL is not a JSON-RPC endpoint. Keep the key server-side. Restart the Next.js app after changing these values.
3. Mint G to customers and add merchant products on the new contract. The old contract's balances and products do not migrate automatically.

The customer signs a five-minute EIP-712 order; the relayer submits it and pays ETH gas. The contract takes G from the customer and sends it to the merchant. The signature fixes the merchant, product, quantity and maximum total price, and a nonce prevents replay.

Only product purchases are gasless. Subscription payments and merchant actions still need Sepolia ETH. Before opening the relayer to the public, add shared rate limiting or an eligibility check so repeated valid orders cannot exhaust the sponsor wallet.
