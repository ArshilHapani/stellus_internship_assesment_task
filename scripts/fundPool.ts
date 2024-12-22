import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { provider, stakeProgram, transferTokens } from "../utils/helpers";
import keypair from "../utils/privateKey";

const mintAddr = new PublicKey("F7zbU4Lqs1cBNX35o6NmuXXjoE2ri7Z9nsLjk7UvmwuV");
const admin = keypair;

const poolATA = getAssociatedTokenAddressSync(mintAddr, admin.publicKey);
const fundAmount = new anchor.BN(1000); // specify the amount to fund
(async function () {
  const [stakingAccountPDA] = PublicKey.findProgramAddressSync(
    [provider.wallet.publicKey.toBuffer(), Buffer.from("staking_account")],
    stakeProgram.programId
  );
  await stakeProgram.methods
    .fundReward(fundAmount)
    .accounts({
      admin: admin.publicKey,
      adminTokenAccount: poolATA,
      stakingAccount: stakingAccountPDA,
      stakingTokenAccount: poolATA,
    })
    .signers([admin])
    .rpc();
  console.log("Funded pool successfully!✅");
})();
