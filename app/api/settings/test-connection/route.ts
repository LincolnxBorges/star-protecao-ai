import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/settings";
import { testWhatsAppConnection } from "@/lib/integrations/whatsapp";
import { testSmtpConnection, type SmtpConfig } from "@/lib/integrations/smtp";
import type { WhatsAppSettings } from "@/lib/settings-schemas";

/**
 * POST /api/settings/test-connection
 * Test connection to WhatsApp or other services
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { type, settings } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Connection type is required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "whatsapp": {
        if (!settings) {
          return NextResponse.json(
            { error: "WhatsApp settings are required" },
            { status: 400 }
          );
        }

        const whatsappSettings = settings as WhatsAppSettings;
        const result = await testWhatsAppConnection(whatsappSettings);

        return NextResponse.json({
          type: "whatsapp",
          ...result,
        });
      }

      case "smtp": {
        if (!settings) {
          return NextResponse.json(
            { error: "Configuracoes SMTP sao obrigatorias" },
            { status: 400 }
          );
        }

        const smtpConfig: SmtpConfig = {
          server: settings.server,
          port: settings.port,
          user: settings.user,
          password: settings.password,
          useTls: settings.useTls ?? true,
        };

        const smtpResult = await testSmtpConnection(smtpConfig);

        return NextResponse.json({
          type: "smtp",
          connected: smtpResult.success,
          status: smtpResult.success ? "connected" : "error",
          error: smtpResult.error,
          serverInfo: smtpResult.serverInfo,
        });
      }

      case "viacep": {
        // Test ViaCEP API
        try {
          const response = await fetch("https://viacep.com.br/ws/01310100/json/", {
            signal: AbortSignal.timeout(2000),
          });

          if (response.ok) {
            return NextResponse.json({
              type: "viacep",
              connected: true,
              status: "connected",
            });
          }

          return NextResponse.json({
            type: "viacep",
            connected: false,
            status: "error",
            error: `Erro HTTP ${response.status}`,
          });
        } catch (error) {
          return NextResponse.json({
            type: "viacep",
            connected: false,
            status: "error",
            error: error instanceof Error ? error.message : "Erro ao testar ViaCEP",
          });
        }
      }

      case "wdapi2": {
        // Test WDAPI2 (FIPE) API
        const apiKey = settings?.apiKey;
        if (!apiKey) {
          return NextResponse.json({
            type: "wdapi2",
            connected: false,
            status: "error",
            error: "API Key nao configurada",
          });
        }

        try {
          const response = await fetch(
            "https://wdapi2.com.br/api/fipe/marcas/1",
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
              signal: AbortSignal.timeout(5000),
            }
          );

          if (response.ok) {
            return NextResponse.json({
              type: "wdapi2",
              connected: true,
              status: "connected",
            });
          }

          return NextResponse.json({
            type: "wdapi2",
            connected: false,
            status: "error",
            error: `Erro HTTP ${response.status}`,
          });
        } catch (error) {
          return NextResponse.json({
            type: "wdapi2",
            connected: false,
            status: "error",
            error: error instanceof Error ? error.message : "Erro ao testar WDAPI2",
          });
        }
      }

      case "fipe": {
        // Test FIPE API (Parallelum)
        const fipeUrl = settings?.url || "https://parallelum.com.br/fipe/api/v2";

        try {
          const response = await fetch(`${fipeUrl}/carros/marcas`, {
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            return NextResponse.json({
              type: "fipe",
              connected: true,
              status: "connected",
            });
          }

          return NextResponse.json({
            type: "fipe",
            connected: false,
            status: "error",
            error: `Erro HTTP ${response.status}`,
          });
        } catch (error) {
          return NextResponse.json({
            type: "fipe",
            connected: false,
            status: "error",
            error: error instanceof Error ? error.message : "Erro ao testar FIPE",
          });
        }
      }

      default:
        return NextResponse.json(
          { error: `Tipo de conexao desconhecido: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("POST /api/settings/test-connection error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to test connection" },
      { status: 500 }
    );
  }
}
