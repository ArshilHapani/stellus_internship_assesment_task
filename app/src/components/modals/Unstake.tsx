"use client";

import { toast } from "sonner";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { StakingAccount, UserStake } from "@/lib/types";
import Modal from ".";
import { ComprehensiveStakingCard } from "../UnStakeCard";
import useAnchor from "@/hooks/useAnchor";
import { adminPK } from "@/lib/constant";
import useModal from "@/hooks/useModal";
import { handleError } from "@/lib/utils";

type Props = {
  stake: UserStake;
  pool: StakingAccount;
};

const UnStakeModal = ({ stake, pool }: Props) => {
  const wallet = useAnchorWallet();
  const { program, stakingAccountPDA } = useAnchor(wallet);
  const { closeModal } = useModal();
  async function unstakeTokens(forceRedeem: boolean) {
    try {
      if (program && wallet) {
        const [userStakeAccountPDA] = PublicKey.findProgramAddressSync(
          [wallet.publicKey.toBuffer(), Buffer.from("user_stake")],
          program?.programId
        );
        const userATA = getAssociatedTokenAddressSync(
          pool.tokenMint,
          wallet.publicKey
        );
        const stakingTokenAccountATA = getAssociatedTokenAddressSync(
          pool.tokenMint,
          pool.admin
        );
        await program.methods
          .redeem(forceRedeem)
          .accounts({
            stakingAccount: stakingAccountPDA,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            userStake: userStakeAccountPDA,
            user: wallet.publicKey,
            userTokenAccount: userATA,
            stakingTokenAccount: stakingTokenAccountATA,
            stakingTokenAccountOwner: pool.admin,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([adminPK])
          .rpc();
        closeModal();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw e;
    }
  }
  return (
    <Modal
      className="md:w-[600px]"
      type={`unstake-pool-${stake.startTime.toNumber()}`}
    >
      <ComprehensiveStakingCard
        onUnstake={(f) => {
          toast.promise(unstakeTokens(f), {
            loading: "Unstaking...",
            success: "Unstaked successfully",
            error: (e) => handleError(e),
          });
        }}
        stakingAccount={pool}
        userStake={stake}
      />
    </Modal>
  );
};

export default UnStakeModal;
