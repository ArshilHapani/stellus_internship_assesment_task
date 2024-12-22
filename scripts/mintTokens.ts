import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { mintToken } from "../utils/helpers";
import keypair from "../utils/privateKey";

const mintAddr = new PublicKey("F7zbU4Lqs1cBNX35o6NmuXXjoE2ri7Z9nsLjk7UvmwuV");
const admin = keypair;

const adminATA = getAssociatedTokenAddressSync(mintAddr, admin.publicKey);
const mintAmount = new anchor.BN(1000); // specify the amount to fund
(async function () {
  await mintToken(mintAddr, adminATA, mintAmount);
  console.log("Tokens minted successfully!✅");
})();
