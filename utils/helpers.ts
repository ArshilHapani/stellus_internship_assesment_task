import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { StakeTokens } from "../target/types/stake_tokens";

import { StellusTaskStaking } from "../target/types/stellus_task_staking";
import keypair from "../utils/privateKey";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace
  .StellusTaskStaking as anchor.Program<StellusTaskStaking>;
const payer = keypair;

const metadata = {
  name: "INTERVIEW",
  symbol: "ITW",
  uri: "https://bafkreic6kmxp2ndrkns3plteriluxpezhu53m736fskdjr5cisxn2yfxm4.ipfs.flk-ipfs.xyz",
};

export async function createMintToken(mintKeyPair: Keypair) {
  await program.methods
    .createTokenMint(
      0 /** 1 = 1 */,
      metadata.name,
      metadata.symbol,
      metadata.uri
    )
    .accounts({
      payer: payer.publicKey,
      mintAccount: mintKeyPair.publicKey,
    })
    .signers([mintKeyPair])
    .rpc();
}

export async function createAndMintToken(
  mintKeyPair: Keypair,
  ata: anchor.web3.PublicKey,
  mintAmount: anchor.BN
) {
  await createMintToken(mintKeyPair);
  await program.methods
    .mintToken(mintAmount)
    .accounts({
      mintAuthority: payer.publicKey,
      recipient: payer.publicKey,
      mintAccount: mintKeyPair.publicKey,
      // @ts-ignore
      associatedTokenAccount: ata,
    })
    .rpc();
}

export async function transferTokens(
  mintKeyPair: Keypair,
  recipientKeyPair: PublicKey,
  senderTokenAddress: anchor.web3.PublicKey,
  recipientTokenAddress: anchor.web3.PublicKey,
  transferAmount: anchor.BN
) {
  await program.methods
    .transferToken(transferAmount)
    .accounts({
      sender: payer.publicKey,
      recipient: recipientKeyPair,
      mintAccount: mintKeyPair.publicKey,
      // @ts-ignore
      senderTokenAccount: senderTokenAddress,
      recipientTokenAccount: recipientTokenAddress,
    })
    .rpc();
}

const stakeProgram = anchor.workspace
  .StakeTokens as anchor.Program<StakeTokens>;

async function getStakeInfo(
  program: Program,
  user: PublicKey,
  userStakeAccount: PublicKey,
  stakingAccount: PublicKey
): Promise<{ stakedAmount: number; reward: number }> {
  // Fetch UserStake account
  const userStake = await stakeProgram.account.userStake.fetch(
    userStakeAccount
  );

  // Fetch StakingAccount to get the reward rate
  const staking = await stakeProgram.account.stakingAccount.fetch(
    stakingAccount
  );

  const stakedAmount = userStake.amount.toNumber();
  const startTime = userStake.startTime.toNumber();
  const currentTime = Math.floor(Date.now() / 1000);

  const stakingDuration = currentTime - startTime; // Seconds
  const stakingDurationInDays = stakingDuration / (24 * 60 * 60);

  // Get reward rate from StakingAccount
  const rewardRate = staking.rewardRate;

  // Calculate reward
  const annualReward = stakedAmount * (rewardRate / 100);
  const dailyRewardRate = annualReward / 365;
  const reward = dailyRewardRate * stakingDurationInDays;

  return { stakedAmount, reward: Math.floor(reward) };
}
