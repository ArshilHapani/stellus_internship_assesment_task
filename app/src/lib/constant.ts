import { Connection, clusterApiUrl } from "@solana/web3.js";

import stakeTokensIDL from "../../idls/stake_tokens.json";
import { CustomSplTokens as CustomSplTokensT } from "../../idls/custom_spl_tokens";
import { StakeTokens as StakeTokensT } from "../../idls/stake_tokens";

export const endpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL! ?? clusterApiUrl("devnet");

export const connection = new Connection(endpoint, { commitment: "confirmed" });
export const stakeTokensIDLObj = stakeTokensIDL;
export type StakeTokens = StakeTokensT;
export type CustomSplTokens = CustomSplTokensT;
