import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { registerRateLimiter, getClientIp } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = registerRateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateCheck.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const { email, name, password, phoneNumber } = await req.json();

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const trimmedName = typeof name === "string" ? name.trim() || null : null;
    const trimmedPhone = typeof phoneNumber === "string" ? phoneNumber.trim() || null : null;

    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: normalizedEmail,
        name: trimmedName,
        phoneNumber: trimmedPhone,
        AuthAccount: {
          create: {
            id: randomUUID(),
            provider: "credentials",
            providerAccountId: normalizedEmail,
            passwordHash,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "User registered successfully", user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

