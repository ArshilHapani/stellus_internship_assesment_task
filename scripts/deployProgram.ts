import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

import { CustomSplTokens } from "../target/types/custom_spl_tokens";
import { createAndMintToken, writeFileContent } from "../utils/helpers";
import keypair from "../utils/privateKey";
import { StakeTokens } from "../target/types/stake_tokens";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const admin = keypair;
const tokenMint = Keypair.generate(); // Generate a new token mint
const tokenMintATA = getAssociatedTokenAddressSync(
  tokenMint.publicKey,
  admin.publicKey
);

const MINT_AMOUNT = new anchor.BN(1000000); // Specify your mint amount here

const program = anchor.workspace
  .CustomSplTokens as anchor.Program<CustomSplTokens>;
const stakingProgram = anchor.workspace
  .StakeTokens as anchor.Program<StakeTokens>;
const APY = 10;
const minStakeDuration = new anchor.BN(365 * 24 * 60 * 60 * 1000); // 1 year

const adminTokenAccountATA = getAssociatedTokenAddressSync(
  tokenMint.publicKey,
  admin.publicKey
);

async function createTokenMintAndMintTokens() {
  // NOTE: Tokens are minted to the payer's associated token account
  console.log("Creating token mint and minting tokens...");
  await createAndMintToken(tokenMint, tokenMintATA, MINT_AMOUNT);
  writeFileContent("tokenMint.json", {
    tokenMintATA: tokenMintATA.toBase58(),
    programId: program.programId.toBase58(),
    tokenMint: {
      privateKey: tokenMint.secretKey.toString(),
      publicKey: tokenMint.publicKey.toBase58(),
    },
  });
  console.log(
    "Token mint and tokens minted successfully and saved to tokenMint.json ✅"
  );
}

async function initializePool() {
  console.log("Initializing pool...");
  const [stakingAccountPDA, bump] = PublicKey.findProgramAddressSync(
    [admin.publicKey.toBuffer(), Buffer.from("staking_account")],
    stakingProgram.programId
  );
  await stakingProgram.methods
    .initialize(bump, tokenMint.publicKey, APY, minStakeDuration)
    .accounts({
      // @ts-ignore
      stakingAccount: stakingAccountPDA,
      admin: admin.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  writeFileContent("stakingAccount.json", {
    stakingAccount: {
      privateKey: stakingAccountPDA.toBase58(),
      publicKey: stakingAccountPDA.toBase58(),
    },
  });
  console.log("Pool initialized successfully ✅");
}

async function fundPool() {
  console.log("Funding pool...");
  const initialFundReward = new anchor.BN(1000); // Specify your initial fund reward here
  const [stakingAccountPDA] = PublicKey.findProgramAddressSync(
    [admin.publicKey.toBuffer(), Buffer.from("staking_account")],
    stakingProgram.programId
  );
  const stakingAccountATA = getAssociatedTokenAddressSync(
    tokenMint.publicKey,
    stakingAccountPDA
  );

  await stakingProgram.methods
    .fundReward(initialFundReward)
    .accounts({
      admin: admin.publicKey,
      adminTokenAccount: adminTokenAccountATA,
      stakingAccount: stakingAccountPDA,
      stakingTokenAccount: stakingAccountATA,
    })
    .rpc();
  console.log("Pool funded successfully ✅");
}

(async function () {
  await createTokenMintAndMintTokens();
  await initializePool();
  await fundPool();
})();
