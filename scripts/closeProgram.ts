import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

import keypair from "../utils/privateKey";
import { StakeTokens } from "../target/types/stake_tokens";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
anchor.web3.PublicKey;

const admin = keypair; // Admin keypair for initializing the staking pool

//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// IMPORTANT CONSTANTS ////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

const program = anchor.workspace.StakeTokens as anchor.Program<StakeTokens>;
const programId = new PublicKey("7a8fBQMwbtE1C61fcGUW6quAgdqdmzYojha5cQq9Ju4q");

(async function () {
  try {
    await program.methods
      .close()
      .accounts({
        admin: admin.publicKey,
        accountToClose: programId,
      })
      .signers([admin])
      .rpc();
    console.log("Program closed successfully!✅");
  } catch (error) {
    console.log(error.message);
  }
})();

const arrayToBase58PrivateKey = (numbers) => {
  const bytes = new Uint8Array(numbers);
  // Convert to Base58
  const base58 = bs58.encode(bytes);
  return base58;
};
