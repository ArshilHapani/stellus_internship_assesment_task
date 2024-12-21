import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";

import stakeTokensIDL from "../../idls/stake_tokens.json";
import customTokenIDL from "../../idls/custom_spl_tokens.json";
import { CustomSplTokens as CustomSplTokensT } from "../../idls/custom_spl_tokens";
import { StakeTokens as StakeTokensT } from "../../idls/stake_tokens";

////////////////////////////////////////////////////////
/////////// ONE PLACE FOR IMPORT AND EXPORT ///////////
////////////////////////////////////////////////////////

export const endpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL! ?? clusterApiUrl("devnet");

export const connection = new Connection(endpoint, { commitment: "confirmed" });

export const stakeTokensIDLObj = stakeTokensIDL;
export const customTokenIDLObj = customTokenIDL;
export type StakeTokens = StakeTokensT;
export type CustomSplTokens = CustomSplTokensT;

export const AdminPublicKey = new PublicKey(
  "5axWRVjKhJnXv7Va25kTBjXs3WRKfzXQRSdUxugK75e2"
);

//////////////////////////////////////////////////
/////////////// UTILS FUNCTION SS ///////////////
//////////////////////////////////////////////////

export function getPrograms<T extends Idl>(
  wallet: AnchorWallet | null | undefined
) {
  if (!wallet) {
    return { provider: null, program: null };
  }
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const program = new Program(
    stakeTokensIDLObj as Idl,
    provider
  ) as unknown as Program<T>;

  const stakingAccountGlobalContextSeed = Buffer.from("staking_account");
  const [stakingAccountPDA, stakingAccountPDABump] =
    PublicKey.findProgramAddressSync(
      [AdminPublicKey.toBuffer(), stakingAccountGlobalContextSeed],
      program.programId
    );
  return { provider, program, stakingAccountPDA, stakingAccountPDABump };
}

// don't do this please...
const adminPkString = process.env.NEXT_PUBLIC_ADMIN_KEY!;
const bytesArr = Uint8Array.from(adminPkString.split(",").map(Number));
export const adminPK = Keypair.fromSecretKey(bytesArr);
