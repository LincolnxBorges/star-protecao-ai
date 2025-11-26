import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId } from "@/lib/sellers";
import { removeFromBlacklist } from "@/lib/blacklist";

// ===========================================
// Context type
// ===========================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ===========================================
// DELETE /api/blacklist/[id]
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

    const item = await removeFromBlacklist(id);

    if (!item) {
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
        id: item.id,
        isActive: item.isActive,
      },
    });
  } catch (error) {
    console.error("Error removing from blacklist:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" },
      },
      { status: 500 }
    );
  }
}
