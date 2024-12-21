"use client";

import PoolCard from "@/components/PoolCard";
import { Skeleton } from "@/components/ui/skeleton";
import useStakingAccount from "@/hooks/useStakingAccount";

export default function Home() {
  const { userStake, loading } = useStakingAccount();

  return (
    <div className="container min-h-screen">
      <h2 className="scroll-m-20 mt-10 border-b border-neutral-700 pb-2 text-2xl font-semibold tracking-tight">
        Available staking pools
      </h2>

      {/* cards */}
      <div className="my-10 flex items-center justify-between gap-y-20 gap-4 flex-wrap">
        {/* dummy skeletons if loading 4 */}
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton
                key={"LOADING_SKELETON_USER_STAKE_CARD " + idx}
                className="w-full max-w-md h-[460px]"
              />
            ))
          : userStake.map((stake, idx) => (
              <PoolCard
                key={stake.admin.toString() + idx}
                poolAccount={stake}
              />
            ))}
      </div>
    </div>
  );
}
