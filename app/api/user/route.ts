import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/user — update the logged-in user's name and phone number
export const PATCH = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() || null : undefined;
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() || null : undefined;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data,
      select: { id: true, name: true, email: true, phoneNumber: true },
    });

    return NextResponse.json(
      { success: true, data: updated, message: "Profile updated successfully" },
      { status: 200 }
    );
  })(req, context);
