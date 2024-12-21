"use client";

import Link from "next/link";

import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export function Navbar() {
  return (
    <nav className="shadow-lg p-4 dark:bg-[#1A1A1D]">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Token Staking App
        </Link>
        <ConnectWalletButton />
      </div>
    </nav>
  );
}
