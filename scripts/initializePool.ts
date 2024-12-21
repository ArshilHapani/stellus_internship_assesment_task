import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import keypair from "../utils/privateKey";
import { StakeTokens } from "../target/types/stake_tokens";
import { createAndMintToken, transferTokens } from "../utils/helpers";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.StakeTokens as anchor.Program<StakeTokens>;

const admin = keypair; // Admin keypair for initializing the staking pool
const mintKeyPair = Keypair.generate(); // Token mint used for staking (address of the token mint ERC20 like)
const stakingTokenAccountKP = Keypair.generate(); // account which is going to hold the funds
const mintAmount = new anchor.BN(100000); // Amount to mint and stake

const stakingAccountGlobalContextSeed = Buffer.from("staking_account");

const [stakingAccountPDA, bump] = PublicKey.findProgramAddressSync(
  [admin.publicKey.toBuffer(), stakingAccountGlobalContextSeed],
  program.programId
);
const adminTokenAccountATA = getAssociatedTokenAddressSync(
  mintKeyPair.publicKey,
  admin.publicKey
);
const stakingAccountATA = getAssociatedTokenAddressSync(
  mintKeyPair.publicKey,
  stakingTokenAccountKP.publicKey
);

const APY = 5;
const minStakingDurationForOneDayInSec = 1 * 24 * 60 * 60;
const minStakingDuration = new anchor.BN(minStakingDurationForOneDayInSec);

(async function () {
  // Check if account exists
  const accountInfo = await provider.connection.getAccountInfo(
    stakingAccountPDA
  );
  if (accountInfo !== null) {
    console.log(
      `Account already initialized! ${accountInfo.owner.toBase58()} id`
    );
    return;
  }

  await createAndMintToken(mintKeyPair, adminTokenAccountATA, mintAmount);
  await transferTokens(
    mintKeyPair.publicKey,
    stakingTokenAccountKP.publicKey,
    adminTokenAccountATA,
    stakingAccountATA,
    new anchor.BN(0)
  );
  await program.methods
    .initialize(bump, mintKeyPair.publicKey, APY, minStakingDuration)
    .accounts({
      // @ts-ignore
      stakingAccount: stakingAccountPDA,
      admin: admin.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Pool initialized");
})();
