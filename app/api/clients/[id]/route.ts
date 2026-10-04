import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser, isOrgAdminOrOwner, normalize } from "@/lib/utils/helperFunctions";

export const GET = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const id = (await context.params).id;
  if (!id) {
    return NextResponse.json({ message: "Client ID is required" }, { status: 400 });
  }
  const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user" }, { status: 404 });
  }

  const client = await prisma.client.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      Project: true,
      Invoice: true,
      Quotation: true,
    },
  });

  if (!client) {
    return NextResponse.json({ message: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ statusCode: 200, data: client, message: "Client fetched successfully", success: true }, { status: 200 });
})(req, context);

export const PUT = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const id = (await context.params).id;
  if (!id) {
    return NextResponse.json({ message: "Client ID is required" }, { status: 400 });
  }
  const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user" }, { status: 404 });
  }
  const client = await prisma.client.findFirst({
    where: {
      id,
      organizationId,
    },
  });
  if (!client) {
    return NextResponse.json({ message: "Client not found" }, { status: 404 });
  }
  
  const body = await req.json();
  const name = normalize(body.name);
  const companyName = normalize(body.companyName);
  const email = normalize(body.email);
  const phoneNumber = normalize(body.phoneNumber);
  const taxId = normalize(body.taxId);
  const address = body.address;
  
  if (!name) {
    return NextResponse.json({ message: "Client name is required", success: false }, { status: 400 });
  }

  const duplicate = await prisma.client.findFirst({
    where: {
      organizationId,
      name,
      NOT: { id },
    },
  });
  if (duplicate) {
    return NextResponse.json(
      { message: "Another client with this name already exists in your organization", success: false },
      { status: 409 }
    );
  }
  
  const updated = await prisma.client.update({
    where: { id },
    data: {
      name,
      companyName,
      email,
      phoneNumber,
      taxId,
      address: address
        ? typeof address === "string"
          ? { address }
          : address
        : null,
    },
  });
  
  return NextResponse.json({ statusCode: 200, data: updated, message: "Client updated successfully", success: true }, { status: 200 });
})(req, context);

export const DELETE = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const id = (await context.params).id;
  if (!id) {
    return NextResponse.json({ message: "Client ID is required", success: false }, { status: 400 });
  }
  const organizationId = user.orgId || await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user", success: false }, { status: 404 });
  }

  const isAdmin = await isOrgAdminOrOwner(user.userId, organizationId, user.orgRole);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, message: "Only organization Owners or Admins can delete clients" },
      { status: 403 }
    );
  }

  const client = await prisma.client.findFirst({
    where: {
      id,
      organizationId,
    },
  });
  if (!client) {
    return NextResponse.json({ message: "Client not found", success: false }, { status: 404 });
  }

  const [invoiceCount, quoteCount, projectCount] = await Promise.all([
    prisma.invoice.count({ where: { clientId: id } }),
    prisma.quotation.count({ where: { clientId: id } }),
    prisma.project.count({ where: { clientId: id } }),
  ]);

  if (invoiceCount > 0 || quoteCount > 0 || projectCount > 0) {
    return NextResponse.json(
      {
        success: false,
        message: `Cannot delete client: associated with ${invoiceCount} invoice(s), ${quoteCount} quotation(s), and ${projectCount} project(s). Remove or reassign those first.`,
      },
      { status: 409 }
    );
  }

  await prisma.client.delete({
    where: { id },
  });
  return NextResponse.json({ statusCode: 200, data: null, message: "Client deleted successfully", success: true }, { status: 200 });
})(req, context);
