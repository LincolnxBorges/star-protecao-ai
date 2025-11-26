import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId } from "@/lib/sellers";
import {
  listPricingRules,
  createPricingRule,
} from "@/lib/pricing";
import type { VehicleCategory } from "@/lib/vehicles";

// ===========================================
// Schemas
// ===========================================

const createPricingSchema = z.object({
  categoria: z.enum(["NORMAL", "ESPECIAL", "UTILITARIO", "MOTO"]),
  faixaMin: z.number().min(0),
  faixaMax: z.number().positive(),
  mensalidade: z.number().positive(),
  cotaParticipacao: z.number().min(0).optional().nullable(),
}).refine((data) => data.faixaMax > data.faixaMin, {
  message: "faixaMax deve ser maior que faixaMin",
  path: ["faixaMax"],
});

// ===========================================
// GET /api/pricing
// ===========================================

export async function GET(request: NextRequest) {
  try {
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

    const searchParams = request.nextUrl.searchParams;
    const categoria = searchParams.get("categoria") as VehicleCategory | null;
    const activeParam = searchParams.get("active");
    const activeOnly = activeParam !== "false";

    const rules = await listPricingRules(categoria || undefined, activeOnly);

    return NextResponse.json({
      success: true,
      data: rules.map((rule) => ({
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
      })),
    });
  } catch (error) {
    console.error("Error listing pricing rules:", error);
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
// POST /api/pricing
// ===========================================

export async function POST(request: NextRequest) {
  try {
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
    const parsed = createPricingSchema.safeParse(body);

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

    const rule = await createPricingRule({
      categoria: parsed.data.categoria,
      faixaMin: parsed.data.faixaMin,
      faixaMax: parsed.data.faixaMax,
      mensalidade: parsed.data.mensalidade,
      cotaParticipacao: parsed.data.cotaParticipacao,
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating pricing rule:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" },
      },
      { status: 500 }
    );
  }
}
