"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddressProps {
  address: string | PublicKey;
  truncate?: boolean;
  inline?: boolean;
  className?: string;
}

export function Address({
  address: unparsedAddress,
  truncate = true,
  inline = false,
  className,
}: AddressProps) {
  let address = "";
  if (unparsedAddress instanceof PublicKey) {
    address = unparsedAddress.toBase58();
  } else {
    address = unparsedAddress ?? "";
  }
  const [copied, setCopied] = useState(false);

  const displayAddress = truncate
    ? `${address?.slice(0, 4)}...${address?.slice(-4)}`
    : address;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      toast.success("Copied successfully");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={cn(
        `flex items-center ${inline ? "inline-flex" : "flex-col sm:flex-row"} space-x-2`,
        className
      )}
    >
      <span className={`font-medium ${inline ? "" : "mb-2 sm:mb-0"}`}>
        {displayAddress}
      </span>
      <Button
        variant="outline"
        size="icon"
        className={`h-6 w-6 ${inline ? "" : "self-start sm:self-auto"}`}
        onClick={copyToClipboard}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}
