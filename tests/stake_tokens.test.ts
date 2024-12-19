import * as anchor from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { assert } from "chai";

import type { StakeTokens } from "../target/types/stake_tokens";
import keypair from "../utils/privateKey";
import {
  airdrop,
  createAndMintToken,
  getStakeInfo,
  oneYearInMilliseconds,
  printTransactionLogs,
  simulateTransaction,
  transferTokens,
} from "../utils/helpers";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.StakeTokens as anchor.Program<StakeTokens>;

const admin = keypair; // Admin keypair for initializing the staking pool
const mintKeyPair = Keypair.generate(); // Token mint used for staking (address of the token mint ERC20 like)
const staker = Keypair.generate(); // User who will stake tokens
const stakingTokenAccountKP = Keypair.generate(); // account which is going to hold the funds
const mintAmount = new anchor.BN(100000); // Amount to mint and stake

const stakingAccountGlobalContextSeed = Buffer.from("staking_account");
const userStakeAccountLocalContextSeed = Buffer.from("user_stake");

const [stakingAccountPDA, bump] = PublicKey.findProgramAddressSync(
  [stakingAccountGlobalContextSeed],
  program.programId
);
const [userStakeAccountPDA] = PublicKey.findProgramAddressSync(
  [staker.publicKey.toBuffer(), userStakeAccountLocalContextSeed],
  program.programId
);

const adminTokenAccountATA = getAssociatedTokenAddressSync(
  mintKeyPair.publicKey,
  admin.publicKey
);
const stakerTokenAccountATA = getAssociatedTokenAddressSync(
  mintKeyPair.publicKey,
  staker.publicKey
);
const stakingAccountATA = getAssociatedTokenAddressSync(
  mintKeyPair.publicKey,
  stakingTokenAccountKP.publicKey
);

const initialFundReward = new anchor.BN(500); // Initial reward amount
const APY = 5;
// 1 year in seconds
const minStakingDuration = new anchor.BN(1 * 365 * 24 * 60 * 60);

const oneYearBeforeTimeStamp = new anchor.BN(
  new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime()
);

