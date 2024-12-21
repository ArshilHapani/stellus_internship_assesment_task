import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BN, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

import { CustomSplTokens } from "./constant";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBN(n: BN) {
  if (n instanceof BN) return n.toString();
  return String(n);
}

export function secondsToDay(n: number) {
  return n / (60 * 60 * 24);
}

export async function transferTokens(
  sender: PublicKey, // sender
  mintKeyPair: PublicKey, // token account
  recipientKeyPair: PublicKey, // receiver
  senderTokenAddress: PublicKey, // sender's ata
  recipientTokenAddress: PublicKey, // receiver's ata
  transferAmount: BN, // amount
  program: Program<CustomSplTokens> // token acc
) {
  await program.methods
    .transferToken(transferAmount)
    .accounts({
      sender: sender,
      recipient: recipientKeyPair,
      mintAccount: mintKeyPair,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      senderTokenAccount: senderTokenAddress,
      recipientTokenAccount: recipientTokenAddress,
    })
    .rpc();
}

export const getNetworkFromGenesisHash = async (connection: Connection) => {
  const genesisHash = await connection.getGenesisHash();

  switch (genesisHash) {
    case "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d":
      return "mainnet-beta";
    case "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG":
      return "devnet";
    case "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY":
      return "testnet";
    default:
      return "unknown";
  }
};

export function calculateRewards(
  amount: BN,
  startTime: BN,
  apy: number
): { daily: BN; cumulative: BN } {
  const now = new BN(Math.floor(Date.now() / 1000));
  const durationInDays = now.sub(startTime).div(new BN(86400)); // 86400 seconds in a day

  const dailyRate = new BN(Math.floor((apy / 365) * 10000)); // APY to daily rate, scaled by 10000 for precision
  const dailyReward = amount.mul(dailyRate).div(new BN(1000000)); // Divide by 1,000,000 to account for the 10000 scale and convert to percentage

  const cumulativeReward = dailyReward.mul(durationInDays);

  return { daily: dailyReward, cumulative: cumulativeReward };
}

export function formatDate(timestamp: BN): string {
  const date = new Date(timestamp.toNumber() * 1000);
  return date.toLocaleString();
}

export function calculateDuration(startTime: BN): string {
  const now = Math.floor(Date.now() / 1000);
  const durationInSeconds = now - startTime.toNumber();
  const days = Math.floor(durationInSeconds / 86400);
  const hours = Math.floor((durationInSeconds % 86400) / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}

export function formatPublicKey(publicKey: PublicKey): string {
  const key = publicKey.toBase58();
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function canRegularRedeem(
  startTime: BN,
  minStakingDuration: BN
): boolean {
  const now = new BN(Math.floor(Date.now() / 1000));
  const stakingDuration = now.sub(startTime);
  return stakingDuration.gte(minStakingDuration);
}
