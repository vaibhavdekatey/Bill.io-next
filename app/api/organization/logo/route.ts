import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";
import fs from "fs";
import path from "path";

export const POST = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;
  
  if (!file) {
    return NextResponse.json({ message: "No logo file provided" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { logoUrl: true },
  });

  if (org?.logoUrl) {
    const oldPath = path.join(process.cwd(), "public", org.logoUrl);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}-${file.name}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  
  const logoUrl = `/uploads/logos/${filename}`;

  await prisma.organization.update({
    where: { id: organizationId },
    data: { logoUrl },
  });

  return NextResponse.json({ statusCode: 200, data: { logoUrl }, message: "Logo uploaded successfully", success: true }, { status: 200 });
})(req, context);

export const PUT = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user" }, { status: 404 });
  }

  const body = await req.json();
  const logoUrl = body.logoUrl;
  if (!logoUrl || typeof logoUrl !== "string") {
    return NextResponse.json({ message: "logoUrl is required and must be a string" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { logoUrl: true },
  });

  if (org?.logoUrl && org.logoUrl.startsWith("/uploads/")) {
    const oldPath = path.join(process.cwd(), "public", org.logoUrl);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { logoUrl },
  });

  return NextResponse.json({ statusCode: 200, data: { logoUrl }, message: "Logo URL updated successfully", success: true }, { status: 200 });
})(req, context);

export const DELETE = (req: Request, context: any) => withAuth(async (req, user, context) => {
  const organizationId = await getOrganizationIdForUser(user.userId);
  if (!organizationId) {
    return NextResponse.json({ message: "Organization not found for user" }, { status: 404 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { logoUrl: true },
  });

  if (org?.logoUrl && org.logoUrl.startsWith("/uploads/")) {
    const oldPath = path.join(process.cwd(), "public", org.logoUrl);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { logoUrl: null },
  });

  return NextResponse.json({ statusCode: 200, data: null, message: "Logo removed successfully", success: true }, { status: 200 });
})(req, context);
