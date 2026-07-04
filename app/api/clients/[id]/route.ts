import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser, normalize } from "@/lib/utils/helperFunctions";

export const GET = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const id = (await context.params).id;
  if (!id) {
    return NextResponse.json({ message: "Client ID is required" }, { status: 400 });
  }
  const organizationId = await getOrganizationIdForUser(user.userId);
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
  const organizationId = await getOrganizationIdForUser(user.userId);
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
  const taxId = normalize(body.taxId);
  const address = body.address;
  
  if (!name) {
    return NextResponse.json({ message: "Client name is required" }, { status: 400 });
  }
  
  const updated = await prisma.client.update({
    where: { id },
    data: {
      name,
      companyName,
      email,
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
    return NextResponse.json({ message: "Client ID is required" }, { status: 400 });
  }
  const organizationId = await getOrganizationIdForUser(user.userId);
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
  await prisma.client.delete({
    where: { id },
  });
  return NextResponse.json({ statusCode: 200, data: null, message: "Client deleted successfully", success: true }, { status: 200 });
})(req, context);
