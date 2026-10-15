import { Injectable } from '@nestjs/common';
import { JsonRpcProvider } from 'ethers';
import { Wallet } from 'ethers';
import type { Response, Request } from 'express';
import { CHAIN_ID, GYMTOKEN_ABI } from '../lib/contract.js';
import {
  Contract,
  ContractTransactionResponse,
  ContractTransactionReceipt,
} from 'ethers';

@Injectable()
export class rewardTokenSubService {
  async rewardClient(res: Response, req: Request) {
    const privateKey = process.env.RELAYER_PRIVATE_KEY;
    const Urpc = process.env.SEPOLIA_RPC_URL;
    const GymTokenAddress = process.env.GYMTOKEN_ADDRESS;
    const clientRecipient = '';
    const amountReward = process.env.AMOUNTREWARD;

    if (!Urpc || !privateKey || !GymTokenAddress)
      return res
        .status(503)
        .json({ error: 'reward transactions are not configured.' });

    let stage = 'rcp';
    try {
      const provider = new JsonRpcProvider(Urpc);
      if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID)
        throw new Error('Wrong network');

      stage = 'owner';
      const owner = new Wallet(privateKey, provider);
      const gymToken_contract = new Contract(
        GymTokenAddress,
        GYMTOKEN_ABI,
        owner,
      );

      stage = 'estimate';
      const estimatedGas =
        await gymToken_contract.rewardTokenSubscription.estimateGas(
          clientRecipient,
          amountReward,
        );

      stage = 'submit';
      const tx: ContractTransactionResponse =
        await gymToken_contract.rewardTokenSubscription(
          clientRecipient,
          amountReward,
          {
            gasLimit: (estimatedGas * 12n) / 10n,
          },
        );

      const receipt: ContractTransactionReceipt | null = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error('Reward transaction failed');
      }
      return {
        success: true,
        hash: receipt.hash,
      };
    } catch {
      const errors: Record<string, [string, number]> = {
        request: ['Invalid request or unsupported GymToken method.', 400],
        signature: ['The wallet signature does not match this call.', 400],
        rpc: [
          'SEPOLIA_RPC_URL is not a working Sepolia JSON-RPC endpoint.',
          503,
        ],
        owner: ['RELAYER_PRIVATE_KEY is not a valid wallet key.', 503],
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
