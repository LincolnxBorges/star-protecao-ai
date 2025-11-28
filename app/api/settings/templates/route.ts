import { NextRequest, NextResponse } from "next/server";
import {
  listTemplates,
  createTemplate,
  requireAdmin,
  validateTemplateVariables,
} from "@/lib/settings";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  eventType: z.string().min(1, "Tipo de evento é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/settings/templates
 * List all message templates
 */
export async function GET() {
  try {
    await requireAdmin();

    const templates = await listTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET /api/settings/templates error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/templates
 * Create a new message template
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validationResult = createTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, eventType, content, isActive } = validationResult.data;

    // Validate template variables
    const variableValidation = validateTemplateVariables(content, eventType);
    if (!variableValidation.valid) {
      return NextResponse.json(
        {
          error: "Variáveis inválidas no template",
          invalidVariables: variableValidation.invalidVariables,
        },
        { status: 400 }
      );
    }

    const template = await createTemplate({
      name,
      eventType,
      content,
      isActive,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/templates error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
