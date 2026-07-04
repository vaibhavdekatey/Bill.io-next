import { prisma } from "@/lib/prisma";
import { ApiError } from "./ApiError";

type ItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
};

export const normalize = (value?: string | null) => value?.trim() || null;

export const calculateTotals = (items: ItemInput[], discount: number) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0,
  );

  const discountedAmount = (subtotal * discount) / 100;

  const discountedSubtotal = subtotal - discountedAmount;

  const taxTotal = items.reduce((sum, item) => {
    const lineBase = Number(item.quantity) * Number(item.unitPrice);
    return sum + (lineBase * Number(item.taxPercent || 0)) / 100;
  }, 0);

  return {
    subtotal,
    taxTotal,
    total: subtotal - discountedAmount + taxTotal,
  };
};

export const generateNextNumber = async (
  organizationId: string,
  str: string,
) => {
  if (str === "INV") {
    const lastInovice = await prisma.invoice.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    });
    if (!lastInovice) return "INV-001";
    const match = lastInovice.number.match(/INV-(\d+)/);
    const lastNumber = match && match[1] ? parseInt(match[1], 10) : 0;
    return `INV-${String(lastNumber + 1).padStart(3, "0")}`;
  }
  const lastQuotation = await prisma.quotation.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });
  if (!lastQuotation) return "QUO-001";
  const match = lastQuotation.number.match(/QUO-(\d+)/);
  const lastNumber = match && match[1] ? parseInt(match[1], 10) : 0;
  return `QUO-${String(lastNumber + 1).padStart(3, "0")}`;
};

export const getOrganizationIdForUser = async (userId: string) => {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    select: { organizationId: true },
  });

  if (!membership) {
    throw new ApiError(404, "No organization membership found");
  }

  return membership.organizationId;
};

export const resolveClient = async (organizationId: string, body: any) => {
  if (body.clientId) {
    const existingClient = await prisma.client.findFirst({
      where: {
        id: body.clientId,
        organizationId,
      },
    });

    if (!existingClient) {
      throw new ApiError(404, "Client not found");
    }

    return existingClient;
  }

  if (!body.saveClient) {
    return null;
  }

  const clientName = normalize(body.clientName);
  const companyName = normalize(body.clientCompany);
  const email = normalize(body.clientEmail);
  const taxId = normalize(body.clientTaxId);

  if (!clientName) {
    throw new ApiError(400, "Client name is required");
  }

  let existingClient = null;

  if (email) {
    existingClient = await prisma.client.findFirst({
      where: {
        organizationId,
        email,
      },
    });
  }

  if (!existingClient && taxId) {
    existingClient = await prisma.client.findFirst({
      where: {
        organizationId,
        taxId,
      },
    });
  }

  if (!existingClient) {
    existingClient = await prisma.client.findFirst({
      where: {
        organizationId,
        name: clientName,
        companyName,
      },
    });
  }

  if (existingClient) {
    return existingClient;
  }

  return prisma.client.create({
    data: {
      organizationId,
      name: clientName,
      companyName,
      email,
      taxId,
      address: body.clientAddress ?? null,
    },
  });
};

export const formatAddress = (addr: any) => {
  if (!addr) return "-";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    // Handle old format
    if (addr.full) return addr.full;
    if (addr.address) return addr.address;

    const lines = [addr.line1, addr.line2, addr.line3].filter(Boolean);
    const cityStateZip = [addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(", ");
    if (cityStateZip) lines.push(cityStateZip);

    return lines.join("\n");
  }
  return "-";
};
