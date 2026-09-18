import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiError } from "./utils/ApiError";

export function withAuth(
  handler: (
    req: Request,
    user: { userId: string; id: string; orgId?: string },
    context?: any
  ) => Promise<NextResponse>
) {
  return async (req: Request, context: any) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
      const user = {
        userId: session.user.id,
        id: session.user.id,
        orgId: (session.user as any).orgId as string | undefined,
      };
      return await handler(req, user, context);
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
