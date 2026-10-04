import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser, isOrgAdminOrOwner } from "@/lib/utils/helperFunctions";

export const GET = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);
  const id = (await context.params).id;

  const project = await prisma.project.findFirst({
    where: { id, organizationId },
    include: {
      Client: true,
      Quotation: true,
      ProjectItem: true,
      Invoice: true,
    },
  });

  if (!project) {
    return NextResponse.json({ message: "Project not found", success: false }, { status: 404 });
  }

  return NextResponse.json({ statusCode: 200, data: project, message: "Project fetched successfully", success: true }, { status: 200 });
})(req, context);

export const DELETE = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);
  const id = (await context.params).id;

  const isAdmin = await isOrgAdminOrOwner(user.userId, organizationId, user.orgRole);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, message: "Only organization Owners or Admins can delete projects" },
      { status: 403 }
    );
  }

  const project = await prisma.project.findFirst({
    where: { id, organizationId },
  });

  if (!project) {
    return NextResponse.json({ message: "Project not found", success: false }, { status: 404 });
  }

  const invoiceCount = await prisma.invoice.count({
    where: { projectId: id },
  });
  if (invoiceCount > 0) {
    return NextResponse.json(
      {
        success: false,
        message: `Cannot delete project: associated with ${invoiceCount} invoice(s). Remove or reassign those first.`,
      },
      { status: 409 }
    );
  }

  await prisma.project.delete({
    where: { id },
  });

  return NextResponse.json({ statusCode: 200, data: null, message: "Project deleted successfully", success: true }, { status: 200 });
})(req, context);
