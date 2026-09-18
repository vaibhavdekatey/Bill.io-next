import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

// GET /api/team — fetch all members and pending invites for the organization
export const GET = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);

    const [members, invites, currentMember] = await Promise.all([
      prisma.organizationMember.findMany({
        where: { organizationId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              createdAt: true,
            },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.organizationInvite.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.organizationMember.findFirst({
        where: { userId: user.userId, organizationId },
        select: { role: true, title: true },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          members,
          invites,
          currentUserRole: currentMember?.role || "MEMBER",
        },
        message: "Team members and invites fetched successfully",
      },
      { status: 200 }
    );
  })(req, context);
