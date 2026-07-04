import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

export const GET = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: {
      Client: true,
      Quotation: true,
      _count: {
        select: { Invoice: true, ProjectItem: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ statusCode: 200, data: projects, message: "Projects fetched successfully", success: true }, { status: 200 });
})(req, context);
