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
      const getQUONumber = await generateNextNumber(organizationId, "QUO");
      return NextResponse.json(
        {
          statusCode: 200,
          data: getQUONumber,
          message: "Quotation Number fetched",
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

    const where: Prisma.QuotationWhereInput = {
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
      quotations,
      totalCount,
      paidStats,
      sentStats,
      overdueCount,
      overdueStats,
    ] = await prisma.$transaction([
      // Paginated quotation list
      prisma.quotation.findMany({
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
          QuotationItem: true,
        },
      }),

      // Total count for pagination
      prisma.quotation.count({ where }),

      // Total billed (ACCEPTED invoices for this org)
      prisma.quotation.aggregate({
        where: { organizationId, status: "ACCEPTED" },
        _sum: { total: true },
      }),

      // Outstanding (SENT invoices not yet overdue)
      prisma.quotation.aggregate({
        where: {
          organizationId,
          status: "SENT",
          OR: [{ validUntil: null }, { validUntil: { gte: now } }],
        },
        _sum: { total: true },
      }),

      // Overdue count
      prisma.quotation.count({
        where: {
          organizationId,
          status: "SENT",
          validUntil: { lt: now },
        },
      }),

      // Overdue amount
      prisma.quotation.aggregate({
        where: {
          organizationId,
          status: "SENT",
          validUntil: { lt: now },
        },
        _sum: { total: true },
      }),
    ]);

    return NextResponse.json(
      {
        statusCode: 200,
        data: {
          quotations,
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalCount,
            totalPages: Math.ceil(totalCount / limitNumber),
            hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
            hasPrevPage: pageNumber > 1,
          },
        },
        message: "Quotations fetched Successfully",
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

    const invNum = await generateNextNumber(organizationId, "QUO");
    const body = await req.json();

    const client = await resolveClient(organizationId, body);

    const clientName = normalize(body.clientName) ?? client?.name ?? null;
    const clientCompany =
      normalize(body.clientCompany) ?? client?.companyName ?? null;
    const clientAddress = body.clientAddress ?? client?.address ?? null;

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
    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found", success: false },
        { status: 404 }
      );
    }

    const quotation = await prisma.quotation.create({
      data: {
        organizationId,
        clientId: client?.id ?? null,
        number: invNum,
        status: body.status ?? "DRAFT",
        currency: body.currency ?? "INR",
        validUntil: body.dueDate ? new Date(body.dueDate) : null,
        subtotal,
        taxTotal,
        total,
        issuerName: organization.name,
        issuerCompany: organization.name,
        issuerAddress: organization.address || "",
        clientName,
        discount: discount || 0,
        clientCompany,
        clientAddress,
        QuotationItem: {
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
        QuotationItem: true,
        Project: true,
      },
    });

    return NextResponse.json(
      {
        statusCode: 201,
        data: quotation,
        message: "quotation created successfully",
        success: true,
      },
      { status: 201 }
    );
  })(req, context);
