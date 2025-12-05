import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAuditLogs } from "@/lib/settings";
import { type SettingsCategory } from "@/lib/settings-schemas";

/**
 * GET /api/settings/audit
 * Get audit logs for settings changes
 *
 * Query params:
 * - category: Filter by settings category (optional)
 * - limit: Maximum number of logs to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as SettingsCategory | null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = await getAuditLogs(category || undefined, limit);

    // Transform logs to include formatted dates and user info
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      category: log.category,
      field: log.field,
      previousValue: log.previousValue,
      changedAt: log.changedAt?.toISOString() || new Date().toISOString(),
      // Add a human-readable description
      description: getChangeDescription(log.category, log.field),
    }));

    return NextResponse.json({
      logs: formattedLogs,
      total: formattedLogs.length,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar audit logs" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

/**
 * Get human-readable description for a field change
 */
function getChangeDescription(category: string, field: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    company: {
      "": "Dados da empresa",
    },
    quotation: {
      "": "Regras de cotacao",
    },
    whatsapp: {
      apiKey: "Chave da API WhatsApp",
      instanceId: "ID da instancia WhatsApp",
      "": "Configuracoes WhatsApp",
    },
    notification: {
      "smtp.password": "Senha SMTP",
      "smtp.user": "Usuario SMTP",
      "": "Configuracoes de notificacao",
    },
    system: {
      "wdapi.apiKey": "Chave da API WDAPI",
      "wdapi.username": "Usuario WDAPI",
      "wdapi.password": "Senha WDAPI",
      "": "Configuracoes do sistema",
    },
  };

  const categoryDescriptions = descriptions[category] || {};
  return categoryDescriptions[field] || categoryDescriptions[""] || `Campo ${field} em ${category}`;
}
