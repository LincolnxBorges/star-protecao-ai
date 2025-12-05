import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/settings";
import {
  getLogs,
  getLogStats,
  clearLogs,
  clearOldLogs,
  type LogLevel,
} from "@/lib/logger";

/**
 * GET /api/settings/logs
 * Get system logs with optional filtering
 *
 * Query params:
 * - level: Filter by log level (debug, info, warning, error)
 * - source: Filter by source
 * - limit: Maximum number of logs to return (default: 100)
 * - since: ISO date string to filter logs after
 * - stats: If "true", return statistics instead of logs
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") as LogLevel | null;
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const since = searchParams.get("since");
    const statsOnly = searchParams.get("stats") === "true";

    if (statsOnly) {
      const stats = getLogStats();
      return NextResponse.json(stats);
    }

    const logs = getLogs({
      level: level || undefined,
      source: source || undefined,
      limit,
      since: since ? new Date(since) : undefined,
    });

    return NextResponse.json({
      logs,
      total: logs.length,
      stats: getLogStats(),
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar logs" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/settings/logs
 * Clear logs
 *
 * Body:
 * - olderThan: ISO date string to clear logs older than (optional)
 *   If not provided, clears all logs
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const olderThan = body.olderThan;

    let deletedCount: number;

    if (olderThan) {
      deletedCount = clearOldLogs(new Date(olderThan));
    } else {
      const stats = getLogStats();
      deletedCount = stats.total;
      clearLogs();
    }

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    console.error("Error clearing logs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao limpar logs" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
