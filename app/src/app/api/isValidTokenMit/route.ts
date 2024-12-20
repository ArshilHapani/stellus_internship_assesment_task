import { PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";

import { NextResponse } from "next/server";
import { connection } from "@/lib/constant";

export async function GET(req: Request) {
  try {
    const { tokenMint } = await req.json();
    const pubKey = new PublicKey(tokenMint);
    if (!PublicKey.isOnCurve(pubKey)) {
      return NextResponse.json(
        {
          message: "Invalid token mint",
          success: false,
        },
        { status: 400 }
      );
    }
    const mintAccount = await getMint(connection, pubKey);
    return NextResponse.json(
      {
        success: true,
        data: {
          tokenName: mintAccount.mintAuthority,
          tokenSymbol: mintAccount.supply,
        },
      },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      {
        message: err.message ?? "Something went wrong",
        success: false,
      },
      { status: 500 }
    );
  }
}
