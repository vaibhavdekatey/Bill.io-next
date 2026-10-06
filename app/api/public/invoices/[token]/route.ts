import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/invoices/[token] — Public client invoice viewer
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

    const invoice = await prisma.invoice.findUnique({
      where: { shareToken: token },
      include: {
        InvoiceItem: true,
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

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found or invalid link" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: invoice,
        message: "Invoice retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Public invoice fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
