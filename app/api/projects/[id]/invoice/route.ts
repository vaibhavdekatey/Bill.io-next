import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

export const POST = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found" }, { status: 401 });
  }

  const projectId = (await context.params).id;

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: { ProjectItem: true, Client: true, Organization: true },
  });

  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }
  if (project.ProjectItem.length === 0) {
    return NextResponse.json({ message: "Project has no items to invoice" }, { status: 400 });
  }

  const subtotal = project.ProjectItem.reduce(
    (sum: number, item: any) => sum + Number(item.total),
    0,
  );
  const taxTotal = 0;
  const discount = 0;
  const total = subtotal + taxTotal - discount;

  const latestInvoice = await prisma.invoice.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });

  let nextNumber = "INV-001";
  if (latestInvoice && latestInvoice.number) {
    const match = latestInvoice.number.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10) + 1;
      nextNumber = `INV-${num.toString().padStart(3, "0")}`;
    } else {
      const count = await prisma.invoice.count({
        where: { organizationId },
      });
      nextNumber = `INV-${(count + 1).toString().padStart(3, "0")}`;
    }
  }

  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
      projectId: project.id,
      clientId: project.clientId,
      number: nextNumber,
      status: "DRAFT",
      currency: project.currency || "USD",
      issueDate,
      dueDate,
      subtotal,
      taxTotal,
      discount,
      total,
      updatedAt: new Date(),
      issuerName: project.Organization?.name || "Organization",
      issuerCompany: project.Organization?.name || "",
      issuerAddress: (project.Organization?.address as any) || {},
      clientName: project.Client?.name || "",
      clientCompany: project.Client?.companyName || "",
      clientAddress: (project.Client?.address as any) || {},
      InvoiceItem: {
        create: project.ProjectItem.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
  });

  return NextResponse.json({ statusCode: 201, data: invoice, message: "Invoice generated", success: true }, { status: 201 });
})(req, context);
