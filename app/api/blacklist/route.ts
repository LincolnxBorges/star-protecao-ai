import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId } from "@/lib/sellers";
import { listBlacklist, addToBlacklist } from "@/lib/blacklist";

// ===========================================
// Schemas
// ===========================================

const createBlacklistSchema = z.object({
  marca: z.string().min(1).max(100),
  modelo: z.string().max(100).optional().nullable(),
  motivo: z.string().max(255).optional(),
});

// ===========================================
// GET /api/blacklist
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
    const activeParam = searchParams.get("active");
    const activeOnly = activeParam !== "false";

    const items = await listBlacklist(activeOnly);

    return NextResponse.json({
      success: true,
      data: items.map((item) => ({
        id: item.id,
        marca: item.marca,
        modelo: item.modelo,
        motivo: item.motivo,
        isActive: item.isActive,
        createdAt: item.createdAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Error listing blacklist:", error);
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
// POST /api/blacklist
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
    const parsed = createBlacklistSchema.safeParse(body);

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

    const item = await addToBlacklist(
      parsed.data.marca,
      parsed.data.modelo,
      parsed.data.motivo
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: item.id,
          marca: item.marca,
          modelo: item.modelo,
          motivo: item.motivo,
          isActive: item.isActive,
          createdAt: item.createdAt?.toISOString() || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding to blacklist:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" },
      },
      { status: 500 }
    );
  }
}
