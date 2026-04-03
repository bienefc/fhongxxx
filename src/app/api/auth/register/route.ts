import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = schema.parse(body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: existing.email === email.toLowerCase() ? "Email already in use" : "Username taken" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        displayName: username,
        passwordHash,
        role: "USER",
      },
      select: { id: true, username: true, email: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
