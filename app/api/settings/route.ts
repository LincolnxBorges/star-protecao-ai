import { NextRequest, NextResponse } from "next/server";
import {
  getSettings,
  updateSettings,
  getAllSettings,
  requireAdmin,
} from "@/lib/settings";
import {
  type SettingsCategory,
  SETTINGS_CATEGORIES,
  getSettingsSchema,
} from "@/lib/settings-schemas";

/**
 * GET /api/settings
 * Get settings by category (query param) or all settings
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") as SettingsCategory | null;

    if (category) {
      if (!SETTINGS_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category: ${category}` },
          { status: 400 }
        );
      }

      const data = await getSettings(category);
      return NextResponse.json({ category, data });
    }

    const allSettings = await getAllSettings();
    return NextResponse.json(allSettings);
  } catch (error) {
    console.error("GET /api/settings error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Update settings for a specific category
 * Body: { category: string, data: object }
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAdmin();

    const body = await request.json();
    const { category, data } = body;

    if (!category || !data) {
      return NextResponse.json(
        { error: "Category and data are required" },
        { status: 400 }
      );
    }

    if (!SETTINGS_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    // Validate data against schema
    const schema = getSettingsSchema(category);
    const validationResult = schema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    await updateSettings(category, data, userId);

    return NextResponse.json({
      success: true,
      message: `Settings for ${category} updated successfully`,
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("Validation failed")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
