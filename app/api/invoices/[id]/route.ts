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
        { message: "Invoice Id is required", success: false },
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId,
      },
      include: { Client: true, InvoiceItem: true, Project: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        statusCode: 200,
        data: invoice,
        message: "Invoice fetched successfully",
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
        { message: "Invoice Id for updating status is required", success: false },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;
    if (!status || !["DRAFT", "SENT", "PAID", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid Status", success: false },
        { status: 400 }
      );
    }

    const organizationId = await getOrganizationIdForUser(userId);
    if (!organizationId) {
      return NextResponse.json(
        {
          message:
            "Organizatiion not found for the user for updating the invoice status",
          success: false,
        },
        { status: 401 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: { InvoiceItem: true },
    });
    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice for updating status not found", success: false },
        { status: 404 }
      );
    }

    const client = await resolveClient(organizationId, body);
    const clientName =
      normalize(body.clientName) ?? client?.name ?? invoice.clientName;
    const clientCompany =
      normalize(body.clientCompany) ??
      client?.companyName ??
      invoice.clientCompany;
    const clientAddress =
      body.clientAddress ?? client?.address ?? invoice.clientAddress;

    const discount =
      body.discount !== undefined
        ? Number(body.discount)
        : Number(invoice.discount);

    const items = body.items || invoice.InvoiceItem;

    const { subtotal, taxTotal, total } = calculateTotals(items, discount);

    const updatedInvoice = await prisma.$transaction(async (tx: any) => {
      if (body.items) {
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });
      }

      return await tx.invoice.update({
        where: { id },
        data: {
          clientId: client?.id ?? invoice.clientId,
          status: body.status ?? invoice.status,
          currency: body.currency ?? invoice.currency,
          issueDate: body.issueDate
            ? new Date(body.issueDate)
            : invoice.issueDate,
          dueDate:
            body.dueDate !== undefined
              ? body.dueDate
                ? new Date(body.dueDate)
                : null
              : invoice.dueDate,
          subtotal,
          taxTotal,
          total,
          clientName,
          clientCompany,
          clientAddress,
          notes: body.notes !== undefined ? body.notes || null : invoice.notes,
          terms: body.terms !== undefined ? body.terms || null : invoice.terms,
          discount,
          updatedAt: new Date(),
          ...(body.items
            ? {
                InvoiceItem: {
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
          InvoiceItem: true,
        },
      });
    });

    return NextResponse.json(
      {
        statusCode: 200,
        data: updatedInvoice,
        message: "Invoice updated successfully",
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
        { message: "Invoice Id for updating status is required", success: false },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;
    if (!status || !["DRAFT", "SENT", "PAID", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid Status", success: false },
        { status: 400 }
      );
    }

    const organizationId = await getOrganizationIdForUser(userId);
    if (!organizationId) {
      return NextResponse.json(
        {
          message:
            "Organizatiion not found for the user for updating the invoice status",
          success: false,
        },
        { status: 401 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
    });
    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice for updating status not found", success: false },
        { status: 404 }
      );
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: { Client: true, InvoiceItem: true, Project: true },
    });

    return NextResponse.json(
      {
        statusCode: 200,
        data: updated,
        message: "Invoice Updated Successfully",
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
        { message: "Invoice Id for updating status is required", success: false },
        { status: 400 }
      );
    }

    const organizationId = await getOrganizationIdForUser(userId);
    if (!organizationId) {
      return NextResponse.json(
        {
          message:
            "Organizatiion not found for the user for updating the invoice status",
          success: false,
        },
        { status: 401 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
    });
    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice for updating status not found", success: false },
        { status: 404 }
      );
    }

    await prisma.invoice.delete({ where: { id } });

    return NextResponse.json(
      {
        statusCode: 200,
        data: null,
        message: "Invoice Deleted Successfully",
        success: true,
      },
      { status: 200 }
    );
  })(req, context);
