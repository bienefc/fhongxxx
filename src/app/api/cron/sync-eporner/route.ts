import { NextRequest, NextResponse } from "next/server";
import { runEpornerSync } from "@/lib/sync-eporner";

// GET /api/cron/sync-eporner
// Called by Vercel Cron or external scheduler every 6 hours
// Protected by Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runEpornerSync();
  return NextResponse.json(result);
}
