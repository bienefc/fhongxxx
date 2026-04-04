import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    // Delete any existing reset tokens for this email
    await prisma.emailToken.deleteMany({
      where: { email: email.toLowerCase(), type: "PASSWORD_RESET" },
    });

    const record = await prisma.emailToken.create({
      data: {
        type: "PASSWORD_RESET",
        email: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await sendPasswordResetEmail(email.toLowerCase(), record.token);

    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
