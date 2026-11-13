# Sending GymToken

Member and club-admin marketplace screens have a **Send G** tab. Enter the recipient's Sepolia wallet and a positive token amount, review both, and confirm the wallet signature. The shared `useTokenTransfer` hook checks the address, decimal precision, current balance, wallet account and network before submitting.

Transfers call the existing ERC-20 `transfer(recipient, amount)` through the trusted forwarder. The connected holder signs; the relayer pays gas. The contract debits the signing holder's balance using ERC2771 context. No contract redeployment or new environment variables are required.

The relayer now sponsors `transfer` and rejects `paySubscription`. The member marketplace no longer fetches plans or displays a subscription payment selector. Memberships remain managed by gym admins. Sending G does not create a membership, record a subscription payment, or issue a subscription reward.

The form prevents repeated clicks while submitting. Once the relayer returns a hash, the UI keeps it and offers a confirmation-status check if the receipt wait times out. Checking status does not submit another transfer. This UI state lasts while the marketplace page remains mounted; use the transaction link or wallet activity to check the outcome after a reload or a lost relayer response before submitting again.

Rebuild/recreate the `frontend` and `blockchain` Compose services together so the new UI and relayer allowlist agree. The old deployed contract method still exists on-chain; removing it from sponsorship does not remove it from an already-deployed contract.

Offline checks:

- With frontend dependencies installed: `node test/token-transfer.cjs`.
- In `blockchain/api`, after `npm run build`: `node test/transfer-policy.mjs`.

These tests use mocked wallet/chain operations or a local fake RPC. They do not transfer tokens or spend gas.
