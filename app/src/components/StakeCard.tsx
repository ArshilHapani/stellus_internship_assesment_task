"use client";

import { BN } from "@coral-xyz/anchor";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Coins, TrendingUp } from "lucide-react";
import { StakingAccount, UserStake } from "@/lib/types";
import { calculateRewards, formatBN } from "@/lib/utils";
import { Button } from "./ui/button";
import useModal from "@/hooks/useModal";
import UnStakeModal from "./modals/Unstake";

type Props = {
  stake: UserStake;
  pool: StakingAccount;
};

const StakeCard = ({ stake, pool }: Props) => {
  const { daily, cumulative } = calculateRewards(
    stake.amount,
    stake.startTime,
    pool?.rewardRate
  );
  const { openModal } = useModal();
  if (!pool || !stake) return null;
  return (
    <>
      <Card className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6">
          <CardTitle className="text-2xl font-bold flex items-center">
            <Coins className="mr-2" />
            User Stake
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center">
            <Coins className="text-gray-400 mr-2" size={24} />
            <div>
              <p className="text-sm text-gray-500">Staked Amount</p>
              <p className="text-2xl font-bold">{formatBN(stake.amount)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="text-gray-400 mr-2" size={24} />
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p className="text-lg font-medium">
                {formatDate(stake.startTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <TrendingUp className="text-gray-400 mr-2" size={24} />
            <div>
              <p className="text-sm text-gray-500">APY</p>
              <p className="text-lg font-medium">{pool?.rewardRate}%</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Staking Duration: {calculateDuration(stake.startTime)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 ">
              Daily Reward:{" "}
              <span className="font-semibold">{formatBN(daily)}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 ">
              Cumulative Reward:{" "}
              <span className="font-semibold">{formatBN(cumulative)}</span>
            </p>
          </div>
          {/* un stake button */}
          <div className="grid place-items-end">
            <Button
              onClick={() =>
                openModal(`unstake-pool-${stake.startTime.toNumber()}`)
              }
            >
              Un stake
            </Button>
          </div>
        </CardContent>
      </Card>
      <UnStakeModal stake={stake} pool={pool} />
    </>
  );
};

export default StakeCard;

function calculateDuration(startTime: BN): string {
  const now = Math.floor(Date.now() / 1000);
  const durationInSeconds = now - startTime.toNumber();
  const days = Math.floor(durationInSeconds / 86400);
  const hours = Math.floor((durationInSeconds % 86400) / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);

  return `${days} days, ${hours} hours, ${minutes} minutes`;
}
export function formatDate(timestamp: BN): string {
  const date = new Date(timestamp.toNumber() * 1000);
  return date.toLocaleString();
}
