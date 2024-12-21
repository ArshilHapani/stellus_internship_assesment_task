import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

import { StakingAccount } from "@/lib/types";
import { getAvailablePools } from "@/lib/interact/dataGetter";

export default function useStakingAccount() {
  const anchorWallet = useAnchorWallet();
  const [userStake, setUserStake] = useState<StakingAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("check");
    (async function () {
      setLoading(true);
      const userStakeData = await getAvailablePools(anchorWallet);
      setUserStake(userStakeData);
      setLoading(false);
    })();
  }, [anchorWallet]);

  return {
    userStake,
    loading,
  };
}
