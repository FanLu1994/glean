// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateDailyQuoteForDate } from "@/lib/generate-daily-quote";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateDailyQuoteForDate();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
