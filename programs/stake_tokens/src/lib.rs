use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer};
use std::mem::size_of;

declare_id!("GwrUWvcWzD1XqPgWVji188Ae3xFJD2Voca8CxhHt5Sam");

#[program]
pub mod stake_tokens {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        bump: u8,                  // unique bump for rach pool
        token_mint: Pubkey,        // program_id (address) of specific token which is allowed stake
        reward_rate: u8,           // APY return yearly
        min_staking_duration: i64, // minimum staking duration in seconds
    ) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        staking_account.admin = *ctx.accounts.admin.key;
        staking_account.reward_rate = reward_rate;
        staking_account.token_mint = token_mint;
        staking_account.bump = bump;
        staking_account.admin_reward_amount = 0;
        staking_account.min_staking_duration = min_staking_duration;
        Ok(())
    }

    pub fn fund_reward(ctx: Context<FundRewards>, amount: u64) -> Result<()> {
        // only admin can fund the reward pool
        require!(
            ctx.accounts.admin.key == &ctx.accounts.admin_token_account.owner,
            StakingError::AdminOnly
        );

        token::transfer(ctx.accounts.fund_reward_from_admin_ctx(), amount)?;
        let staking_account = &mut ctx.accounts.staking_account;
        staking_account.admin_reward_amount += amount;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64, timestamp: Option<i64>) -> Result<()> {
        let staking_account = &ctx.accounts.staking_account;

        require!(
            ctx.accounts.user_token_account.mint == staking_account.token_mint,
            StakingError::InvalidArgument
        );

        require!(
            ctx.accounts.user_stake.amount == 0,
            StakingError::AlreadyStaked
        );

        // Transfer tokens to the staking account
        token::transfer(ctx.accounts.transfer_to_stake_ctx(), amount)?;
        let user_stake = &mut ctx.accounts.user_stake;

        // for mock testing
        let current_time = match timestamp {
            Some(custom_time) => custom_time,
            None => Clock::get()?.unix_timestamp,
        };

        // Initialize user's stake data
        user_stake.amount = amount;
        user_stake.start_time = current_time;

        Ok(())
    }

    pub fn redeem(ctx: Context<Redeem>, force_redeem: bool) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;

        // Validate token mint matches staking account
        require!(
            ctx.accounts.user_token_account.mint == staking_account.token_mint,
            StakingError::InvalidArgument
        );

        let user_stake = &ctx.accounts.user_stake;
        require!(user_stake.amount > 0, StakingError::NothingStaked);

        let current_time = Clock::get()?.unix_timestamp * 1000; // Convert to milliseconds
        let staking_duration = current_time - user_stake.start_time;

        // Add minimum staking duration check if not force redeeming
        if !force_redeem {
            require!(
                staking_duration >= staking_account.min_staking_duration * 1000, // Convert to milliseconds
                StakingError::StakingDurationNotMet
            );
        }

        require!(
            user_stake.amount >= u64::MIN
                && staking_duration >= 0
                && staking_account.reward_rate >= u8::MIN,
            StakingError::ZeroValueError
        );

        let calculated_reward = calculate_reward(
            user_stake.amount,
            staking_duration / 1000,
            staking_account.reward_rate,
        );

        // Validate and adjust reward based on available funds
        let reward = if staking_account.admin_reward_amount < calculated_reward && force_redeem {
            staking_account.admin_reward_amount
        } else {
            require!(
                staking_account.admin_reward_amount >= calculated_reward,
                StakingError::InsufficientRewardFunds
            );
            calculated_reward
        };

        // Update admin reward balance
        staking_account.admin_reward_amount = staking_account
            .admin_reward_amount
            .checked_sub(reward)
            .ok_or(StakingError::CalculationError)?;

        // Calculate total amount with overflow protection
        let total_amount = user_stake
            .amount
            .checked_add(reward)
            .ok_or(StakingError::CalculationError)?;

        // Transfer staked tokens and rewards back to the user

        token::transfer(ctx.accounts.transfer_to_user_ctx(), total_amount)?;

        // Close user's stake account
        // token::close_account(ctx.accounts.close_stake_account_ctx())?;

        Ok(())
    }
}

