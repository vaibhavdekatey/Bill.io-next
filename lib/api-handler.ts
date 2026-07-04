import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiError } from "./utils/ApiError";

export function withAuth(
  handler: (req: Request, user: { userId: string }, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context: any) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
      return await handler(req, { userId: session.user.id }, context);
    } catch (error: any) {
      console.error(error);
      if (error instanceof ApiError) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: error.statusCode }
        );
      }
      return NextResponse.json(
        { success: false, message: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
