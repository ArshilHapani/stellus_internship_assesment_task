import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

import { connection, stakeTokensIDLObj } from "@/lib/constant";

function useAnchor<T extends Idl>(wallet: AnchorWallet | null | undefined) {
  if (!wallet) {
    toast.error("Wallet not found");
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
      [wallet.publicKey.toBuffer(), stakingAccountGlobalContextSeed],
      program.programId
    );

  return { provider, program, stakingAccountPDA, stakingAccountPDABump };
}

export default useAnchor;
