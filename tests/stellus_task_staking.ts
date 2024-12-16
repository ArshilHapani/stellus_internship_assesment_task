import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { assert } from "chai";

import { StellusTaskStaking } from "../target/types/stellus_task_staking";
import keypair from "../utils/privateKey";

describe("stellus_task_staking", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .StellusTaskStaking as Program<StellusTaskStaking>;

  // Metaplex Constants
  const METADATA_SEED = "metadata";
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  // Constants from our program
  const MINT_SEED = "mint";

  // Data for our tests
  const payer = provider.wallet.publicKey;
  const metadata = {
    name: "Just a Test Token",
    symbol: "TEST",
    uri: "https://5vfxc4tr6xoy23qefqbj4qx2adzkzapneebanhcalf7myvn5gzja.arweave.net/7UtxcnH13Y1uBCwCnkL6APKsge0hAgacQFl-zFW9NlI",
    decimals: 9,
  };
  const mintAmount = 10;
  const [mint] = PublicKey.findProgramAddressSync(
    [Buffer.from(MINT_SEED)],
    program.programId
  );

  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(METADATA_SEED),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  // Test init token
  it("initialize", async () => {
    const info = await provider.connection.getAccountInfo(mint);
    if (info) {
      return; // Do not attempt to initialize if already initialized
    }
    console.log("  Mint not found. Attempting to initialize.");

    const context = {
      metadata: metadataAddress,
      mint,
      payer,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    };

    const tx = await program.methods
      .initToken(metadata)
      .accounts(context)
      .transaction();

    const txHash = await sendAndConfirmTransaction(
      provider.connection,
      tx,
      [keypair],
      { skipPreflight: true }
    );
    console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
    const newInfo = await provider.connection.getAccountInfo(mint);
    assert(newInfo, "  Mint should be initialized.");
  });

  // Test mint tokens
  it("mint tokens", async () => {
    const destination = anchor.utils.token.associatedAddress({
      mint: mint,
      owner: payer,
    });

    let initialBalance: number;
    try {
      const balance = await provider.connection.getTokenAccountBalance(
        destination
      );
      initialBalance = balance.value.uiAmount;
    } catch {
      // Token account not yet initiated has 0 balance
      initialBalance = 0;
    }

    const context = {
      mint,
      destination,
      payer,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    };

    const tx = await program.methods
      .mintTokens(new anchor.BN(mintAmount * 10 ** metadata.decimals))
      .accounts(context)
      .transaction();
    const txHash = await sendAndConfirmTransaction(
      provider.connection,
      tx,
      [provider.wallet.],
      { skipPreflight: true }
    );
    console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

    const postBalance = (
      await provider.connection.getTokenAccountBalance(destination)
    ).value.uiAmount;
    assert.equal(
      initialBalance + mintAmount,
      postBalance,
      "Post balance should equal initial plus mint amount"
    );
  });
});
