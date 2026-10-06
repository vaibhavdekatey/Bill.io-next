import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/quotations/[token] — Public client quotation viewer
export async function GET(
  req: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid share link" },
        { status: 400 }
      );
    }

    const quotation = await prisma.quotation.findUnique({
      where: { shareToken: token },
      include: {
        QuotationItem: true,
        Organization: {
          select: {
            name: true,
            logoUrl: true,
            address: true,
            email: true,
            phone: true,
            website: true,
            taxId: true,
            bankDetails: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, message: "Quotation not found or invalid link" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: quotation,
        message: "Quotation retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Public quotation fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
