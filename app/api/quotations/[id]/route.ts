import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateTotals,
  getOrganizationIdForUser,
  normalize,
  resolveClient,
} from "@/lib/utils/helperFunctions";

export const GET = (req: Request, context: any) =>
  withAuth(async (req: Request, user: any, context: any) => {
    const userId = user?.id || user?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const id = (await context.params).id;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { message: "Invoice Id is required", success: false }, // Keeping original message
        { status: 400 }
      );
    }

    const organizationId = await getOrganizationIdForUser(userId);
    if (!organizationId) {
      return NextResponse.json(
        { message: "Organizatiion not found for the user", success: false },
        { status: 401 }
      );
    }

    const quotation = await prisma.quotation.findFirst({
      where: {
        id,
        organizationId,
      },
      include: { Client: true, QuotationItem: true, Project: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { message: "Quotation not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        statusCode: 200,
        data: quotation,
        message: "Quotation fetched successfully",
        success: true,
      },
      { status: 200 }
    );
  })(req, context);

export const PUT = (req: Request, context: any) =>
  withAuth(async (req: Request, user: any, context: any) => {
    const userId = user?.id || user?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const id = (await context.params).id;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { message: "Quotation ID is required", success: false },
        { status: 400 }
      );
    }

    const organizationId = await getOrganizationIdForUser(userId);
    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization not found for user", success: false },
        { status: 404 }
      );
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, organizationId },
      include: { QuotationItem: true },
    });
    if (!quotation) {
      return NextResponse.json(
        { message: "Quotation not found", success: false },
        { status: 404 }
      );
    }

    const body = await req.json();
    const client = await resolveClient(organizationId, body);
    const clientName =
      normalize(body.clientName) ?? client?.name ?? quotation.clientName;
    const clientCompany =
      normalize(body.clientCompany) ??
      client?.companyName ??
      quotation.clientCompany;
    const clientAddress =
      body.clientAddress ?? client?.address ?? quotation.clientAddress;

    const discount =
      body.discount !== undefined
        ? Number(body.discount)
        : Number(quotation.discount);

    const items = body.items || quotation.QuotationItem;
    const { subtotal, taxTotal, total } = calculateTotals(items, discount);

    const updatedQuotation = await prisma.$transaction(async (tx: any) => {
      if (body.items) {
        await tx.quotationItem.deleteMany({
          where: { quotationId: id },
        });
      }

      return await tx.quotation.update({
        where: { id },
        data: {
          clientId: client?.id ?? quotation.clientId,
          status: body.status ?? quotation.status,
          currency: body.currency ?? quotation.currency,
          validUntil:
            body.dueDate !== undefined
              ? body.dueDate
                ? new Date(body.dueDate)
                : null
              : quotation.validUntil,
          subtotal,
          taxTotal,
          total,
          clientName,
          clientCompany,
          clientAddress,
          discount,
          ...(body.items
            ? {
                QuotationItem: {
                  create: body.items.map((item: any) => ({
                    description: item.description.trim(),
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    total: Number(item.quantity) * Number(item.unitPrice),
                  })),
                },
              }
            : {}),
        },
        include: {
          Client: true,
          QuotationItem: true,
        },
      });
    });

    return NextResponse.json(
      {
        statusCode: 200,
        data: updatedQuotation,
        message: "Quotation updated successfully",
        success: true,
      },
      { status: 200 }
    );
  })(req, context);

export const PATCH = (req: Request, context: any) =>
  withAuth(async (req: Request, user: any, context: any) => {
    const userId = user?.id || user?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const id = (await context.params).id;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { message: "Quotation ID is required", success: false },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;
    if (
      !status ||
      !["DRAFT", "SENT", "ACCEPTED", "REJECTED"].includes(status)
    ) {
      return NextResponse.json(
        { message: "Invalid status", success: false },
        { status: 400 }
      );
    }

    const organizationId = await getOrganizationIdForUser(userId);
    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization not found for user", success: false },
        { status: 404 }
      );
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, organizationId },
    });
    if (!quotation) {
      return NextResponse.json(
        { message: "Quotation not found", success: false },
        { status: 404 }
      );
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: { status },
      include: { Client: true, QuotationItem: true, Project: true },
    });

    return NextResponse.json(
      {
        statusCode: 200,
        data: updated,
        message: "Quotation updated successfully",
        success: true,
      },
      { status: 200 }
    );
  })(req, context);

export const DELETE = (req: Request, context: any) =>
  withAuth(async (req: Request, user: any, context: any) => {
    const userId = user?.id || user?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const id = (await context.params).id;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { message: "Quotation ID is required", success: false },
        { status: 400 }
      );
    }

    const organizationId = await getOrganizationIdForUser(userId);
    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization not found for user", success: false },
        { status: 404 }
      );
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, organizationId },
    });
    if (!quotation) {
      return NextResponse.json(
        { message: "Quotation not found", success: false },
        { status: 404 }
      );
    }

    await prisma.quotation.delete({ where: { id } });

    return NextResponse.json(
      {
        statusCode: 200,
        data: null,
        message: "Quotation deleted successfully",
        success: true,
      },
      { status: 200 }
    );
  })(req, context);
