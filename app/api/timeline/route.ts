import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

// GET /api/timeline — aggregate cashflow milestones, project deadlines, and activities
export const GET = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);

    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [upcomingInvoices, recentPaidInvoices, activeQuotations, activeProjects] =
      await Promise.all([
        // 1. Pending & Overdue Invoices
        prisma.invoice.findMany({
          where: {
            organizationId,
            status: { in: ["SENT", "DRAFT"] },
          },
          select: {
            id: true,
            number: true,
            total: true,
            currency: true,
            status: true,
            clientName: true,
            issueDate: true,
            dueDate: true,
            createdAt: true,
          },
          orderBy: { dueDate: "asc" },
        }),

        // 2. Recently Paid Invoices (Last 30 days)
        prisma.invoice.findMany({
          where: {
            organizationId,
            status: "PAID",
            updatedAt: { gte: thirtyDaysAgo },
          },
          select: {
            id: true,
            number: true,
            total: true,
            currency: true,
            status: true,
            clientName: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),

        // 3. Active Quotations with expiry dates
        prisma.quotation.findMany({
          where: {
            organizationId,
            status: { in: ["SENT", "DRAFT"] },
          },
          select: {
            id: true,
            number: true,
            total: true,
            currency: true,
            status: true,
            clientName: true,
            validUntil: true,
            createdAt: true,
          },
          orderBy: { validUntil: "asc" },
        }),

        // 4. Active Projects
        prisma.project.findMany({
          where: {
            organizationId,
            status: { in: ["ACTIVE", "ON_HOLD"] },
          },
          include: {
            Client: { select: { name: true, companyName: true } },
            _count: { select: { Invoice: true, ProjectItem: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    // Construct unified activity feed
    const activities: Array<{
      id: string;
      type: "INVOICE_PAID" | "INVOICE_DUE" | "QUOTATION_EXPIRING" | "PROJECT_ACTIVE";
      title: string;
      description: string;
      amount?: string;
      date: Date;
      badge: string;
      link: string;
    }> = [];

    // Add paid invoices
    recentPaidInvoices.forEach((inv) => {
      activities.push({
        id: `paid-${inv.id}`,
        type: "INVOICE_PAID",
        title: `Payment Received for ${inv.number}`,
        description: `Payment from ${inv.clientName} was marked as Paid`,
        amount: `${inv.currency} ${Number(inv.total).toLocaleString("en-IN")}`,
        date: inv.updatedAt,
        badge: "Paid",
        link: `/invoices/${inv.id}`,
      });
    });

    // Add upcoming/overdue invoice milestones
    upcomingInvoices.forEach((inv) => {
      if (!inv.dueDate) return;
      const isPast = new Date(inv.dueDate) < now;
      activities.push({
        id: `due-${inv.id}`,
        type: "INVOICE_DUE",
        title: `${inv.number} ${isPast ? "Overdue" : "Due"}`,
        description: `Due from ${inv.clientName}`,
        amount: `${inv.currency} ${Number(inv.total).toLocaleString("en-IN")}`,
        date: new Date(inv.dueDate),
        badge: isPast ? "Overdue" : "Due Soon",
        link: `/invoices/${inv.id}`,
      });
    });

    // Add quotation expiry events
    activeQuotations.forEach((quo) => {
      if (!quo.validUntil) return;
      activities.push({
        id: `quo-${quo.id}`,
        type: "QUOTATION_EXPIRING",
        title: `Quotation ${quo.number} Expiration`,
        description: `Offer for ${quo.clientName} expires`,
        amount: `${quo.currency} ${Number(quo.total).toLocaleString("en-IN")}`,
        date: new Date(quo.validUntil),
        badge: "Expires",
        link: `/quotations/${quo.id}`,
      });
    });

    // Sort all milestones chronologically
    activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(
      {
        success: true,
        data: {
          upcomingInvoices,
          recentPaidInvoices,
          activeQuotations,
          activeProjects,
          activities,
        },
        message: "Timeline aggregated successfully",
      },
      { status: 200 }
    );
  })(req, context);