describe("Test for staking tokens", function () {
  it("It should initialize the pool (`initialize` instruction test)", async function () {
    await createAndMintToken(mintKeyPair, adminTokenAccountATA, mintAmount);
    await transferTokens(
      mintKeyPair,
      stakingTokenAccountKP.publicKey,
      adminTokenAccountATA,
      stakingAccountATA,
      new anchor.BN(0)
    );

    const adminBalance = await provider.connection.getTokenAccountBalance(
      adminTokenAccountATA
    );
    assert(adminBalance.value.uiAmount === mintAmount.toNumber());

    await program.methods
      .initialize(bump, mintKeyPair.publicKey, APY, minStakingDuration)
      .accounts({
        // @ts-ignore
        stakingAccount: stakingAccountPDA,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // ensures the staking pool is initialized and admin can fund the reward
    const stakingPool = await program.account.stakingAccount.fetch(
      stakingAccountPDA
    );
    assert(stakingPool.adminRewardAmount.toNumber() === 0);
    assert(stakingPool.bump == bump);
    assert(stakingPool.rewardRate == APY);
    assert(
      stakingPool.tokenMint.toBase58() == mintKeyPair.publicKey.toBase58()
    );
  });

  it("It should add the funds to pool (`fund_reward` instruction test)", async function () {
    const initialStakingTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(stakingAccountATA);
    assert(initialStakingTokenAccountBalance.value.uiAmount == 0);

    await program.methods
      .fundReward(initialFundReward)
      .accounts({
        admin: admin.publicKey,
        adminTokenAccount: adminTokenAccountATA,
        stakingAccount: stakingAccountPDA,
        stakingTokenAccount: stakingAccountATA,
      })
      .rpc();

    const afterStakingTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(stakingAccountATA);
    assert(
      afterStakingTokenAccountBalance.value.uiAmount ==
        initialFundReward.toNumber()
    );
  });

  it("It should stake the user's token (`stake` instruction)", async function () {
    const transferAmount = new anchor.BN(2000);
    await transferTokens(
      mintKeyPair,
      staker.publicKey,
      adminTokenAccountATA,
      stakerTokenAccountATA,
      transferAmount
    );

    const stakerBalanceAfter = await provider.connection.getTokenAccountBalance(
      stakerTokenAccountATA
    );
    assert(stakerBalanceAfter.value.uiAmount === transferAmount.toNumber());

    const prevStakingTokenATAAccountBalance =
      await provider.connection.getTokenAccountBalance(stakingAccountATA);
    assert(
      prevStakingTokenATAAccountBalance.value.uiAmount ===
        initialFundReward.toNumber()
    );
    const stakingAmount = new anchor.BN(1000);
    // requesting air drop for the staker's account
    await airdrop(staker.publicKey); // 1 SOL airdrop

    await program.methods
      .stake(stakingAmount, oneYearBeforeTimeStamp)
      .accounts({
        stakingAccount: stakingAccountPDA,
        stakingTokenAccount: stakingAccountATA,
        user: staker.publicKey,
        userTokenAccount: stakerTokenAccountATA,
        // @ts-ignore
        userStake: userStakeAccountPDA,
      })
      .signers([staker])
      .rpc();

    const stakerBalance = await provider.connection.getTokenAccountBalance(
      stakerTokenAccountATA
    );
    const stakingPoolBalance = await provider.connection.getTokenAccountBalance(
      stakingAccountATA
    );
    const userStake = await program.account.userStake.fetch(
      userStakeAccountPDA
    );

    assert(userStake.amount.toNumber() === stakingAmount.toNumber());
    assert(
      userStake.startTime.toNumber() === oneYearBeforeTimeStamp.toNumber()
    );
    assert(
      stakerBalance.value.uiAmount ===
        transferAmount.toNumber() - stakingAmount.toNumber()
    );
    assert(
      stakingPoolBalance.value.uiAmount ===
        initialFundReward.toNumber() + stakingAmount.toNumber()
    );
  });

  it("It should redeem the staked amount (`redeem` instruction)", async function () {
    const userStake = await program.account.userStake.fetch(
      userStakeAccountPDA
    );

    // difference must be >= one year
    const currentTimeStamp = Date.now();

    assert(
      currentTimeStamp - userStake.startTime.toNumber() >=
        oneYearInMilliseconds,
      "The difference between timestamps must be at least 1 year"
    );

    const { stakedAmount, reward } = await getStakeInfo(
      staker.publicKey,
      userStakeAccountPDA,
      stakingAccountPDA
    );
    const beforeRedeemStakerBalance =
      await provider.connection.getTokenAccountBalance(stakerTokenAccountATA);
    const stakingAccount = await program.account.stakingAccount.fetch(
      stakingAccountPDA
    );
    console.log("Staking Account:", {
      tokenMint: stakingAccount.tokenMint.toBase58(),
      adminRewardAmount: stakingAccount.adminRewardAmount.toString(),
    });

    // Verify account ownership and data
    console.log("Account Keys:", {
      user: staker.publicKey.toBase58(),
      userTokenAccount: stakerTokenAccountATA.toBase58(),
      stakingTokenAccountOwner: stakingTokenAccountKP.publicKey.toBase58(),
      stakingTokenAccount: stakingAccountATA.toBase58(),
      stakingAccount: stakingAccountPDA.toBase58(),
    });

    const instructions = await program.methods
      .redeem(false) // force redeem
      .accounts({
        stakingAccount: stakingAccountPDA,
        // @ts-ignore
        userStake: userStakeAccountPDA,
        user: staker.publicKey,
        userTokenAccount: stakerTokenAccountATA,
        stakingTokenAccount: stakingAccountATA,
        stakingTokenAccountOwner: stakingTokenAccountKP.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([staker, stakingTokenAccountKP])
      .rpc();

    // await simulateTransaction([instructions], [staker, stakingTokenAccountKP]);

    const stakerBalanceAfterRedeem =
      await provider.connection.getTokenAccountBalance(stakerTokenAccountATA);
    console.log(
      "Staker Balance After Redeem:",
      stakerBalanceAfterRedeem.value.uiAmount
    );
    console.log(
      "Staker Balance Before Redeem:",
      beforeRedeemStakerBalance.value.uiAmount
    );

    assert(
      stakerBalanceAfterRedeem.value.uiAmount ==
        beforeRedeemStakerBalance.value.uiAmount + reward + stakedAmount
    );
  });
});
