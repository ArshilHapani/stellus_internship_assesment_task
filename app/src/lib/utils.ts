import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BN, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

import { CustomSplTokens } from "./constant";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBN(n: BN) {
  return n.toString();
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
