import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

export const GET = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
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
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ statusCode: 200, data: project, message: "Project fetched successfully", success: true }, { status: 200 });
})(req, context);

export const DELETE = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  const id = (await context.params).id;

  const project = await prisma.project.findFirst({
    where: { id, organizationId },
  });

  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({
    where: { id },
  });

  return NextResponse.json({ statusCode: 200, data: null, message: "Project deleted successfully", success: true }, { status: 200 });
})(req, context);
