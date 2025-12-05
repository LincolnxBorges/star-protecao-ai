import { NextRequest, NextResponse } from "next/server";
import { expireOldQuotations } from "@/lib/quotations";

// This endpoint can be called by:
// 1. Vercel Cron Jobs (vercel.json)
// 2. External cron services (e.g., cron-job.org)
// 3. Manual trigger for testing

export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, validate it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Invalid cron secret" },
        },
        { status: 401 }
      );
    }

    // Run expiration
    const expiredCount = await expireOldQuotations();

    return NextResponse.json({
      success: true,
      data: {
        expiredCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Cron expire quotations error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Erro ao expirar cotacoes",
        },
      },
      { status: 500 }
    );
  }
}
