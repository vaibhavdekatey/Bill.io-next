import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/team/join — accept invite token and join organization
export const POST = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Invitation token is required" },
        { status: 400 }
      );
    }

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { Organization: true },
    });

    if (!invite) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired invitation link" },
        { status: 404 }
      );
    }

    if (new Date(invite.expiresAt) < new Date()) {
      await prisma.organizationInvite.delete({ where: { token } });
      return NextResponse.json(
        { success: false, message: "This invitation link has expired" },
        { status: 410 }
      );
    }

    // Check if the user is already a member of this organization
    const existingMember = await prisma.organizationMember.findFirst({
      where: { userId: user.userId, organizationId: invite.organizationId },
    });

    if (existingMember) {
      await prisma.organizationInvite.delete({ where: { token } });
      return NextResponse.json(
        {
          success: true,
          data: { organization: invite.Organization },
          message: "You are already a member of this organization",
        },
        { status: 200 }
      );
    }

    // Add user as OrganizationMember
    const newMember = await prisma.organizationMember.create({
      data: {
        userId: user.userId,
        organizationId: invite.organizationId,
        role: invite.role,
        title: invite.title,
      },
    });

    // Delete used invite
    await prisma.organizationInvite.delete({ where: { token } });

    return NextResponse.json(
      {
        success: true,
        data: {
          member: newMember,
          organization: invite.Organization,
        },
        message: `Successfully joined ${invite.Organization.name}!`,
      },
      { status: 200 }
    );
  })(req, context);
