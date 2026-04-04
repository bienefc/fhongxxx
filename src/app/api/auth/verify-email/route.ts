import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?error=missing", req.url));
  }

  const record = await prisma.emailToken.findUnique({ where: { token } });

  if (!record || record.type !== "EMAIL_VERIFICATION") {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
  }

  if (record.expiresAt < new Date()) {
    await prisma.emailToken.delete({ where: { token } });
    return NextResponse.redirect(new URL("/verify-email?error=expired", req.url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { verified: true },
    }),
    prisma.emailToken.delete({ where: { token } }),
  ]);

  return NextResponse.redirect(new URL("/?verified=1", req.url));
}
