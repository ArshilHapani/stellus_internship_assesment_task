import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userAddress, poolName, image, description } = await req.json();

    if (!userAddress || !poolName || !image || !description) {
      return NextResponse.json(
        {
          message: "Please fill all the fields",
          success: false,
        },
        { status: 400 }
      );
    }
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
