import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

export const POST = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found" }, { status: 401 });
  }

  const quotationId = (await context.params).quotationId;
  const body = await req.json().catch(() => ({}));
  const { name, description } = body;

  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, organizationId },
    include: { QuotationItem: true, Client: true },
  });

  if (!quotation) {
    return NextResponse.json({ message: "Quotation not found" }, { status: 404 });
  }

  const existingProject = await prisma.project.findFirst({
    where: { quotationId: quotation.id, organizationId },
  });

  if (existingProject) {
    return NextResponse.json({ message: "A project has already been created from this quotation" }, { status: 400 });
  }

  const project = await prisma.$transaction(async (tx: any) => {
    const newProject = await tx.project.create({
      data: {
        organizationId,
        clientId: quotation.clientId,
        quotationId: quotation.id,
        name: name || quotation.Client?.name || "Converted Project",
        description:
          description || `Project created from Quotation ${quotation.number}`,
        currency: quotation.currency || "USD",
        status: "ACTIVE",
        ProjectItem: {
          create: quotation.QuotationItem.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: { ProjectItem: true, Client: true },
    });

    if (quotation.status !== "ACCEPTED") {
      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: "ACCEPTED" },
      });
    }

    return newProject;
  });

  return NextResponse.json({ statusCode: 201, data: project, message: "Project created successfully", success: true }, { status: 201 });
})(req, context);
