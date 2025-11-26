import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId } from "@/lib/sellers";
import { updatePricingRule, deletePricingRule } from "@/lib/pricing";

// ===========================================
// Schemas
// ===========================================

const updatePricingSchema = z.object({
  faixaMin: z.number().min(0).optional(),
  faixaMax: z.number().positive().optional(),
  mensalidade: z.number().positive().optional(),
  cotaParticipacao: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ===========================================
// Context type
// ===========================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ===========================================
// PATCH /api/pricing/[id]
// ===========================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Autenticacao necessaria" },
        },
        { status: 401 }
      );
    }

    const seller = await getSellerByUserId(session.user.id);

    if (!seller || seller.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Acesso restrito a administradores" },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updatePricingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Dados invalidos",
            details: parsed.error.issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const rule = await updatePricingRule(id, parsed.data);

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Recurso nao encontrado" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: rule.id,
        categoria: rule.categoria,
        faixaMin: parseFloat(rule.faixaMin),
        faixaMax: parseFloat(rule.faixaMax),
        mensalidade: parseFloat(rule.mensalidade),
        cotaParticipacao: rule.cotaParticipacao
          ? parseFloat(rule.cotaParticipacao)
          : null,
        isActive: rule.isActive,
        createdAt: rule.createdAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error updating pricing rule:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" },
      },
      { status: 500 }
    );
  }
}

// ===========================================
// DELETE /api/pricing/[id]
// ===========================================

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Autenticacao necessaria" },
        },
        { status: 401 }
      );
    }

    const seller = await getSellerByUserId(session.user.id);

    if (!seller || seller.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Acesso restrito a administradores" },
        },
        { status: 403 }
      );
    }

    const rule = await deletePricingRule(id);

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Recurso nao encontrado" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: rule.id,
        isActive: rule.isActive,
      },
    });
  } catch (error) {
    console.error("Error deleting pricing rule:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" },
      },
      { status: 500 }
    );
  }
}
