import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import { AnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

import {
  AdminPublicKey,
  connection,
  customTokenIDLObj,
  stakeTokensIDLObj,
  CustomSplTokens,
  StakeTokens,
} from "@/lib/constant";

function useAnchor(pWallet: AnchorWallet | null | undefined) {
  const tWallet = useWallet();
  const wallet = pWallet || (tWallet.wallet as unknown as AnchorWallet);
  if (!wallet) {
    toast.info("Wallet not found or it will take some time to load");
    return {
      provider: null,
      program: null,
      stakingAccountPDA: null,
      stakingAccountPDABump: null,
      customSplTokenProgram: null,
    };
  }
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(
    stakeTokensIDLObj as Idl,
    provider
  ) as unknown as Program<StakeTokens>;

  const customSplTokenProgram = new Program(
    customTokenIDLObj as Idl,
    provider
  ) as unknown as Program<CustomSplTokens>;

  const stakingAccountGlobalContextSeed = Buffer.from("staking_account");
  const [stakingAccountPDA, stakingAccountPDABump] =
    PublicKey.findProgramAddressSync(
      [AdminPublicKey.toBuffer(), stakingAccountGlobalContextSeed],
      program.programId
    );

  return {
    provider,
    program,
    stakingAccountPDA,
    stakingAccountPDABump,
    customSplTokenProgram,
  };
}

export default useAnchor;
