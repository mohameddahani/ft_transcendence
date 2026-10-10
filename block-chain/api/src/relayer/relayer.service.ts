import { Injectable } from '@nestjs/common';
import type { Response, Request } from 'express';
import 'dotenv/config';
import { getAddress, isHexString, verifyTypedData } from 'ethers';
import { Interface } from 'ethers';
import {
  FORWARDER_ABI,
  CHAIN_ID,
  FORWARDER_ADDRESS,
  GYMTOKEN_ABI,
} from './contract.js';
import { JsonRpcProvider } from 'ethers';
import { Contract } from 'ethers';
import { sign } from 'crypto';
import { Wallet } from 'ethers';
import { Signature } from 'ethers';

export type SignedForwardRequest = {
  from: string;
  to: string;
  value: string;
  gas: string;
  nonce: string;
  deadline: string;
  data: string;
  signature: string;
};

const uint = (value: unknown): bigint => {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error('Invalid unsigned integer');
  }
  return BigInt(value);
};

const allowedMethods = new Set([
  'paySubscription',
  'addProduct',
  'editProduct',
  'removeProduct',
  'buyProduct',
  'changeStatus',
]);

const forwardDomain = (address: string) => ({
  name: 'GymTokenForwarder',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: address,
});

const FORWARD_TYPES = {
  ForwardRequest: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint48' },
    { name: 'data', type: 'bytes' },
  ],
};

const gymInterface = new Interface(GYMTOKEN_ABI);

@Injectable()
export class relayerService {
  async relayer(res: Response, req: Request) {
    const Urpc = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.RELAYER_PRIVATE_KEY;
    const GymTokenAddress = process.env.GYMTOKEN_ADDRESS;
    const forwarderAddress = process.env.FORWARDER_ADDRESS;

    if (!Urpc || !privateKey || !GymTokenAddress || !forwarderAddress)
      return res
        .status(503)
        .json({ error: 'Gasless transactions are not configured.' });

    if (Number(req.get('content-length') ?? 0) > 16_384)
      return res.status(413).json({ error: 'Request is too large.' });

    let stage = 'request';
    try {
      const body = req.body as SignedForwardRequest;
      const from = getAddress(body.from);
      const to = getAddress(body.to);
      const value = uint(body.value);
      const gas = uint(body.gas);
      const nonce = uint(body.nonce);
      const deadline = uint(body.deadline);
      const now = BigInt(Math.floor(Date.now() / 1000));

      if (
        to !== getAddress(GymTokenAddress) ||
        value !== 0n ||
        gas < 5_000n ||
        gas > 500_000n ||
        deadline < now ||
        deadline > now + 900n ||
        deadline >= 2n ** 48n ||
        !isHexString(body.data) ||
        body.data.length < 10 ||
        body.data.length > 16_000 ||
        !isHexString(body.signature, 65)
      ) {
        throw new Error('Invalid forward request');
      }

      const method = gymInterface.getFunction(body.data.slice(0, 10));
      if (!method || !allowedMethods.has(method.name))
        throw new Error('Method is not sponsored');

      stage = 'signature';
      const signed = { from, to, value, gas, nonce, deadline, data: body.data };
      if (
        getAddress(
          verifyTypedData(
            forwardDomain(FORWARDER_ADDRESS),
            FORWARD_TYPES,
            signed,
            body.signature,
          ),
        ) !== from
      )
        throw new Error('Invalid signature');

      stage = 'rpc';
      const provider = new JsonRpcProvider(Urpc);
      if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID)
        throw new Error('Wrong network');

      stage = 'contracts';
      if (
        (await provider.getCode(GymTokenAddress)) === '0x' ||
        (await provider.getCode(FORWARDER_ADDRESS)) === '0x'
      )
        throw new Error('Contract missing');

      const gym = new Contract(GymTokenAddress, GYMTOKEN_ABI, provider);
      if (!(await gym.isTrustedForwarder(FORWARDER_ADDRESS)))
        throw new Error('GymToken does not trust forwarder');

      stage = 'relayer';
      const relayer = new Wallet(privateKey, provider);
      const forward_contract = new Contract(
        FORWARDER_ADDRESS,
        FORWARDER_ABI,
        relayer,
      );

      stage = 'nonce';
      if ((await forward_contract.nonces(from)) !== nonce)
        throw new Error('Nonce already used');

      const forwardRequest = {
        from,
        to,
        value,
        gas,
        deadline,
        data: body.data,
        signature: body.signature,
      };

      stage = 'verify';
      if (!(await forward_contract.verify(forwardRequest)))
        throw new Error('Forwarder rejected signature');
      stage = 'simulation';
      await forward_contract.execute.staticCall(forwardRequest);
      stage = 'estimate';
      const estimatedGas =
        await forward_contract.execute.estimateGas(forwardRequest);
      stage = 'submit';
      const tx = await forward_contract.execute(forwardRequest, {
        gasLimit: (estimatedGas * 12n) / 10n,
      });

      return res.json({ hash: tx.hash });
    } catch {
      const errors: Record<string, [string, number]> = {
        request: ['Invalid request or unsupported GymToken method.', 400],
        signature: ['The wallet signature does not match this call.', 400],
        rpc: [
          'SEPOLIA_RPC_URL is not a working Sepolia JSON-RPC endpoint.',
          503,
        ],
        contracts: [
          "Check both deployed addresses and GymToken's trusted forwarder.",
          503,
        ],
        relayer: ['RELAYER_PRIVATE_KEY is not a valid wallet key.', 503],
        nonce: [
          'The forwarder nonce could not be verified or was already used.',
          400,
        ],
        verify: ['The forwarder rejected this request.', 400],
        simulation: [
          'The contract call would fail. Check its inputs, balance, permissions and stock.',
          400,
        ],
        estimate: [
          'The call could not be estimated or exceeds the sponsored gas limit.',
          400,
        ],
        submit: [
          'The relayer could not submit the call. Check its Sepolia ETH balance and RPC access.',
          503,
        ],
      };
      const [error, status] = errors[stage];
      return res.status(status).json({ error: error });
    }
  }
}
