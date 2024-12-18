use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer};
use std::mem::size_of;

declare_id!("FgvwGsuM8vVPxa7ZEdwkeGZdK2UXv3N1UVFMoWwJn8aC");

#[program]
pub mod stake_tokens {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        bump: u8,
        token_mint: Pubkey,
        reward_rate: u8,
    ) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        staking_account.reward_rate = reward_rate;
        staking_account.token_mint = token_mint;
        staking_account.bump = bump;
        staking_account.admin_reward_amount = 0;
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

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
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

        // Initialize user's stake data
        user_stake.amount = amount;
        user_stake.start_time = Clock::get()?.unix_timestamp;

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

        let current_time = Clock::get()?.unix_timestamp;
        let staking_duration = current_time - user_stake.start_time;

        // Calculate reward
        let calculated_reward = calculate_reward(
            user_stake.amount,
            staking_duration,
            staking_account.reward_rate,
        );

        // Adjust reward for force redeem if insufficient funds
        let reward = if staking_account.admin_reward_amount < calculated_reward && force_redeem {
            staking_account.admin_reward_amount
        } else {
            calculated_reward
        };
        require!(reward > 0, StakingError::InsufficientFunds);

        staking_account.admin_reward_amount -= reward;

        let total_amount = user_stake.amount + reward;

        // Transfer staked tokens and rewards back to the user
        token::transfer(ctx.accounts.transfer_to_user_ctx(), total_amount)?;

        // Close user's stake account
        token::close_account(ctx.accounts.close_stake_account_ctx())?;

        Ok(())
    }

    pub fn get_stake_info(ctx: Context<GetStakedAndReward>) -> Result<(u64, u64)> {
        let user_stake = &ctx.accounts.user_stake;
        Ok((
            user_stake.amount,
            calculate_reward(
                user_stake.amount,
                Clock::get()?.unix_timestamp - user_stake.start_time,
                ctx.accounts.staking_account.reward_rate,
            ),
        ))
    }
}

#[account]
pub struct StakingAccount {
    pub reward_rate: u8,
    pub bump: u8,
    pub token_mint: Pubkey,
    pub admin_reward_amount: u64,
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

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub staking_account: Account<'info, StakingAccount>, // staking pool account (which is created in the initialize function)
    #[account(
        mut, // mutable account (which is created in the stake function)
        seeds = [user.key().as_ref(), b"user_stake"], // seeds (to access the PDA created in the stake function)
        bump, // bump for the PDA (must be same as the one used in the stake function)
        close = user // close the account and transfer the remaining balance to the user account
    )]
    pub user_stake: Account<'info, UserStake>, // user stake account
    #[account(mut)]
    pub user: Signer<'info>, // user account (signer)
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>, // user token account which holds the required SPL tokens
    #[account(mut)]
    pub staking_token_account: Account<'info, TokenAccount>, // staking token account which holds the SPL tokens for staking (shared by all users within the pool)
    pub token_program: Program<'info, Token>, // token program used to transfer tokens
}

// reading from blockchain

#[derive(Accounts)]
pub struct GetStakedAndReward<'info> {
    // get the staked amount and reward for the user
    #[account(mut)]
    pub staking_account: Account<'info, StakingAccount>, // staking pool account (which is created in the initialize function)
    #[account(seeds = [user.key().as_ref(),b"user_stake"],bump)]
    pub user_stake: Account<'info, UserStake>, // user stake account
    pub user: Signer<'info>, // user account (signer)
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

impl<'info> Redeem<'info> {
    /// This function creates CPI context for transferring tokens from staking account to user
    pub fn transfer_to_user_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        // Creates the CPI context and return it
        CpiContext::new(
            self.token_program.to_account_info(), // token program account info (used for token transferring)
            Transfer {
                from: self.staking_token_account.to_account_info(), // from staking pool's token account
                to: self.user_token_account.to_account_info(),      // to user's token account
                authority: self.staking_account.to_account_info(), // authority to transfer tokens (staking pool)
            },
        )
    }

    /// This function creates CPI context for closing user stake account and transferring remaining balance to user
    pub fn close_stake_account_ctx(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        // Creates the CPI context and return it
        CpiContext::new(
            self.token_program.to_account_info(), // token program account info (used for token transferring)
            CloseAccount {
                account: self.user_stake.to_account_info(), // user stake account
                destination: self.user.to_account_info(),   // user account
                authority: self.staking_account.to_account_info(), // authority to close the account (staking pool)
            },
        )
    }
}

#[error_code]
pub enum StakingError {
    #[msg("User has already staked.")]
    AlreadyStaked,
    #[msg("User has nothing staked.")]
    NothingStaked,
    #[msg("Invalid argument.")]
    InvalidArgument,
    #[msg("Insufficient funds, please wait until the reward pool is funded, or force redeem.")]
    InsufficientFunds,
    #[msg("Only admin can fund the reward pool.")]
    AdminOnly,
}

fn calculate_reward(amount: u64, duration: i64, reward_rate: u8) -> u64 {
    let days_staked = duration / 86400; // Seconds in a day
    let daily_rate = reward_rate as u128 * 1e16 as u128 / 365;
    let reward = (amount as u128 * daily_rate * days_staked as u128) / 1e18 as u128;
    reward as u64
}
