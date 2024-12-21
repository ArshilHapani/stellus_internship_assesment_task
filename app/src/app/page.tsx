"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import PoolCard from "@/components/PoolCard";
import StakeCard from "@/components/StakeCard";
import { Skeleton } from "@/components/ui/skeleton";
import useAnchor from "@/hooks/useAnchor";
import useStakingAccount from "@/hooks/useStakingAccount";
import { UserStake } from "@/lib/types";
import { EmptyStateWallet } from "@/components/EmptyState";

export default function Home() {
  const { userStake, loading } = useStakingAccount();
  const anchorWallet = useAnchorWallet();
  const wallet = useWallet();
  const { program } = useAnchor(anchorWallet);
  const { setVisible } = useWalletModal();

  const [staking, setStaking] = useState<UserStake>({
    amount: new BN(0),
    startTime: new BN(0),
  });

  useEffect(() => {
    (async function () {
      if (anchorWallet && program) {
        const [userPDA] = PublicKey.findProgramAddressSync(
          [anchorWallet.publicKey.toBuffer(), Buffer.from("user_stake")],
          program.programId
        );
        const myStaking = await program?.account.userStake.fetch(userPDA);
        if (myStaking) setStaking(myStaking);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorWallet]);
  if (!anchorWallet || !anchorWallet.publicKey || !wallet.connected)
    return <EmptyStateWallet onConnect={() => setVisible(true)} />;

  return (
    <div className="container min-h-screen flex justify-between flex-wrap">
      <div className="w-full md:w-1/2">
        <h2 className="scroll-m-20 mt-10 border-b border-neutral-700 pb-2 text-2xl font-semibold tracking-tight">
          Available staking pools
        </h2>

        {/* cards */}
        <div className="my-10 grid place-items-center">
          {/* dummy skeletons if loading 4 */}
          {loading ? (
            <Skeleton className="w-full max-w-md h-[460px]" />
          ) : (
            <PoolCard poolAccount={userStake[0]} />
          )}
        </div>
      </div>
      <div className="w-full md:w-1/2">
        <h2 className="scroll-m-20 mt-10 border-b border-neutral-700 pb-2 text-2xl font-semibold tracking-tight">
          My staking
        </h2>
        <div className="my-10 grid place-items-center">
          {loading ? (
            <Skeleton className="w-full max-w-md h-[460px]" />
          ) : (
            <StakeCard stake={staking} pool={userStake[0]} />
          )}
        </div>
      </div>
    </div>
  );
}
