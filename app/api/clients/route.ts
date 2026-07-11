import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser, normalize } from "@/lib/utils/helperFunctions";

export const GET = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user" }, { status: 404 });
  }

  const clients = await prisma.client.findMany({
    where: { organizationId },
    include: {
      Project: true,
      Invoice: true,
      Quotation: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({ statusCode: 200, data: clients, message: "Clients fetched Successfullly", success: true }, { status: 200 });
})(req, context);

export const POST = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user" }, { status: 404 });
  }

  const body = await req.json();
  const name = normalize(body.name);
  const companyName = normalize(body.companyName);
  const email = normalize(body.email);
  const phoneNumber = normalize(body.phoneNumber);
  const taxId = normalize(body.taxId);
  const address = body.address;

  if (!name) {
    return NextResponse.json({ message: "Client name is Required" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      organizationId,
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

  return NextResponse.json({ statusCode: 200, data: client, message: "Clients fetched Successfullly", success: true }, { status: 200 });
})(req, context);
