import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

import { connection } from "@/lib/constant";

export default function useBalance(userATA: PublicKey) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async function () {
      try {
        setLoading(true);
        const balance = await connection.getTokenAccountBalance(
          userATA,
          "confirmed"
        );
        setBalance(balance.value.uiAmount ?? 0);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { balance, loading };
}
