"use client";

import React, { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";

import { Badge } from "./ui/badge";
import { getNetworkFromGenesisHash } from "@/lib/utils";

const NetworkIndicator = () => {
  const { connection } = useConnection();
  const [networkName, setNetworkName] = useState("");
  getNetworkFromGenesisHash(connection).then((res) => setNetworkName(res));
  return (
    <div className="fixed bottom-8 right-4 z-10">
      <Badge variant="outline" className="py-2 px-4 backdrop-blur-lg">
        <span className="h-2 w-2 bg-green-500 rounded-full inline-block mr-2" />
        {networkName} (connected)
      </Badge>
    </div>
  );
};

export default NetworkIndicator;
