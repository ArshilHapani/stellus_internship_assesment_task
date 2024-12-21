import * as anchor from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

import type { StakeTokens } from "../target/types/stake_tokens";
import keypair from "../utils/privateKey";
import {
  airdrop,
  createAndMintToken,
  getStakeInfo,
  oneYearInMilliseconds,
  transferTokens,
} from "../utils/helpers";

//////////////////////////////////////////////////
///////// HELPER CONSTANTS AND FUNCTIONS /////////
//////////////////////////////////////////////////

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

// initialize id must be random number type between 0 and 255
// const initialize_id = Math.floor(Math.random() * 255).toString();

const [stakingAccountPDA, bump] = PublicKey.findProgramAddressSync(
  [admin.publicKey.toBuffer(), stakingAccountGlobalContextSeed],
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

//////////////////////////////////////////////////
///////////////////// TESTS /////////////////////
//////////////////////////////////////////////////

describe("Test for staking tokens", function () {
  it("It should initialize the pool (`initialize` instruction test)", async function () {
    await createAndMintToken(mintKeyPair, adminTokenAccountATA, mintAmount);
    await transferTokens(
      mintKeyPair.publicKey,
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
      mintKeyPair.publicKey,
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
    const beforeStakingAccount = await program.account.stakingAccount.fetch(
      stakingAccountPDA
    );

    await program.methods
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

    // balance must be deduced from stakingAccount (global pool)
    const afterStakingAccount =
      await provider.connection.getTokenAccountBalance(stakingAccountATA);

    assert(
      afterStakingAccount.value.uiAmount ==
        beforeStakingAccount.adminRewardAmount.toNumber() - reward
    );

    const stakerBalanceAfterRedeem =
      await provider.connection.getTokenAccountBalance(stakerTokenAccountATA);

    assert(
      stakerBalanceAfterRedeem.value.uiAmount ==
        beforeRedeemStakerBalance.value.uiAmount + reward + stakedAmount
    );
  });
});
