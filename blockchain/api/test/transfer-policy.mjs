// Exercise the real relayer with signed requests and a local fake RPC. Never broadcasts.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Interface, Wallet, ZeroAddress } from 'ethers';
let rpcCalls = 0;
const server = createServer(async (req, res) => {
  let input = ''; for await (const chunk of req) input += chunk;
  const payload = JSON.parse(input);
  const reply = call => { rpcCalls++; return { jsonrpc: '2.0', id: call.id, result: call.method === 'eth_chainId' ? '0xaa36a7' : '0x' }; };
  res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(Array.isArray(payload) ? payload.map(reply) : reply(payload)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
process.env.SEPOLIA_RPC_URL = `http://127.0.0.1:${server.address().port}`;
process.env.RELAYER_PRIVATE_KEY = Wallet.createRandom().privateKey;
process.env.GYMTOKEN_ADDRESS = Wallet.createRandom().address;
process.env.FORWARDER_ADDRESS = Wallet.createRandom().address;
const { relayerService } = await import('../dist/relayer/relayer.service.js');
const { GYMTOKEN_ABI } = await import('../dist/lib/contract.js');
const abi = new Interface([...GYMTOKEN_ABI, 'function paySubscription(address,uint256)']);
const owner = Wallet.createRandom(), recipient = Wallet.createRandom().address;
const types = { ForwardRequest: [
  { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
  { name: 'gas', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint48' }, { name: 'data', type: 'bytes' },
] };
async function request(method, args, tamper = false) {
  const body = { from: owner.address, to: process.env.GYMTOKEN_ADDRESS, value: '0', gas: '200000', nonce: '0', deadline: String(Math.floor(Date.now() / 1000) + 300), data: abi.encodeFunctionData(method, args) };
  body.signature = await owner.signTypedData({ name: 'GymTokenForwarder', version: '1', chainId: 11155111, verifyingContract: process.env.FORWARDER_ADDRESS }, types, body);
  if (tamper) body.data = abi.encodeFunctionData('transfer', [Wallet.createRandom().address, 10n]);
  const response = { code: 200, body: null, status(value) { this.code = value; return this; }, json(value) { this.body = value; return this; } };
  await new relayerService().relayer(response, { body, get: () => undefined });
  return response;
}
try {
  for (const [method, args] of [
    ['paySubscription', [recipient, 1n]], ['transfer', [ZeroAddress, 1n]], ['transfer', [recipient, 0n]],
    ['transferFrom', [owner.address, recipient, 1n]], ['rewardTokenSubscription', [recipient, 3n]],
  ]) { const result = await request(method, args); assert.equal(result.code, 400); assert.match(result.body.error, /unsupported/); }
  assert.equal(rpcCalls, 0);
  const tampered = await request('transfer', [recipient, 1n], true);
  assert.equal(tampered.code, 400); assert.match(tampered.body.error, /signature/); assert.equal(rpcCalls, 0);
  const accepted = await request('transfer', [recipient, 1n]);
  assert.equal(accepted.code, 503); assert.match(accepted.body.error, /deployed addresses/);
  assert(rpcCalls > 0, 'Valid signed transfer passes policy/signature checks and reaches the fake RPC');
  console.log('PASS: signed transfers allowed; zero recipient/amount, altered signatures, subscription payments, transferFrom and rewards rejected.');
} finally { await new Promise(resolve => server.close(resolve)); }
