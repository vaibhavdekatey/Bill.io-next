import { withAuth } from "@/lib/api-handler";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationIdForUser } from "@/lib/utils/helperFunctions";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (url: string) => {
  try {
    const splitUrl = url.split("/upload/");
    if (splitUrl.length < 2) return null;

    let pathAfterUpload = splitUrl[1];
    const parts = pathAfterUpload.split("/");

    if (parts[0].match(/^v\d+$/)) {
      parts.shift();
    }

    const publicIdWithExtension = parts.join("/");
    const lastDotIndex = publicIdWithExtension.lastIndexOf(".");

    return lastDotIndex !== -1
      ? publicIdWithExtension.substring(0, lastDotIndex)
      : publicIdWithExtension;
  } catch (error) {
    return null;
  }
};

export const POST = (req: Request, context: any) =>
  withAuth(async (req, user, context) => {
    const organizationId = await getOrganizationIdForUser(user.userId);
    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization not found for user" },
        { status: 404 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No logo file provided" },
        { status: 400 },
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { logoUrl: true },
    });

    if (org?.logoUrl && org.logoUrl.includes("cloudinary.com")) {
      try {
        const publicId = extractPublicId(org.logoUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (e) {
        console.error("Error deleting old logo from Cloudinary:", e);
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const uploadResponse: any = await new Promise((resolve, reject) => {
        const folderName = process.env.CLOUDINARY_FOLDER || "bill.io/logos";
        cloudinary.uploader
          .upload_stream({ folder: folderName }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      const logoUrl = uploadResponse.secure_url;

      await prisma.organization.update({
        where: { id: organizationId },
        data: { logoUrl },
      });

      return NextResponse.json(
        {
          statusCode: 200,
          data: { logoUrl },
          message: "Logo uploaded successfully",
          success: true,
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return NextResponse.json(
        { message: "Failed to upload logo" },
        { status: 500 },
      );
    }
  })(req, context);

export const PUT = (req: Request, context: any) =>
  withAuth(async (req, user, context) => {
    const organizationId = await getOrganizationIdForUser(user.userId);
    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization not found for user" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const logoUrl = body.logoUrl;
    if (!logoUrl || typeof logoUrl !== "string") {
      return NextResponse.json(
        { message: "logoUrl is required and must be a string" },
        { status: 400 },
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { logoUrl: true },
    });

    if (
      org?.logoUrl &&
      org.logoUrl.includes("cloudinary.com") &&
      org.logoUrl !== logoUrl
    ) {
      try {
        const publicId = extractPublicId(org.logoUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (e) {
        console.error("Error deleting old logo from Cloudinary:", e);
      }
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { logoUrl },
    });

    return NextResponse.json(
      {
        statusCode: 200,
        data: { logoUrl },
        message: "Logo URL updated successfully",
        success: true,
      },
      { status: 200 },
    );
  })(req, context);

export const DELETE = (req: Request, context: any) =>
  withAuth(async (req, user, context) => {
    const organizationId = await getOrganizationIdForUser(user.userId);
    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization not found for user" },
        { status: 404 },
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { logoUrl: true },
    });

    if (org?.logoUrl && org.logoUrl.includes("cloudinary.com")) {
      try {
        const publicId = extractPublicId(org.logoUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (e) {
        console.error("Error deleting logo from Cloudinary:", e);
      }
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { logoUrl: null },
    });

    return NextResponse.json(
      {
        statusCode: 200,
        data: null,
        message: "Logo removed successfully",
        success: true,
      },
      { status: 200 },
    );
  })(req, context);
