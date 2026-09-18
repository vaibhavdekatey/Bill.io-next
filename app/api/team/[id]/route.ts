import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

// PATCH /api/team/[id] — update member role or title
export const PATCH = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);
    const memberId = (await context.params).id;

    const callerMember = await prisma.organizationMember.findFirst({
      where: { userId: user.userId, organizationId },
    });

    if (!callerMember || !["OWNER", "ADMIN"].includes(callerMember.role.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: "Only organization Owners or Admins can edit team members" },
        { status: 403 }
      );
    }

    const targetMember = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, message: "Member not found in this organization" },
        { status: 404 }
      );
    }

    if (targetMember.role.toUpperCase() === "OWNER" && callerMember.userId !== targetMember.userId) {
      return NextResponse.json(
        { success: false, message: "Cannot modify the Organization Owner's role" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data: Record<string, any> = {};

    if (body.role && ["OWNER", "ADMIN", "MEMBER"].includes(body.role.toUpperCase())) {
      // Only an OWNER can promote someone to OWNER
      if (body.role.toUpperCase() === "OWNER" && callerMember.role.toUpperCase() !== "OWNER") {
        return NextResponse.json(
          { success: false, message: "Only the current Owner can transfer Ownership" },
          { status: 403 }
        );
      }
      data.role = body.role.toUpperCase();
    }

    if (body.title !== undefined) {
      data.title = typeof body.title === "string" ? body.title.trim() || null : null;
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data,
    });

    return NextResponse.json(
      { success: true, data: updated, message: "Member updated successfully" },
      { status: 200 }
    );
  })(req, context);

// DELETE /api/team/[id] — remove a member or delete a pending invite
export const DELETE = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);
    const id = (await context.params).id;

    const callerMember = await prisma.organizationMember.findFirst({
      where: { userId: user.userId, organizationId },
    });

    if (!callerMember || !["OWNER", "ADMIN"].includes(callerMember.role.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: "Only organization Owners or Admins can remove members" },
        { status: 403 }
      );
    }

    // Check if it's an OrganizationInvite first
    const invite = await prisma.organizationInvite.findFirst({
      where: { id, organizationId },
    });

    if (invite) {
      await prisma.organizationInvite.delete({ where: { id } });
      return NextResponse.json(
        { success: true, message: "Invitation cancelled successfully" },
        { status: 200 }
      );
    }

    // Otherwise check OrganizationMember
    const member = await prisma.organizationMember.findFirst({
      where: { id, organizationId },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member or invite not found" },
        { status: 404 }
      );
    }

    if (member.role.toUpperCase() === "OWNER") {
      return NextResponse.json(
        { success: false, message: "Cannot remove the Organization Owner" },
        { status: 400 }
      );
    }

    await prisma.organizationMember.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: "Member removed from organization" },
      { status: 200 }
    );
  })(req, context);
