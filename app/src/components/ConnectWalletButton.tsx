"use client";

import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Plus } from "lucide-react";

import { Button } from "./ui/button";
import TooltipComponent from "./TooltipComponent";
import CreatePool from "./modals/CreatePool";

import useModal from "@/hooks/useModal";

export function ConnectWalletButton() {
  const wallet = useWallet();
  const { openModal } = useModal();
  if (wallet.connected) {
    return (
      <div className="flex items-center gap-x-4">
        <WalletDisconnectButton
          style={{
            backgroundColor: "#0066cc",
          }}
        />
        <TooltipComponent title="Create new pool">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openModal("create-pool")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipComponent>
        <CreatePool />
      </div>
    );
  }
  return (
    <WalletMultiButton
      style={{
        backgroundColor: "#0066cc",
      }}
    />
  );
}
