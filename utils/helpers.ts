import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

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

export const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000;

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
export async function getStakeInfo(
  user: PublicKey,
  userStakeAccount: PublicKey,
  stakingAccount: PublicKey
): Promise<{ stakedAmount: number; reward: number }> {
  try {
    // Fetch accounts
    const userStake = await stakeProgram.account.userStake.fetch(
      userStakeAccount
    );
    const staking = await stakeProgram.account.stakingAccount.fetch(
      stakingAccount
    );

    const stakedAmount = userStake.amount.toNumber();
    const startTime = userStake.startTime.toNumber(); // in milliseconds
    const currentTime = Date.now(); // in milliseconds

    // Validation
    if (startTime > currentTime) {
      throw new Error("Invalid start time");
    }
    if (stakedAmount <= 0) {
      return { stakedAmount, reward: 0 };
    }

    const stakingDuration = currentTime - startTime; // milliseconds
    const stakingDurationInDays = stakingDuration / (24 * 60 * 60 * 1000);

    const rewardRate = staking.rewardRate; // 5 for 5%

    // Reward calculation
    const annualReward = (stakedAmount * rewardRate) / 100;
    const dailyReward = annualReward / 365;
    const earnedReward = dailyReward * stakingDurationInDays;

    return {
      stakedAmount,
      reward: Math.floor(earnedReward),
    };
  } catch (error) {
    console.error("Error calculating stake info:", error);
    throw error;
  }
}

export async function initializeAta(
  mint: Keypair,
  sender: PublicKey,
  senderAta: PublicKey,
  receiverPk: PublicKey
): Promise<PublicKey> {
  const payer = provider.wallet.publicKey;
  const ata = getAssociatedTokenAddressSync(mint.publicKey, receiverPk);

  // dummy transaction
  await transferTokens(mint, receiverPk, sender, senderAta, new anchor.BN(0));
  return ata;
}

export async function airdrop(
  receiver: PublicKey,
  amount: number = 1 * LAMPORTS_PER_SOL
) {
  const signature = await provider.connection.requestAirdrop(
    receiver,
    1 * LAMPORTS_PER_SOL
  ); // 1 SOL
  await provider.connection.confirmTransaction(signature, "confirmed");
}

export async function printTransactionLogs(signature: string) {
  try {
    const transaction = await provider.connection.getTransaction(signature, {
      commitment: "confirmed",
    });

    if (!transaction) {
      console.log(`Transaction not found for signature: ${signature}`);
      return;
    }

    const logs = transaction.meta?.logMessages;

    if (logs) {
      console.log(`Logs for transaction ${signature}:`);
      logs.forEach((log, index) => {
        console.log(`${index + 1}: ${log}`);
      });
    } else {
      console.log(`No logs found for transaction ${signature}.`);
    }
  } catch (error) {
    console.error(`Error fetching transaction logs: ${error.message}`);
  }
}

export async function simulateTransaction(
  instructions: TransactionInstruction[],
  signers: anchor.web3.Keypair[] = []
): Promise<void> {
  try {
    const tx = new Transaction();
    tx.add(...instructions);

    // Partially sign the transaction with provided signers
    tx.feePayer = provider.wallet.publicKey;
    tx.recentBlockhash = (
      await provider.connection.getLatestBlockhash()
    ).blockhash;
    signers.forEach((signer) => tx.partialSign(signer));

    // Simulate the transaction
    const simulationResult = await provider.connection.simulateTransaction(tx);

    // Retrieve and print logs
    const logs = simulationResult.value?.logs;
    if (logs && logs.length > 0) {
      console.log("Transaction simulation logs:");
      logs.forEach((log, index) => {
        console.log(`${index + 1}: ${log}`);
      });
    } else {
      console.log("No logs available from the simulation.");
    }

    // Handle errors in simulation
    if (simulationResult.value?.err) {
      console.error("Simulation error:", simulationResult.value.err);
    }
  } catch (error) {
    console.error("Error simulating transaction:", error);
  }
}
