import { useAnchorWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import useAnchor from "./useAnchor";
import useModal from "./useModal";

export default function useHandleStake() {
  const wallet = useAnchorWallet();
  const { program, stakingAccountPDA } = useAnchor(wallet);
  const { closeModal } = useModal();
  async function stake(amount: string, tokenMint: PublicKey, admin: PublicKey) {
    try {
      if (!wallet?.publicKey) {
        throw new Error("No wallet connected");
      }
      if (!program) {
        throw new Error("Program not found!");
      }
      const userATA = getAssociatedTokenAddressSync(
        tokenMint,
        wallet.publicKey
      );
      const stakingTokenAccountATA = getAssociatedTokenAddressSync(
        tokenMint,
        admin
      );
      const [userStakeAccountPDA] = PublicKey.findProgramAddressSync(
        [wallet.publicKey.toBuffer(), Buffer.from("user_stake")],
        program?.programId
      );
      await program?.methods
        .stake(new anchor.BN(amount), null)
        .accounts({
          stakingAccount: stakingAccountPDA,
          stakingTokenAccount: stakingTokenAccountATA,
          user: wallet.publicKey,
          userTokenAccount: userATA,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          userStake: userStakeAccountPDA,
        })
        .rpc();
      closeModal();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }
  return { stake };
}
