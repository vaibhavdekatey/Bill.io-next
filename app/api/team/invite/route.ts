import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";
import crypto from "crypto";

// POST /api/team/invite — invite a teammate by email
export const POST = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);

    // Verify caller has permissions (OWNER or ADMIN)
    const callerMember = await prisma.organizationMember.findFirst({
      where: { userId: user.userId, organizationId },
    });

    if (!callerMember || !["OWNER", "ADMIN"].includes(callerMember.role.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: "Only organization Owners or Admins can invite team members" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = typeof body.role === "string" && ["ADMIN", "MEMBER"].includes(body.role.toUpperCase())
      ? body.role.toUpperCase()
      : "MEMBER";
    const title = typeof body.title === "string" ? body.title.trim() || null : null;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required" },
        { status: 400 }
      );
    }

    // Check if the user is already a member of this organization
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        OrganizationMember: {
          where: { organizationId },
        },
      },
    });

    if (existingUser && existingUser.OrganizationMember.length > 0) {
      return NextResponse.json(
        { success: false, message: "User is already a member of this organization" },
        { status: 400 }
      );
    }

    // Generate token and 7-day expiration
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.organizationInvite.upsert({
      where: {
        organizationId_email: {
          organizationId,
          email,
        },
      },
      update: {
        role,
        title,
        token,
        expiresAt,
      },
      create: {
        organizationId,
        email,
        role,
        title,
        token,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: invite,
        message: "Invitation created successfully",
      },
      { status: 201 }
    );
  })(req, context);
