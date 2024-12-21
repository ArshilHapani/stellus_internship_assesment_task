import { AnchorWallet } from "@solana/wallet-adapter-react";

import { StakingAccount } from "../types";
import { getPrograms, StakeTokens } from "../constant";

export async function getAvailablePools(
  wallet: AnchorWallet | null | undefined
): Promise<StakingAccount[]> {
  const { program, stakingAccountPDA } = getPrograms<StakeTokens>(wallet);
  const userStakeData =
    await program?.account.stakingAccount.fetch(stakingAccountPDA);

  if (userStakeData) return [userStakeData];
  else return [];
}
