import { prisma } from "@/lib/prisma";
import { ApiError } from "./ApiError";
import crypto from "crypto";

import { normalize } from "./calculations";

export * from "./calculations";

export const generateShareToken = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const generateNextNumber = async (
  organizationId: string,
  str: string,
  customPrefix?: string,
) => {
  const isInvoice = str === "INV";
  const prefix = (customPrefix && customPrefix.trim()) || (isInvoice ? "INV" : "QUO");

  if (isInvoice) {
    const lastInvoice = await prisma.invoice.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    });
    if (!lastInvoice) return `${prefix}-001`;
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(`^${escapedPrefix}-(\\d+)$`);
    const match = lastInvoice.number.match(prefixRegex) || lastInvoice.number.match(/(\d+)$/);
    const lastNumber = match && match[1] ? parseInt(match[1], 10) : 0;
    return `${prefix}-${String(lastNumber + 1).padStart(3, "0")}`;
  }

  const lastQuotation = await prisma.quotation.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });
  if (!lastQuotation) return `${prefix}-001`;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefixRegex = new RegExp(`^${escapedPrefix}-(\\d+)$`);
  const match = lastQuotation.number.match(prefixRegex) || lastQuotation.number.match(/(\d+)$/);
  const lastNumber = match && match[1] ? parseInt(match[1], 10) : 0;
  return `${prefix}-${String(lastNumber + 1).padStart(3, "0")}`;
};

export const getOrganizationIdForUser = async (userId: string, cachedOrgId?: string) => {
  if (cachedOrgId) return cachedOrgId;

  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    select: { organizationId: true },
  });

  if (!membership) {
    throw new ApiError(404, "No organization membership found");
  }

  return membership.organizationId;
};

export const getUserRoleInOrg = async (userId: string, organizationId: string): Promise<string> => {
  const member = await prisma.organizationMember.findFirst({
    where: { userId, organizationId },
    select: { role: true },
  });
  return member?.role?.toUpperCase() || "MEMBER";
};

export const isOrgAdminOrOwner = async (
  userId: string,
  organizationId: string,
  cachedRole?: string,
): Promise<boolean> => {
  if (cachedRole !== undefined && cachedRole !== null) {
    const roleUpper = cachedRole.toUpperCase();
    return roleUpper === "OWNER" || roleUpper === "ADMIN";
  }
  const role = await getUserRoleInOrg(userId, organizationId);
  return ["OWNER", "ADMIN"].includes(role);
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
  const phoneNumber = normalize(body.clientPhone);
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
      phoneNumber,
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
