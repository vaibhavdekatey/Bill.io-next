import { withAuth } from "@/lib/api-handler";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  calculateTotals,
  generateNextNumber,
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

    const organizationId = await getOrganizationIdForUser(userId);
    if (!organizationId) {
      return NextResponse.json(
        { message: "Organizatiion not found for the user", success: false },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "generate") {
      const getINVNumber = await generateNextNumber(organizationId, "INV");
      return NextResponse.json(
        {
          statusCode: 200,
          data: getINVNumber,
          message: "Invoice Number fetched",
          success: true,
        },
        { status: 200 }
      );
    }

    const page = url.searchParams.get("page") || "1";
    const limit = url.searchParams.get("limit") || "6";
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status");

    const now = new Date();
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 6, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.InvoiceWhereInput = {
      organizationId,
      ...(status && status !== "ALL" ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: "insensitive" } },
              { clientName: { contains: search, mode: "insensitive" } },
              { clientCompany: { contains: search, mode: "insensitive" } },
              {
                Client: {
                  is: {
                    companyName: { contains: search, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [
      invoices,
      totalCount,
      paidStats,
      sentStats,
      overdueCount,
      overdueStats,
      paidInvoicesForAvg,
    ] = await prisma.$transaction([
      // Paginated invoice list
      prisma.invoice.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: "desc" },
        include: {
          Client: {
            select: {
              id: true,
              name: true,
              companyName: true,
              email: true,
            },
          },
          InvoiceItem: true,
        },
      }),

      // Total count for pagination
      prisma.invoice.count({ where }),

      // Total billed (PAID invoices for this org)
      prisma.invoice.aggregate({
        where: { organizationId, status: "SENT" },
        _sum: { total: true },
      }),

      // Outstanding (SENT invoices not yet overdue)
      prisma.invoice.aggregate({
        where: {
          organizationId,
          status: "SENT",
          OR: [{ dueDate: null }, { dueDate: { gte: now } }],
        },
        _sum: { total: true },
      }),

      // Overdue count
      prisma.invoice.count({
        where: {
          organizationId,
          status: "SENT",
          dueDate: { lt: now },
        },
      }),

      // Overdue amount
      prisma.invoice.aggregate({
        where: {
          organizationId,
          status: "SENT",
          dueDate: { lt: now },
        },
        _sum: { total: true },
      }),

      // PAID invoices with issueDate + dueDate for avg payment time
      prisma.invoice.findMany({
        where: {
          organizationId,
          status: "PAID",
          dueDate: { not: null },
        },
        select: {
          issueDate: true,
          dueDate: true,
        },
        take: 50, // cap for performance
      }),
    ]);

    // Compute avg payment days
    const avgPaymentDays =
      paidInvoicesForAvg.length > 0
        ? Math.round(
            paidInvoicesForAvg.reduce((sum: any, inv: any) => {
              const diff =
                new Date(inv.dueDate!).getTime() -
                new Date(inv.issueDate).getTime();
              return sum + diff / (1000 * 60 * 60 * 24);
            }, 0) / paidInvoicesForAvg.length
          )
        : null;

    const stats = {
      totalBilled: Number(paidStats._sum.total ?? 0),
      outstanding: Number(sentStats._sum.total ?? 0),
      overdue: Number(overdueStats._sum.total ?? 0),
      overdueCount,
      avgPaymentDays,
      totalCount,
    };

    return NextResponse.json(
      {
        statusCode: 200,
        data: {
          invoices,
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalCount,
            totalPages: Math.ceil(totalCount / limitNumber),
            hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
            hasPrevPage: pageNumber > 1,
          },
          stats,
        },
        message: "Invoices fetched Successfully",
        success: true,
      },
      { status: 200 }
    );
  })(req, context);

export const POST = (req: Request, context: any) =>
  withAuth(async (req: Request, user: any, context: any) => {
    const userId = user?.id || user?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationIdForUser(userId);
    if (!organizationId) {
      return NextResponse.json(
        { message: "Organizatiion not found for the user", success: false },
        { status: 401 }
      );
    }

    const invNum = await generateNextNumber(organizationId, "INV");

    const body = await req.json();

    const client = await resolveClient(organizationId, body);

    const clientName = normalize(body.clientName) ?? client?.name ?? null;
    const clientCompany =
      normalize(body.clientCompany) ?? client?.companyName ?? null;
    const clientAddress = body.clientAddress ?? client?.address ?? null;
    const clientEmail = normalize(body.clientEmail) ?? client?.email ?? null;
    const clientPhone = normalize(body.clientPhone) ?? client?.phoneNumber ?? null;

    if (!clientName) {
      return NextResponse.json(
        { message: "Client name is required", success: false },
        { status: 400 }
      );
    }

    const discount = body.discount !== undefined ? Number(body.discount) : 0;

    const { subtotal, taxTotal, total } = calculateTotals(body.items, discount);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found", success: false },
        { status: 404 }
      );
    }

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        clientId: client?.id ?? null,
        number: invNum,
        status: body.status ?? "DRAFT",
        currency: body.currency ?? "INR",
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        subtotal,
        taxTotal,
        total,
        issuerName: currentUser?.name || organization.name,
        issuerCompany: organization.name,
        issuerAddress: organization.address || "",
        issuerEmail: organization.email || currentUser?.email || null,
        issuerPhone: organization.phone || currentUser?.phoneNumber || null,
        issuerWebsite: organization.website || null,
        clientName,
        discount: discount || 0,
        clientCompany,
        clientAddress,
        clientEmail,
        clientPhone,
        notes: body.notes || null,
        terms: body.terms || null,
        updatedAt: new Date(),
        InvoiceItem: {
          create: body.items.map((item: any) => ({
            description: item.description.trim(),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.quantity) * Number(item.unitPrice),
          })),
        },
      },
      include: {
        Client: true,
        InvoiceItem: true,
        Project: true,
      },
    });
    return NextResponse.json(
      {
        statusCode: 201,
        data: invoice,
        message: "Invoice created successfully",
        success: true,
      },
      { status: 201 }
    );
  })(req, context);
