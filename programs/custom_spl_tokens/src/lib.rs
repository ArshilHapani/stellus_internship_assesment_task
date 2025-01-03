use {
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        metadata::{
            create_metadata_accounts_v3, mpl_token_metadata::types::DataV2,
            CreateMetadataAccountsV3, Metadata,
        },
        token::{mint_to, transfer, Mint, MintTo, Token, TokenAccount, Transfer},
    },
};

declare_id!("GmWEsdzWFfkpMtRKnkEMcC17NvqepxktLL9XEQwMKZTP");

////////////////////////////////////////////////////////////////////////////////
///////////////////////// INSTRUCTIONS IMPLEMENTATIONS /////////////////////////
////////////////////////////////////////////////////////////////////////////////

#[program]
pub mod custom_spl_tokens {

    use super::*;

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////// CREATE TOKEN MINT //////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    /// Create a new token mint
    /// This instruction creates a new token mint and associated metadata account
    ///
    /// # Arguments
    /// * `ctx` - The context of the transaction
    /// * `token_name` - The name of the token
    /// * `token_symbol` - The symbol of the token
    /// * `token_uri` - The URI of the token
    pub fn create_token_mint(
        ctx: Context<CreateToken>,
        _token_decimals: u8,
        token_name: String,
        token_symbol: String,
        token_uri: String,
    ) -> Result<()> {
        msg!("Creating metadata account...");
        msg!("Metadata account key {}", ctx.accounts.metadata_account.key);

        create_metadata_accounts_v3(
            CpiContext::new(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata_account.to_account_info(),
                    mint: ctx.accounts.mint_account.to_account_info(),
                    mint_authority: ctx.accounts.payer.to_account_info(),
                    update_authority: ctx.accounts.payer.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            DataV2 {
                name: token_name,
                symbol: token_symbol,
                uri: token_uri,
                seller_fee_basis_points: 0,
                creators: None,
                collection: None,
                uses: None,
            },
            true, // is mutable
            true, // upgrade authoity to signer
            None, // collection details
        )?;

        msg!("Token mint created successfully");

        Ok(())
    }

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////// MINT TOKEN //////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    /// Mint tokens to an associated token account
    /// This instruction mints tokens to an associated token account
    ///
    /// # Arguments
    /// * `ctx` - The context of the transaction
    /// * `amount` - The amount of tokens to mint
    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        msg!("Minting tokens to associated token account....");
        msg!("Mint {}", &ctx.accounts.mint_account.key());
        msg!(
            "Token address {}",
            &ctx.accounts.associated_token_account.key()
        );

        mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint_account.to_account_info(),
                    to: ctx.accounts.associated_token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            amount * 10u64.pow(ctx.accounts.mint_account.decimals as u32),
        )?;
        msg!("Token minted successfully");
        Ok(())
    }

    ////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////// TRANSFER TOKEN ////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    /// Transfer tokens between associated token accounts
    /// This instruction transfers tokens between associated token accounts
    ///
    /// # Arguments
    /// * `ctx` - The context of the transaction
    /// * `amount` - The amount of tokens to transfer
    pub fn transfer_token(ctx: Context<TransferToken>, amount: u64) -> Result<()> {
        msg!("Transferring token..");
        msg!(
            "Mint {}",
            &ctx.accounts.mint_account.to_account_info().key()
        );
        msg!(
            "From token address {}",
            &ctx.accounts.sender_token_account.key()
        );
        msg!(
            "To token address {}",
            &ctx.accounts.recipient_token_account.key()
        );

        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.sender_token_account.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            amount * 10u64.pow(ctx.accounts.mint_account.decimals as u32),
        )?;

        msg!("Token transferred successfully");

        Ok(())
    }
}

//////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// INSTRUCTIONS STRUCTS //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

/// Create a new token mint
/// This instruction creates a new token mint and associated metadata account
///
/// # Accounts expected:
/// * `payer` - The account paying for the transaction
/// * `metadata_account` - The metadata account to create
/// * `mint_account` - The mint account to create
/// * `token_metadata_program` - The token metadata program (used to create metadata account)
/// * `token_program` - The token program
/// * `system_program` - The system program
/// * `rent` - The rent sysvar
#[derive(Accounts)]
#[instruction(_token_decimals: u8)]
pub struct CreateToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Validate address by deriving pda
    #[account(
        mut,
        seeds = [b"metadata",token_metadata_program.key().as_ref(),mint_account.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub metadata_account: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = _token_decimals,
        mint::authority = payer.key(),
    )]
    pub mint_account: Account<'info, Mint>,

    pub token_metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// Mint tokens to an associated token account
/// This instruction mints tokens to an associated token account
///
/// # Accounts expected:
/// * `mint_authority` - The authority to mint tokens
/// * `recipient` - The system account to mint tokens to
/// * `mint_account` - The mint account
/// * `associated_token_account` - The associated token account to mint tokens to
/// * `token_program` - The token program
/// * `associated_token_program` - The associated token program
/// * `system_program` - The system program
#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub recipient: SystemAccount<'info>,

    #[account(mut)]
    pub mint_account: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = mint_authority,
        associated_token::mint = mint_account,
        associated_token::authority = recipient,
    )]
    pub associated_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Transfer tokens between associated token accounts
/// This instruction transfers tokens between associated token accounts
///
/// # Accounts expected:
/// * `sender` - The account transferring tokens
/// * `recipient` - The account receiving tokens
/// * `mint_account` - The mint account
/// * `sender_token_account` - The sender's associated token account
/// * `recipient_token_account` - The recipient's associated token account
/// * `token_program` - The token program
/// * `associated_token_program` - The associated token program
/// * `system_program` - The system program
#[derive(Accounts)]
pub struct TransferToken<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    pub recipient: SystemAccount<'info>,

    #[account(mut)]
    pub mint_account: Account<'info, Mint>,
    #[account(mut,associated_token::mint = mint_account, associated_token::authority = sender)]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(init_if_needed,payer = sender, associated_token::mint = mint_account, associated_token::authority = recipient)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
