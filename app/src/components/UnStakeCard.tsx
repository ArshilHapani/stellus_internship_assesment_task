"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Coins,
  Clock,
  TrendingUp,
  ArrowUpRight,
  User,
  Key,
  AlertTriangle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  formatBN,
  formatDate,
  calculateRewards,
  calculateDuration,
  secondsToDay,
  canRegularRedeem,
} from "@/lib/utils";
import { StakingAccount, UserStake } from "@/lib/types";
import TooltipComponent from "./TooltipComponent";
import { Checkbox } from "./ui/checkbox";
import { Address } from "./Address";

interface ComprehensiveStakingCardProps {
  userStake: UserStake;
  stakingAccount: StakingAccount;
  onUnstake: (forceRedeem: boolean) => Promise<void> | void;
}

export function ComprehensiveStakingCard({
  userStake,
  stakingAccount,
  onUnstake,
}: ComprehensiveStakingCardProps) {
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [forceRedeem, setForceRedeem] = useState(false);
  const { daily, cumulative } = calculateRewards(
    userStake.amount,
    userStake.startTime,
    stakingAccount.rewardRate
  );
  const canRegularUnstake = canRegularRedeem(
    userStake.startTime,
    stakingAccount.minStakingDuration
  );

  const handleUnstake = async () => {
    if (userStake.amount.toNumber() === 0) {
      toast.warning("No stake to unstake. Please stake first.");
      return;
    }
    if (!canRegularUnstake && !forceRedeem) {
      toast.error(
        "Force redeem is required to unstake before minimum duration"
      );
      return;
    }

    setIsUnstaking(true);
    try {
      await onUnstake(forceRedeem);
    } catch (error) {
      console.error("Unstaking failed:", error);
    } finally {
      setIsUnstaking(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-white border-none overflow-hidden">
      <CardHeader className="bg-gradient-to-rp-6">
        <CardTitle className="text-2xl font-bold flex items-center">
          <Coins className="mr-2" />
          Staking Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">User Stake</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Staked Amount</p>
                <p className="text-sm font-medium">
                  {formatBN(userStake.amount)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Start Time</p>
                <p className="text-sm font-medium w-[70px] text-right">
                  {formatDate(userStake.startTime)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-sm font-medium">
                  {calculateDuration(userStake.startTime)}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rewards</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Reward Rate</p>
                <p className="text-sm font-medium flex items-center">
                  {stakingAccount.rewardRate}%{" "}
                  <TrendingUp className="ml-1 text-green-500" size={16} />
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Daily Reward</p>
                <p className="text-sm font-medium">{formatBN(daily)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Cumulative Reward</p>
                <p className="text-sm font-medium">{formatBN(cumulative)}</p>
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Staking Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TooltipComponent
              title={`Full address: ${stakingAccount.admin.toBase58()}`}
            >
              <div className="flex items-center space-x-2">
                <User className="text-gray-400" size={16} />
                <p className="text-sm text-gray-500">Admin</p>
                <Address
                  className="text-sm font-medium"
                  address={stakingAccount.admin}
                  inline
                  iconClassName="h-2 w-2"
                />
              </div>
            </TooltipComponent>
            <TooltipComponent
              title={`Full address: ${stakingAccount.tokenMint.toBase58()}`}
            >
              <div className="flex items-center space-x-2">
                <Key className="text-gray-400" size={16} />
                <p className="text-sm text-gray-500">Token Mint</p>
                <Address
                  className="text-sm font-medium"
                  address={stakingAccount.tokenMint}
                  inline
                  iconClassName="h-2 w-2"
                />
              </div>
            </TooltipComponent>

            <div className="flex items-center space-x-2">
              <Coins className="text-gray-400" size={16} />
              <p className="text-sm text-gray-500">Admin Reward</p>
              <p className="text-sm font-medium">
                {formatBN(stakingAccount.adminRewardAmount)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="text-gray-400" size={16} />
              <p className="text-sm text-gray-500">Min Staking Duration</p>
              <p className="text-sm font-medium">
                {secondsToDay(
                  Number(formatBN(stakingAccount.minStakingDuration))
                )}{" "}
                days
              </p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="force-redeem"
            checked={forceRedeem}
            onCheckedChange={(checked) => setForceRedeem(checked as boolean)}
            disabled={canRegularUnstake}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="force-redeem"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Force Redeem
            </label>
            <p className="text-sm text-muted-foreground">
              {canRegularUnstake
                ? "Regular unstaking is available"
                : "Unstake before minimum duration (may incur penalties)"}
            </p>
          </div>
          {!canRegularUnstake && (
            <TooltipComponent title="Force redeeming may result in reduced rewards or penalties">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </TooltipComponent>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 flex flex-col gap-4">
        <Button
          className="w-full bg-primary text-white"
          onClick={handleUnstake}
          disabled={isUnstaking}
        >
          {isUnstaking ? (
            "Unstaking..."
          ) : (
            <>
              Unstake <ArrowUpRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
