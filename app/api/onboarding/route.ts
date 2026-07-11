import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { ApiError } from "@/lib/utils/ApiError";

export const POST = (req: Request, context: any) =>
  withAuth(async (req, user) => {
    const userId = user.userId;
    const body = await req.json();
    const { organizationName, accountType, taxId, email, phone, address, website } = body;

    if (!organizationName || organizationName.trim() === "") {
      throw new ApiError(400, "Organization name is required");
    }

    if (taxId) {
      const gstinRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(taxId)) {
        throw new ApiError(400, "Invalid GSTIN format");
      }
    }

    const newOrganization = await prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.create({
        data: {
          id: randomUUID(),
          name: organizationName,
          taxId: taxId || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          address: address || null,
        },
      });

      await tx.organizationMember.create({
        data: {
          id: randomUUID(),
          userId: userId,
          organizationId: org.id,
          role: "OWNER",
          title: accountType === "freelancer" ? "Freelancer" : "Founder",
        },
      });

      return org;
    });

    return NextResponse.json(
      { success: true, data: newOrganization, message: "Workspace setup successfully." },
      { status: 201 }
    );
  })(req, context);
