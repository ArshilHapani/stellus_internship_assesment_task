import * as anchor from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

import { StakeTokens } from "../target/types/stake_tokens";
import keypair from "../utils/privateKey";
import { createAndMintToken, transferTokens } from "../utils/helpers";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.StakeTokens as anchor.Program<StakeTokens>;

const admin = keypair; // Admin keypair for initializing the staking pool
const mintKeyPair = Keypair.generate(); // Token mint used for staking (address of the token mint ERC20 like)
const staker = Keypair.generate(); // User who will stake tokens
const mintAmount = new anchor.BN(100000); // Amount to mint and stake

const stakingAccountGlobalContextSeed = Buffer.from("staking_account");
const [stakingAccount, bump] = PublicKey.findProgramAddressSync(
  [stakingAccountGlobalContextSeed],
  program.programId
);
const initialReward = new anchor.BN(1000); // Initial reward amount
const adminTokenAccount = getAssociatedTokenAddressSync(
  mintKeyPair.publicKey,
  admin.publicKey
);
const stakerTokenAccount = getAssociatedTokenAddressSync(
  mintKeyPair.publicKey,
  staker.publicKey
);
const stakingTokenAccountKP = Keypair.generate();
const stakingTokenAccount = getAssociatedTokenAddressSync(
  mintKeyPair.publicKey,
  stakingTokenAccountKP.publicKey
);
const APY = 5;

describe("Test for staking tokens", function () {
  it("It should initialize the pool", async function () {
    await createAndMintToken(mintKeyPair, adminTokenAccount, mintAmount);
    await transferTokens(
      mintKeyPair,
      stakingTokenAccountKP.publicKey,
      adminTokenAccount,
      stakingTokenAccount,
      new anchor.BN(0)
    );
    const adminBalance = await provider.connection.getTokenAccountBalance(
      adminTokenAccount
    );
    assert(adminBalance.value.uiAmount === mintAmount.toNumber());

    const tx = await program.methods
      .initialize(bump, mintKeyPair.publicKey, APY)
      .accounts({
        // @ts-ignore
        stakingAccount,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Transaction signature", tx);
    console.log("Transaction success ✅");

    // Check if the admin has the minted token

    // ensures the staking pool is initialized and admin can fund the reward
    const stakingPool = await program.account.stakingAccount.fetch(
      stakingAccount
    );
    assert(stakingPool.adminRewardAmount.toNumber() === 0);

    await program.methods
      .fundReward(initialReward)
      .accounts({
        admin: admin.publicKey,
        adminTokenAccount,
        stakingAccount,
        stakingTokenAccount,
        // @ts-ignore
        token_program: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const stakingPoolAfterFunding = await program.account.stakingAccount.fetch(
      stakingAccount
    );
    assert(
      stakingPoolAfterFunding.adminRewardAmount.toNumber() ===
        initialReward.toNumber()
    );
  });

  it("It should stake the token", async function () {
    // ensure the staker has the token
    const adminBalance = await provider.connection.getTokenAccountBalance(
      adminTokenAccount
    );
    const transferAmount = new anchor.BN(2000);

    // transfer tokens to the staker
    await transferTokens(
      mintKeyPair,
      staker.publicKey,
      adminTokenAccount,
      stakerTokenAccount,
      transferAmount
    );
    const stakerBalance = await provider.connection.getTokenAccountBalance(
      stakerTokenAccount
    );

    assert(stakerBalance.value.uiAmount === transferAmount.toNumber());
    assert(adminBalance.value.uiAmount === mintAmount.toNumber());

    // stake the token
    const stakingAmount = new anchor.BN(1000);
    const previousStakerBalance =
      await provider.connection.getTokenAccountBalance(stakerTokenAccount);
    const previousPoolBalance =
      await provider.connection.getTokenAccountBalance(stakingTokenAccount);

    await program.methods
      .stake(stakingAmount)
      .accounts({
        stakingAccount,
        stakingTokenAccount,
        // @ts-ignore
        user: staker,
        userTokenAccount: stakerTokenAccount,
      })
      .rpc();

    const stakerBalanceAfterStaking =
      await provider.connection.getTokenAccountBalance(stakerTokenAccount);
    const poolBalanceAfterStaking =
      await provider.connection.getTokenAccountBalance(adminTokenAccount);

    assert(
      stakerBalanceAfterStaking.value.uiAmount ===
        previousStakerBalance.value.uiAmount - stakingAmount.toNumber()
    );
    assert(
      poolBalanceAfterStaking.value.uiAmount ===
        previousPoolBalance.value.uiAmount + stakingAmount.toNumber()
    );
  });
});
