import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";

// GET /api/organization — fetch current org data
export const GET = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: org, message: "Organization fetched successfully" },
      { status: 200 }
    );
  })(req, context);

// PATCH /api/organization — update org details
export const PATCH = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);
    const body = await req.json();

    const normalize = (v: any) =>
      typeof v === "string" ? v.trim() || null : undefined;

    const name = normalize(body.name);
    const email = normalize(body.email);
    const phone = normalize(body.phone);
    const website = normalize(body.website);
    const taxId = normalize(body.taxId);

    const data: Record<string, any> = {};
    if (name !== undefined) {
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Organization name cannot be empty" },
          { status: 400 }
        );
      }
      data.name = name;
    }
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (website !== undefined) data.website = website;
    if (taxId !== undefined) data.taxId = taxId;

    // Address: accept structured object
    if (body.address !== undefined) {
      data.address = body.address;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data,
    });

    return NextResponse.json(
      { success: true, data: updated, message: "Organization updated successfully" },
      { status: 200 }
    );
  })(req, context);
