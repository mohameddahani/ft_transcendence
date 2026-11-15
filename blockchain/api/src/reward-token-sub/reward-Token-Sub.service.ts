import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import {
  Contract,
  FetchRequest,
  JsonRpcProvider,
  Wallet,
  ZeroAddress,
  getAddress,
  isAddress,
} from 'ethers';
import type { ContractTransactionResponse } from 'ethers';
import { CHAIN_ID, GYMTOKEN_ABI } from '../lib/contract.js';

const FORWARDER_ABI = [
  'function nonces(address) view returns (uint256)',
  'function execute((address from,address to,uint256 value,uint256 gas,uint48 deadline,bytes data,bytes signature) request) payable',
];
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

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class rewardTokenSubService {
  private readonly logger = new Logger(rewardTokenSubService.name);
  constructor(private readonly prisma: PrismaService) {}

  async rewardClient(secret: string | undefined, body: unknown) {
    //DTO
    const expected = process.env.REWARD_INTERNAL_SECRET;
    if (!expected || expected.length < 32)
      throw new ServiceUnavailableException(
        'Internal reward secret must contain at least 32 characters',
      );
    if (
      !secret ||
      Buffer.byteLength(secret) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
    ) {
      throw new UnauthorizedException('Invalid internal reward credentials');
    }
    const data = body as {
      membershipId?: unknown;
      clientWallet?: unknown;
    } | null;
    if (
      !data ||
      typeof data.membershipId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        data.membershipId,
      ) ||
      typeof data.clientWallet !== 'string' ||
      !isAddress(data.clientWallet) ||
      getAddress(data.clientWallet) === ZeroAddress
    ) {
      throw new BadRequestException(
        'A purchased membership ID and valid member wallet are required',
      );
    }
    const membershipId = data.membershipId.toLowerCase();
    if (
      !process.env.SEPOLIA_RPC_URL ||
      !process.env.REWARD_OWNER_PRIVATE_KEY ||
      !process.env.GYMTOKEN_ADDRESS ||
      !process.env.FORWARDER_ADDRESS
    ) {
      throw new ServiceUnavailableException(
        'Reward chain configuration is missing',
      );
    }

    try {
      // Commit the reservation BEFORE contacting the chain. The primary key,
      // not a preceding SELECT, decides which concurrent request may send.
      const claim = await this.create(membershipId);
      if (claim.count === 0) {
        const existing = await this.prisma.membershipReward.findUniqueOrThrow({
          where: { membershipId },
        });
        return {
          membershipId,
          rewarded: existing.rewarded,
          alreadyExists: true,
          message: existing.rewarded
            ? 'This membership was already rewarded.'
            : 'Reward already claimed; it may be processing or need manual review. No new reward was sent.',
        };
      }
    } catch (error) {
      this.logger.error(
        `Membership ${membershipId}: reward database claim failed: ${this.errorSummary(error)}`,
      );
      throw new ServiceUnavailableException({
        membershipId,
        message:
          'Could not reserve or check this membership. No blockchain reward was sent by this request. Retry using the same membership ID.',
      });
    }

    let hash: string | undefined;
    try {
      hash = await this.withOwnerLock(() =>
        this.sendReward(membershipId, getAddress(data.clientWallet as string)),
      );
      await this.update(membershipId);
      return { membershipId, rewarded: true, alreadyExists: false, hash };
    } catch (error) {
      this.logger.warn(
        `Membership ${membershipId}: ${hash ? `transaction ${hash} confirmed, database update failed` : 'reward attempt failed or is uncertain'}: ${this.errorSummary(error)}. The ID remains reserved.`,
      );
      throw new ServiceUnavailableException({
        membershipId,
        rewarded: false,
        hash,
        message: hash
          ? 'Reward confirmed on-chain, but its database flag could not be updated. Do not send another reward; manual review is required.'
          : 'Reward not confirmed. The membership ID remains reserved; check the transaction manually before taking further action.',
      });
    }
  }

  async create(membershipId: string) {
    return this.prisma.membershipReward.createMany({
      data: [{ membershipId }],
      skipDuplicates: true,
    });
  }

  async update(membershipId: string) {
    return this.prisma.membershipReward.updateMany({
      where: { membershipId, rewarded: false },
      data: { rewarded: true },
    });
  }

  private async withOwnerLock<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        // Allow a normal reward (three confirmations) to finish before the
        // next membership uses the owner wallet.
        await tx.$executeRaw`SET LOCAL lock_timeout = 120000`;
        await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(71482041)`;
        return await work();
      },
      { maxWait: 5000, timeout: 360_000 },
    );
  }

  private errorSummary(error: unknown): string {
    if (!(error instanceof Error)) return 'Unknown error';
    const details = error as Error & { code?: string; shortMessage?: string };
    let message = `${details.code ?? details.name}: ${details.shortMessage ?? details.message}`;
    for (const name of [
      'REWARDS_DATABASE_URL',
      'SEPOLIA_RPC_URL',
      'REWARD_OWNER_PRIVATE_KEY',
      'REWARD_INTERNAL_SECRET',
    ]) {
      const secret = process.env[name];
      if (secret) message = message.replaceAll(secret, '[redacted]');
    }
    return message.slice(0, 1500);
  }

  async sendReward(membershipId: string, recipient: string) {
    const rpc = process.env.SEPOLIA_RPC_URL;
    const key = process.env.REWARD_OWNER_PRIVATE_KEY;
    const tokenAddress = process.env.GYMTOKEN_ADDRESS;
    const forwarderAddress = process.env.FORWARDER_ADDRESS;

    if (!rpc || !key || !tokenAddress || !forwarderAddress)
      throw new Error('Reward chain configuration is missing');

    const request = new FetchRequest(rpc);
    request.timeout = 10000;
    const provider = new JsonRpcProvider(request);

    try {
      if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID)
        throw new Error('Wrong network');

      const owner = new Wallet(key, provider);
      const token = new Contract(tokenAddress, GYMTOKEN_ABI, owner);
      if (getAddress((await token.owner()) as string) !== owner.address)
        throw new Error('Reward signer must own GymToken');

      const forwarder = new Contract(forwarderAddress, FORWARDER_ABI, owner);
      if (!(await token.isTrustedForwarder(await forwarder.getAddress())))
        throw new Error('Untrusted forwarder');

      const nonce = await provider.getTransactionCount(
        owner.address,
        'pending',
      );
      if (
        nonce !== (await provider.getTransactionCount(owner.address, 'latest'))
      )
        throw new Error('Owner already has a pending transaction');

      const forwardRequest = {
        from: owner.address,
        to: await token.getAddress(),
        value: 0n,
        gas: 200000n,
        nonce: (await forwarder.nonces(owner.address)) as bigint,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
        data: token.interface.encodeFunctionData('rewardTokenSubscription', [
          recipient,
          3n,
        ]),
      };
      const signature = await owner.signTypedData(
        {
          name: 'GymTokenForwarder',
          version: '1',
          chainId: CHAIN_ID,
          verifyingContract: await forwarder.getAddress(),
        },
        FORWARD_TYPES,
        forwardRequest,
      );
      const { nonce: forwardNonce, ...call } = forwardRequest;
      void forwardNonce;
      const payload = { ...call, signature };
      const gas = await forwarder.execute.estimateGas(payload);
      const tx: ContractTransactionResponse = await forwarder.execute(payload, {
        nonce,
        gasLimit: (gas * 12n) / 10n,
      });
      this.logger.log(
        `Membership ${membershipId}: reward transaction ${tx.hash}`,
      );
      const receipt = await tx.wait(3, 60000);
      if (!receipt || receipt.status !== 1)
        throw new Error('Reward transaction not confirmed');
      return receipt.hash;
    } finally {
      provider.destroy();
    }
  }
}
