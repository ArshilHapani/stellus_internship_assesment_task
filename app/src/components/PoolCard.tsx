"use client";

import { Coins, User, Clock, Banknote, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { StakingAccount } from "@/lib/types";
import { formatBN, secondsToDay } from "@/lib/utils";
import { Button } from "./ui/button";
import useModal from "@/hooks/useModal";
import StakeToken from "./modals/StakeToken";
import { Address } from "./Address";

type Props = {
  poolAccount: StakingAccount;
};

const PoolCard = ({ poolAccount: account }: Props) => {
  const { openModal } = useModal();
  return (
    <>
      <Card className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-indigo-600 text-white p-6">
          <CardTitle className="text-2xl font-bold flex items-center">
            <Coins className="mr-2" />
            Staking pool
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center">
            <User className="text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Admin</p>
              <Address address={account?.admin} />
            </div>
          </div>
          <div className="flex items-center">
            <Banknote className="text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Reward Rate</p>
              <p className="font-medium">{account?.rewardRate}% APY</p>
            </div>
          </div>
          <div className="flex items-center">
            <Key className="text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Token Mint</p>
              <Address address={account?.tokenMint} />
            </div>
          </div>
          <div className="flex items-center">
            <Coins className="text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Available reward</p>
              <p className="font-medium">
                {formatBN(account?.adminRewardAmount)} ITW
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Min Staking Duration</p>
              <p className="font-medium">
                {secondsToDay(Number(formatBN(account?.minStakingDuration)))}{" "}
                days
              </p>
            </div>
          </div>

          {/* stake button */}
          <div className="grid place-items-end">
            <Button
              onClick={() =>
                openModal(
                  `stake-pool-${account?.admin.toBase58() + account?.adminRewardAmount + account?.rewardRate + account?.tokenMint?.toBase58()}`
                )
              }
            >
              Stake
            </Button>
          </div>
        </CardContent>
      </Card>
      <StakeToken pool={account} />
    </>
  );
};

export default PoolCard;
