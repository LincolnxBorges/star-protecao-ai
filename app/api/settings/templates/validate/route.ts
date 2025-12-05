import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  validateTemplateVariables,
  getTemplateVariables,
  renderTemplate,
} from "@/lib/settings";

/**
 * POST /api/settings/templates/validate
 * Validate template variables and optionally render preview
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { content, eventType, previewData } = body;

    if (!content || !eventType) {
      return NextResponse.json(
        { error: "Content and eventType are required" },
        { status: 400 }
      );
    }

    // Validate variables
    const validation = validateTemplateVariables(content, eventType);

    // Get available variables for this event type
    const availableVariables = getTemplateVariables(eventType);

    // Generate preview if preview data provided
    let preview: string | undefined;
    if (previewData && typeof previewData === "object") {
      preview = renderTemplate(content, previewData);
    }

    return NextResponse.json({
      valid: validation.valid,
      invalidVariables: validation.invalidVariables,
      availableVariables,
      preview,
    });
  } catch (error) {
    console.error("POST /api/settings/templates/validate error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to validate template" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/settings/templates/validate?eventType=xxx
 * Get available variables for an event type
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get("eventType");

    if (!eventType) {
      // Return all event types with their variables
      const eventTypes = ["quotation_created", "quotation_expiring", "quotation_accepted"];
      const allVariables: Record<string, { name: string; description: string }[]> = {};

      for (const type of eventTypes) {
        allVariables[type] = getTemplateVariables(type);
      }

      return NextResponse.json({
        eventTypes,
        variables: allVariables,
      });
    }

    const variables = getTemplateVariables(eventType);
    return NextResponse.json({ eventType, variables });
  } catch (error) {
    console.error("GET /api/settings/templates/validate error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to get variables" },
      { status: 500 }
    );
  }
}