#[account]
pub struct StakingAccount {
    pub admin: Pubkey,
    pub reward_rate: u8,
    pub bump: u8,
    pub token_mint: Pubkey,
    pub admin_reward_amount: u64,
    pub min_staking_duration: i64, // Minimum staking duration in seconds
}

#[account]
pub struct UserStake {
    pub amount: u64,
    pub start_time: i64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, // means initialize the account
        payer = admin, // means the admin account will pay for the transaction and rent
        seeds = [b"staking_account"], // means it will create the PDA
        bump, // multiple PDAs can be created with the same seeds
        space = size_of::<StakingAccount>() + 8 // size of the account 8 for descriptor
    )]
    pub staking_account: Account<'info, StakingAccount>, // creates a new account (staking pool)
    #[account(mut)]
    pub admin: Signer<'info>, // admin account
    pub system_program: Program<'info, System>, // system program used to create the staking_account PDA
}

#[derive(Accounts)]
pub struct FundRewards<'info> {
    #[account(mut)]
    pub staking_account: Account<'info, StakingAccount>, // staking pool account (which is created in the initialize function)
    #[account(mut)]
    pub staking_token_account: Account<'info, TokenAccount>, // staking token account which holds the SPL tokens for staking (shared by all users within the pool)
    #[account(mut)]
    pub admin: Signer<'info>, // admin account (signer)
    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>, // admin token account which holds the required SPL tokens
    pub token_program: Program<'info, Token>, // token program used to transfer tokens securly
}

impl<'info> FundRewards<'info> {
    /// This function creates CPI context for transferring tokens from admin to staking account
    pub fn fund_reward_from_admin_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(), // token program account info (used for token transferring)
            Transfer {
                from: self.admin_token_account.to_account_info(), // from admin's token account
                to: self.staking_token_account.to_account_info(), // to staking pool's token account
                authority: self.admin.to_account_info(), // authority to transfer tokens (signer)
            },
        )
    }
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub staking_account: Account<'info, StakingAccount>, // staking pool account (which is created in the initialize function)
    #[account(
        init, // initialize the new account with UserStake struct
        payer = user, // user will pay for the transaction and rent
        seeds = [user.key().as_ref(), b"user_stake"], // seeds for the PDA (unique for each user)
        bump, // bump for the PDA (one user can have multiple PDAs)
        space = size_of::<UserStake>() + 8 // size of the account 8 for descriptor
    )]
    pub user_stake: Account<'info, UserStake>, // user stake account
    #[account(mut)]
    pub user: Signer<'info>, // user account (signer)
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>, // user token account which holds the required SPL tokens
    #[account(mut)]
    pub staking_token_account: Account<'info, TokenAccount>, // staking token account which holds the SPL tokens for staking (shared by all users within the pool)
    pub token_program: Program<'info, Token>, // token program used to transfer tokens securly
    pub system_program: Program<'info, System>, // system program used to create the user_stake account
}

impl<'info> Stake<'info> {
    /// This function creates CPI context for transferring tokens from user to staking account
    pub fn transfer_to_stake_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        // Creates the CPI context and return it
        CpiContext::new(
            self.token_program.to_account_info(), // token program account info (used for token transferring)
            Transfer {
                from: self.user_token_account.to_account_info(), // from user's token account
                to: self.staking_token_account.to_account_info(), // to staking pool's token account
                authority: self.user.to_account_info(), // authority to transfer tokens (signer)
            },
        )
    }
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub staking_account: Account<'info, StakingAccount>, // staking pool account for managing state (which is created in the initialize function)

    #[account(
        mut,
        constraint = staking_token_account_owner.key() == staking_token_account.owner.key() // Verify staking pool account owner
    )]
    pub staking_token_account_owner: Signer<'info>, // staking pool account owner (signer)

    #[account(
        mut, // mutable account (which is created in the stake function)
        seeds = [user.key().as_ref(), b"user_stake"], // seeds (to access the PDA created in the stake function)
        bump, // bump for the PDA (must be same as the one used in the stake function)
        close = user // close the account and transfer the remaining balance to the user account
    )]
    pub user_stake: Account<'info, UserStake>, // user stake account PDA
    #[account(
        mut,
        // constraint = &user.key() == user_stake.to_account_info().owner // Verify user owns the stake account
    )]
    pub user: Signer<'info>, // user account (signer) used to sign the transaction while redeeming it
    #[account(
        mut,
        constraint = user_token_account.owner == user.key() // Verify user owns the token account
    )]
    pub user_token_account: Account<'info, TokenAccount>, // user token account which holds the required SPL tokens
    #[account(mut)]
    pub staking_token_account: Account<'info, TokenAccount>, // staking token account which holds the SPL tokens for staking (shared by all users within the pool)
    pub token_program: Program<'info, Token>, // token program used to transfer tokens
}

