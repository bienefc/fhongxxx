import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json());

    const record = await prisma.emailToken.findUnique({ where: { token } });

    if (!record || record.type !== "PASSWORD_RESET") {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      await prisma.emailToken.delete({ where: { token } });
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { passwordHash },
      }),
      prisma.emailToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
