import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  exportSettings,
  exportTemplates,
  type ExportFormat,
} from "@/lib/settings";

/**
 * GET /api/settings/export
 * Export settings or templates in JSON/CSV format
 *
 * Query params:
 * - type: "settings" | "templates" (default: "settings")
 * - format: "json" | "csv" (default: "json")
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "settings";
    const format = (searchParams.get("format") || "json") as ExportFormat;

    if (!["json", "csv"].includes(format)) {
      return NextResponse.json(
        { error: "Formato deve ser 'json' ou 'csv'" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "settings":
        result = await exportSettings(format);
        break;
      case "templates":
        result = await exportTemplates(format);
        break;
      default:
        return NextResponse.json(
          { error: "Tipo deve ser 'settings' ou 'templates'" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Falha na exportacao" },
        { status: 500 }
      );
    }

    // Return as downloadable file
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/settings/export error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
