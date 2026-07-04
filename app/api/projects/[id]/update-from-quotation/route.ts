import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

export const PUT = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found" }, { status: 401 });
  }

  const id = (await context.params).id;

  const project = await prisma.project.findFirst({
    where: { id, organizationId },
    include: { Quotation: { include: { QuotationItem: true } } },
  });

  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }
  if (!project.Quotation) {
    return NextResponse.json({ message: "Project is not linked to a quotation" }, { status: 400 });
  }

  const quotation = project.Quotation;

  // Delete existing project items
  await prisma.projectItem.deleteMany({
    where: { projectId: id },
  });

  // Recreate project items from quotation
  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      currency: quotation.currency || "USD",
      ProjectItem: {
        create: quotation.QuotationItem.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
    include: { ProjectItem: true, Client: true, Quotation: true },
  });

  return NextResponse.json(
    { statusCode: 200, data: updatedProject, message: "Project synced with quotation successfully", success: true },
    { status: 200 }
  );
})(req, context);
