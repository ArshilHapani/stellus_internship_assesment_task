import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export type StakingAccount = {
  admin: PublicKey;
  rewardRate: number;
  bump: number;
  tokenMint: PublicKey;
  adminRewardAmount: BN;
  minStakingDuration: BN;
};
