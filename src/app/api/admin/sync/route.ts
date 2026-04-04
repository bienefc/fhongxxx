import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runEpornerSync } from "@/lib/sync-eporner";

// POST /api/admin/sync — manually trigger sync from admin panel
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runEpornerSync();
  return NextResponse.json(result);
}
