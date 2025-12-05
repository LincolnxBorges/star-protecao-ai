import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, resetToDefaults } from "@/lib/settings";
import { type SettingsCategory, SETTINGS_CATEGORIES } from "@/lib/settings-schemas";
import { logger } from "@/lib/logger";

/**
 * POST /api/settings/reset
 * Reset settings to default values
 *
 * Body:
 * - category: The settings category to reset (required)
 *             Use "all" to reset all categories
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAdmin();

    const body = await request.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { error: "Categoria e obrigatoria" },
        { status: 400 }
      );
    }

    // Reset all categories
    if (category === "all") {
      const results: { category: string; success: boolean; error?: string }[] = [];

      for (const cat of SETTINGS_CATEGORIES) {
        try {
          await resetToDefaults(cat, userId);
          results.push({ category: cat, success: true });

          logger.info(`Reset settings to defaults`, { category: cat, userId }, "settings");
        } catch (error) {
          results.push({
            category: cat,
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });

          logger.error(`Failed to reset settings`, { category: cat, userId, error }, "settings");
        }
      }

      const allSuccess = results.every((r) => r.success);

      return NextResponse.json({
        success: allSuccess,
        results,
        message: allSuccess
          ? "Todas as configuracoes foram restauradas para os valores padrao"
          : "Algumas configuracoes falharam ao restaurar",
      });
    }

    // Validate single category
    if (!SETTINGS_CATEGORIES.includes(category as SettingsCategory)) {
      return NextResponse.json(
        { error: `Categoria invalida: ${category}` },
        { status: 400 }
      );
    }

    // Reset single category
    await resetToDefaults(category as SettingsCategory, userId);

    logger.info(`Reset settings to defaults`, { category, userId }, "settings");

    return NextResponse.json({
      success: true,
      category,
      message: `Configuracoes de ${category} restauradas para valores padrao`,
    });
  } catch (error) {
    console.error("Error resetting settings:", error);

    logger.error(
      "Failed to reset settings",
      { error: error instanceof Error ? error.message : "Unknown error" },
      "settings"
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao restaurar configuracoes" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