impl<'info> Redeem<'info> {
    /// This function creates CPI context for transferring tokens from staking account to user
    pub fn transfer_to_user_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        // Creates the CPI context and return it
        CpiContext::new(
            self.token_program.to_account_info(), // token program account info (used for token transferring)
            Transfer {
                from: self.staking_token_account.to_account_info(), // from staking pool's token account
                to: self.user_token_account.to_account_info(),      // to user's token account
                authority: self.staking_token_account_owner.to_account_info(), // authority to transfer tokens (staking pool)
            },
        )
    }

    /// This function creates CPI context for closing user stake account and transferring remaining balance to user
    pub fn close_stake_account_ctx(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        // Creates the CPI context and return it
        msg!("from: {}", self.staking_token_account.key());
        msg!("to: {}", self.user_token_account.key());
        msg!("authority: {}", self.staking_token_account_owner.key());
        msg!("account: {}", self.user.key());
        msg!("userStake {}", self.user_stake.key());
        CpiContext::new(
            self.token_program.to_account_info(), // token program account info (used for token transferring)
            CloseAccount {
                account: self.user_stake.to_account_info(), // user stake account
                destination: self.user.to_account_info(),   // user account
                authority: self.user.to_account_info(),     // authority to close the account (user)
            },
        )
    }
}

/// Custom error type for staking program
/// This will be used to return error codes to the client
/// Error codes are used to provide more information about the error
///
/// # Available error codes:
/// 1. `AlreadyStaked` - User has already staked
/// 2. `NothingStaked` - User has nothing staked
/// 3. `InvalidArgument` - Invalid argument
/// 4. `InsufficientRewardFunds` - Insufficient funds
/// 5. `AdminOnly` - Only admin can fund the reward pool
/// 6. `StakingDurationNotMet` - Staking duration not met
/// 7. `CalculationError` - Calculation error
#[error_code]
pub enum StakingError {
    #[msg("User has already staked.")]
    AlreadyStaked,
    #[msg("User has nothing staked.")]
    NothingStaked,
    #[msg("Invalid argument.")]
    InvalidArgument,
    #[msg("Insufficient funds, please wait until the reward pool is funded, or force redeem.")]
    InsufficientRewardFunds,
    #[msg("Only admin can fund the reward pool.")]
    AdminOnly,
    #[msg("Staking duration not met.")]
    StakingDurationNotMet,
    #[msg("Calculation error.")]
    CalculationError,
    #[msg("Provided parameters includes 0 which are not allowed")]
    ZeroValueError,
}

/// Calculate reward based on staked amount, duration and reward rate
/// Priority is to minimize intermediate values to avoid overflow
/// Returns reward amount
///
///
/// # Arguments
/// * `amount` - Amount of tokens staked
/// * `duration` - Duration of staking in seconds
/// * `reward_rate` - Annual percentage yield (APY) in percentage (0-100)
///
/// # Example
///
/// ```rs
/// let reward = calculate_reward(100, 86400, 10); // 100 tokens staked for 1 day at 10% APY
/// println!("Reward: {}", reward); // prints 10
/// ```
///
/// # Panics
/// Panics if amount, duration or reward_rate is less than or equal to 0
fn calculate_reward(amount: u64, duration: i64, reward_rate: u8) -> u64 {
    // Sanitize input (extra precaution)
    if amount <= 0 || duration <= 0 || reward_rate <= 0 {
        panic!("Invalid input");
    }

    let days_staked = duration / 86400; // Seconds in a day

    // Calculate daily rate using floating-point division for precision
    let annual_rate = reward_rate as f64 * 100.0; // Convert to basis points
    let daily_rate = annual_rate / 365.0;

    // Calculate reward using floating-point multiplication
    let reward = (amount as f64) * daily_rate * (days_staked as f64) / 10000.0;

    reward.round() as u64 // Round to the nearest whole number and return as u64
}
