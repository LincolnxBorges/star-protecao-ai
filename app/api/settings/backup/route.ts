import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  createBackup,
  listBackups,
  deleteBackup,
  cleanupOldBackups,
} from "@/lib/settings";

/**
 * GET /api/settings/backup
 * List all backups
 */
export async function GET() {
  try {
    await requireAdmin();

    const backups = await listBackups();

    return NextResponse.json({
      backups: backups.map((backup) => ({
        ...backup,
        createdAt: backup.createdAt.toISOString(),
        sizeFormatted: formatBytes(backup.size),
      })),
    });
  } catch (error) {
    console.error("GET /api/settings/backup error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to list backups" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/backup
 * Create a new backup
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const type = body.type === "automatic" ? "automatic" : "manual";

    const result = await createBackup(type);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Falha ao criar backup" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filename: result.filename,
      size: result.size,
      sizeFormatted: formatBytes(result.size || 0),
    });
  } catch (error) {
    console.error("POST /api/settings/backup error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/backup
 * Delete a backup or cleanup old backups
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get("filename");
    const retentionDays = searchParams.get("retentionDays");

    // If retentionDays is provided, cleanup old backups
    if (retentionDays) {
      const days = parseInt(retentionDays, 10);
      if (isNaN(days) || days < 1) {
        return NextResponse.json(
          { error: "retentionDays deve ser um numero positivo" },
          { status: 400 }
        );
      }

      const deletedCount = await cleanupOldBackups(days);

      return NextResponse.json({
        success: true,
        deletedCount,
        message: `${deletedCount} backup(s) removido(s)`,
      });
    }

    // If filename is provided, delete specific backup
    if (filename) {
      const deleted = await deleteBackup(filename);

      if (!deleted) {
        return NextResponse.json(
          { error: "Backup nao encontrado ou nao pode ser removido" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Backup removido com sucesso",
      });
    }

    return NextResponse.json(
      { error: "Informe filename ou retentionDays" },
      { status: 400 }
    );
  } catch (error) {
    console.error("DELETE /api/settings/backup error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to delete backup" },
      { status: 500 }
    );
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
