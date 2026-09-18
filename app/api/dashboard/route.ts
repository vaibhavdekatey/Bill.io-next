import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

export const GET = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user" }, { status: 404 });
  }

  const [
    clientsCount,
    invoicesCount,
    quotationsCount,
    projectsCount,
    recentClients
  ] = await Promise.all([
    prisma.client.count({ where: { organizationId } }),
    prisma.invoice.count({ where: { organizationId } }),
    prisma.quotation.count({ where: { organizationId } }),
    prisma.project.count({ where: { organizationId } }),
    prisma.client.findMany({
      where: { organizationId },
      orderBy: { id: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, companyName: true }
    })
  ]);

  return NextResponse.json({
    statusCode: 200,
    data: {
      clients: clientsCount,
      invoices: invoicesCount,
      quotations: quotationsCount,
      projects: projectsCount,
      recentClients
    },
    message: "Dashboard stats fetched successfully",
    success: true
  }, { status: 200 });
})(req, context);
