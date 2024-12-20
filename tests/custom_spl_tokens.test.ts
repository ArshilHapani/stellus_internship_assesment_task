import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { assert } from "chai";

import { CustomSplTokens } from "../target/types/custom_spl_tokens";
import keypair from "../utils/privateKey";
import {
  createAndMintToken,
  createMintToken,
  transferTokens,
} from "../utils/helpers";

//////////////////////////////////////////////////
///////// HELPER CONSTANTS AND FUNCTIONS /////////
//////////////////////////////////////////////////

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace
  .CustomSplTokens as anchor.Program<CustomSplTokens>;
const payer = keypair;
const mintAmount = new anchor.BN(1000);

const metadata = {
  name: "INTERVIEW",
  symbol: "ITW",
  uri: "https://bafkreic6kmxp2ndrkns3plteriluxpezhu53m736fskdjr5cisxn2yfxm4.ipfs.flk-ipfs.xyz",
};

//////////////////////////////////////////////////
///////////////////// TESTS /////////////////////
//////////////////////////////////////////////////

describe("Create token", function () {
  it("Should create an SPL token", async function () {
    const mintKeyPair = Keypair.generate();
    const transactionSign = await program.methods
      .createTokenMint(9, metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        payer: payer.publicKey,
        mintAccount: mintKeyPair.publicKey,
      })
      .signers([mintKeyPair])
      .rpc();
    console.log("Success ✅");
    console.log("Transaction Signature: ", transactionSign);
  });

  it("Should create an NFT", async function () {
    const mintKeyPair = Keypair.generate();

    const transactionSign = await program.methods
      .createTokenMint(0, metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        payer: payer.publicKey,
        mintAccount: mintKeyPair.publicKey,
      })
      .signers([mintKeyPair])
      .rpc();

    console.log("Success ✅");
    console.log("Transaction Signature: ", transactionSign);
  });

  it("Should mint some token in your wallet", async function () {
    const mintKeyPair = Keypair.generate();

    // creating token mint
    await createMintToken(mintKeyPair);

    const associatedTokenAccount = getAssociatedTokenAddressSync(
      mintKeyPair.publicKey,
      payer.publicKey
    );

    const transactionSignature = await program.methods
      .mintToken(mintAmount)
      .accounts({
        mintAuthority: payer.publicKey,
        recipient: payer.publicKey,
        mintAccount: mintKeyPair.publicKey,
        // @ts-ignore
        associatedTokenAccount: associatedTokenAccount,
      })
      .rpc();

    const beforeBalance =
      await program.provider.connection.getTokenAccountBalance(
        associatedTokenAccount
      );

    assert.equal(beforeBalance.value.uiAmount, 1000);

    console.log("Success ✅");
  });

  it("transfer tokens!", async function () {
    const mintKeyPair = Keypair.generate();
    const recipientKeyPair = Keypair.generate();

    const senderTokenAddress = getAssociatedTokenAddressSync(
      mintKeyPair.publicKey,
      payer.publicKey
    );

    const recipientTokenAddress = getAssociatedTokenAddressSync(
      mintKeyPair.publicKey,
      recipientKeyPair.publicKey
    );

    await createAndMintToken(mintKeyPair, senderTokenAddress, mintAmount);

    const transferAmount = new anchor.BN(100);

    // creating spl token and minting token

    await program.methods
      .transferToken(transferAmount)
      .accounts({
        sender: payer.publicKey,
        recipient: recipientKeyPair.publicKey,
        mintAccount: mintKeyPair.publicKey,
        // @ts-ignore
        senderTokenAccount: senderTokenAddress,
        recipientTokenAccount: recipientTokenAddress,
      })
      .rpc();

    const senderBalance =
      await program.provider.connection.getTokenAccountBalance(
        senderTokenAddress
      );
    const recipientBalance =
      await program.provider.connection.getTokenAccountBalance(
        recipientTokenAddress
      );

    assert.equal(senderBalance.value.uiAmount, 900);
    assert.equal(recipientBalance.value.uiAmount, 100);
  });

  it("Should transfer token using functions", async function () {
    const mintKeyPair = Keypair.generate();
    const recipientKeyPair = Keypair.generate();
    const senderTokenAddress = getAssociatedTokenAddressSync(
      mintKeyPair.publicKey,
      payer.publicKey
    );
    const recipientTokenAddress = getAssociatedTokenAddressSync(
      mintKeyPair.publicKey,
      recipientKeyPair.publicKey
    );
    await createAndMintToken(mintKeyPair, senderTokenAddress, mintAmount);
    const transferAmount = new anchor.BN(100);
    await transferTokens(
      mintKeyPair,
      recipientKeyPair.publicKey,
      senderTokenAddress,
      recipientTokenAddress,
      transferAmount
    );
    const senderBalance =
      await program.provider.connection.getTokenAccountBalance(
        senderTokenAddress
      );
    const recipientBalance =
      await program.provider.connection.getTokenAccountBalance(
        recipientTokenAddress
      );
    assert.equal(senderBalance.value.uiAmount, 900);
    assert.equal(recipientBalance.value.uiAmount, 100);
  });
});
