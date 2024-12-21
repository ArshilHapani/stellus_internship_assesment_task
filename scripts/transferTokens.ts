import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import keypair from "../utils/privateKey";
import { transferTokens } from "../utils/helpers";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
anchor.web3.PublicKey;

const admin = keypair; // Admin keypair for initializing the staking pool

//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// IMPORTANT CONSTANTS ////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
const mintAddr = new PublicKey("F7zbU4Lqs1cBNX35o6NmuXXjoE2ri7Z9nsLjk7UvmwuV");
const recipientAddr = new PublicKey(
  "5KmTPuuGEwmvUiXFQNo9R8oJCj59cD797qjupATkVUe4"
);
const transferAmount = new anchor.BN(10); // specify the amount to transfer
const senderATA = getAssociatedTokenAddressSync(mintAddr, admin.publicKey);
const userATA = getAssociatedTokenAddressSync(mintAddr, recipientAddr);

(async function () {
  await transferTokens(
    mintAddr,
    recipientAddr,
    senderATA,
    userATA,
    transferAmount
  );
  console.log("Tokens transferred successfully!✅ ");
})();
