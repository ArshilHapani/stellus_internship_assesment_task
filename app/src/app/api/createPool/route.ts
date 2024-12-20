import { NextResponse } from "next/server";

import { PoolTable } from "@/db/schema";
import db from "@/lib/drizzle";

export async function POST(req: Request) {
  try {
    const {
      userAddress,
      poolName,
      image,
      description,
      initialRewardAmount,
      allowedTokenMint,
      APY,
    } = await req.json();

    if (
      !userAddress ||
      !poolName ||
      !image ||
      !description ||
      !initialRewardAmount ||
      !allowedTokenMint ||
      !APY
    ) {
      return NextResponse.json(
        {
          message: "Please fill all the fields",
          success: false,
        },
        { status: 400 }
      );
    }

    // Create a pool
    // await db.insert(PoolTable).values({
    //   description,
    //   image,
    //   userAddress,
    //   poolName,
    // });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message ?? "Something went wrong",
        success: false,
      },
      { status: 500 }
    );
  }
}
