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
  const body = await req.json().catch(() => ({}));
  const { status } = body;

  const project = await prisma.project.updateMany({
    where: { id, organizationId },
    data: { status },
  });

  if (project.count === 0) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ statusCode: 200, data: null, message: "Status updated successfully", success: true }, { status: 200 });
})(req, context);
