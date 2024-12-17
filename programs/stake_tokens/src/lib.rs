use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("FgvwGsuM8vVPxa7ZEdwkeGZdK2UXv3N1UVFMoWwJn8aC");

#[program]
pub mod stake_tokens {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {
        let stake_pool = &mut ctx.accounts.stake_pool;

        stake_pool.amount = 0;
        stake_pool.reward_rate = 0.000136986; // 5% APY Daily Rate
        stake_pool.bump = bump;
        Ok(())
    }
}

#[account]
pub struct StakePool {
    pub amount: u64,
    pub reward_rate: f64,
    pub bump: u8,
}

#[account]
pub struct StakeAccount {
    pub amount: u64,
    pub start_time: i64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub stake_pool: Account<'info, StakePool>,

    #[account(mut)]
    pub user: Signer<'info>,

    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeToken<'info> {}
