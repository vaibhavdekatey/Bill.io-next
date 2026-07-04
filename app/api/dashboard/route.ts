import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

export const GET = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user" }, { status: 404 });
  }

  const clientsCount = await prisma.client.count({ where: { organizationId } });
  const invoicesCount = await prisma.invoice.count({ where: { organizationId } });
  const quotationsCount = await prisma.quotation.count({ where: { organizationId } });
  const projectsCount = await prisma.project.count({ where: { organizationId } });

  const recentClients = await prisma.client.findMany({
    where: { organizationId },
    orderBy: { id: 'desc' },
    take: 5,
    select: { id: true, name: true, email: true, companyName: true }
  });

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
