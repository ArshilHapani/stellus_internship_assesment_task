import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";

import { CustomSplTokens } from "../target/types/custom_spl_tokens";
import {
  createAndMintToken,
  metadata,
  writeFileContent,
} from "../utils/helpers";
import keypair from "../utils/privateKey";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const admin = keypair;
const tokenMint = Keypair.generate(); // Generate a new token mint
const tokenMintATA = getAssociatedTokenAddressSync(
  tokenMint.publicKey,
  admin.publicKey
);

const MINT_AMOUNT = new anchor.BN(10000000); // Specify your mint amount here

const program = anchor.workspace
  .CustomSplTokens as anchor.Program<CustomSplTokens>;

console.log({
  program: program.provider.publicKey.toBase58(),
  tokenMint: tokenMint.publicKey.toBase58(),
  tokenMintATA: tokenMintATA.toBase58(),
  payer: admin.publicKey.toBase58(),
});
const connection = program.provider.connection;
(async function () {
  await program.methods
    .createTokenMint(
      0 /** 1 = 1 */,
      metadata.name,
      metadata.symbol,
      metadata.uri
    )
    .accounts({
      payer: admin.publicKey,
      mintAccount: tokenMint.publicKey,
    })
    .signers([admin, tokenMint])
    .rpc();
  await program.methods
    .mintToken(MINT_AMOUNT)
    .accounts({
      mintAuthority: admin.publicKey,
      recipient: admin.publicKey,
      mintAccount: tokenMint.publicKey,
      // @ts-ignore
      associatedTokenAccount: tokenMintATA,
    })
    .signers([admin])
    .rpc();

  const fileContent = {
    tokenMintATA: tokenMintATA.toBase58(),
    programId: program.programId.toBase58(),
    tokenMint: {
      privateKey: tokenMint.secretKey.toString(),
      publicKey: tokenMint.publicKey,
    },
  };
  console.log("Writing meta to file `meta.json`⏳");
  writeFileContent("meta.json", fileContent);
  console.log("File content updated successfully ☑️");
})();
