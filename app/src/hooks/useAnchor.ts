import { AnchorProvider, Idl, Program, BN } from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useState } from "react";
import { toast } from "sonner";

import {
  AdminPublicKey,
  connection,
  customTokenIDLObj,
  stakeTokensIDLObj,
  CustomSplTokens,
} from "@/lib/constant";
import { transferTokens } from "@/lib/utils";

function useAnchor<T extends Idl>(wallet: AnchorWallet | null | undefined) {
  const [transferLoading, setTransferLoading] = useState(false);
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(
    stakeTokensIDLObj as Idl,
    provider
  ) as unknown as Program<T>;

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

  async function transferToken(
    admin: PublicKey,
    mint: PublicKey,
    userATA: PublicKey | undefined
  ) {
    try {
      setTransferLoading(true);
      const senderATA = getAssociatedTokenAddressSync(mint, admin);
      const transferAmount = new BN(10);
      if (!wallet || !userATA) return;
      await transferTokens(
        admin,
        mint,
        wallet?.publicKey,
        senderATA,
        userATA,
        transferAmount,
        customSplTokenProgram
      );
      toast.success("Token received");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log(e);
      toast.error(e.message);
    } finally {
      setTransferLoading(false);
    }
  }
  return {
    provider,
    program,
    stakingAccountPDA,
    stakingAccountPDABump,
    customSplTokenProgram,
    transferToken,
    transferLoading,
  };
}

export default useAnchor;
