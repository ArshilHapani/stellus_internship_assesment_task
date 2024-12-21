"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Address } from "../Address";
import Modal from ".";
import { Button } from "../ui/button";
import FormInput from "../FormInput";
import { Skeleton } from "../ui/skeleton";

import { StakingAccount } from "@/lib/types";
import { secondsToDay } from "@/lib/utils";
import useHandleStake from "@/hooks/useHandleStake";
import useBalance from "@/hooks/useBalance";

type Props = {
  pool: StakingAccount;
};

type FormSchema = {
  amount: string;
};

const StakeToken = ({ pool }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>();
  const wallet = useAnchorWallet();
  const userATA = wallet
    ? getAssociatedTokenAddressSync(pool.tokenMint, wallet.publicKey)
    : undefined;

  const { stake } = useHandleStake();
  const [lStateLoading, setLoading] = useState(false);

  const { balance, loading: loadingUserBalance } = useBalance(
    userATA as PublicKey
  );

  function onSubmit(data: FormSchema) {
    setLoading(true);
    stake(data.amount, pool.tokenMint, pool.admin);
    setLoading(false);
  }
  const loading = loadingUserBalance || lStateLoading;

  return (
    <Modal
      type={`stake-pool-${pool.admin.toBase58() + pool.adminRewardAmount + pool.rewardRate + pool.tokenMint.toBase58()}`}
    >
      <DialogHeader>
        <DialogTitle className="text-xl">Stake token</DialogTitle>
        <DialogDescription className="text-base">
          <HoverCard openDelay={0}>
            <HoverCardTrigger className="inline-flex items-center">
              You must lock your tokens for{" "}
              {secondsToDay(pool.minStakingDuration.toNumber())} days{" "}
              <Info className="h-3 w-3 ml-1" />
            </HoverCardTrigger>
            <HoverCardContent className="text-sm">
              <div>
                <div className="flex items-center gap-x-2">
                  <img
                    src="https://bafybeiguhe3srbbteqcr3ndo66v7oriwh4kmpsy7qeupnlltltbjjy4yka.ipfs.flk-ipfs.xyz/wallpaperTest.jpg"
                    alt="Token Image"
                    className="rounded-full h-10 w-10"
                  />
                  <Button variant="link" className="leading-7">
                    <a
                      href="https://explorer.solana.com/address/F7zbU4Lqs1cBNX35o6NmuXXjoE2ri7Z9nsLjk7UvmwuV/instructions?cluster=devnet"
                      target="_blank"
                    >
                      INTERVIEW
                    </a>
                  </Button>
                </div>
                <div className="mt-4">
                  Token Mint: <Address address={pool.tokenMint} inline />
                </div>
                <div className="flex items-end gap-2">
                  Balance:{"  "}
                  {loadingUserBalance || loading ? (
                    <Skeleton className="h-[14px] w-[100px] mt-4" />
                  ) : (
                    balance + " ITW"
                  )}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </DialogDescription>
      </DialogHeader>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormInput<FormSchema>
          label="Amount of token to stake"
          name="amount"
          register={register}
          placeholder="Enter amount"
          isInvalid={!!errors.amount}
          required
          errorMessage="Please enter valid staking amount"
          type="text"
          pattern={/^\d+(\.\d{1,18})?$/}
          disabled={loading}
        />
        <Button
          className="bg-primary w-full "
          type="submit"
          disabled={loading || balance == 0}
        >
          Stake
        </Button>
      </form>
    </Modal>
  );
};

export default StakeToken;