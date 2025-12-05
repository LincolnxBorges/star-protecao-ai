import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getQuotationByIdWithAccessCheck,
  updateQuotationStatus,
} from "@/lib/quotations";
import { getSellerByUserId } from "@/lib/sellers";
import { getSession } from "@/lib/auth-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ===========================================
// GET /api/quotations/[id] - Get quotation details
// ===========================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Autenticacao necessaria",
          },
        },
        { status: 401 }
      );
    }

    // Get seller info for the logged-in user
    const seller = await getSellerByUserId(session.user.id);

    if (!seller) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Usuario nao e um vendedor registrado",
          },
        },
        { status: 403 }
      );
    }

    const isAdmin = seller.role === "ADMIN";

    // Get quotation with access check
    const quotation = await getQuotationByIdWithAccessCheck(
      id,
      seller.id,
      isAdmin
    );

    if (!quotation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Cotacao nao encontrada",
          },
        },
        { status: 404 }
      );
    }

    // Format response
    return NextResponse.json({
      success: true,
      data: {
        id: quotation.id,
        status: quotation.status,
        rejectionReason: quotation.rejectionReason,
        mensalidade: parseFloat(quotation.mensalidade),
        adesao: parseFloat(quotation.adesao),
        adesaoDesconto: parseFloat(quotation.adesaoDesconto),
        cotaParticipacao: quotation.cotaParticipacao
          ? parseFloat(quotation.cotaParticipacao)
          : null,
        createdAt: quotation.createdAt?.toISOString(),
        expiresAt: quotation.expiresAt?.toISOString(),
        contactedAt: quotation.contactedAt?.toISOString() || null,
        acceptedAt: quotation.acceptedAt?.toISOString() || null,
        notes: quotation.notes,
        customer: {
          id: quotation.customer.id,
          name: quotation.customer.name,
          email: quotation.customer.email,
          phone: quotation.customer.phone,
          cpf: quotation.customer.cpf,
          address: {
            cep: quotation.customer.cep,
            street: quotation.customer.street,
            number: quotation.customer.number,
            complement: quotation.customer.complement,
            neighborhood: quotation.customer.neighborhood,
            city: quotation.customer.city,
            state: quotation.customer.state,
          },
        },
        vehicle: {
          id: quotation.vehicle.id,
          placa: quotation.vehicle.placa,
          marca: quotation.vehicle.marca,
          modelo: quotation.vehicle.modelo,
          ano: quotation.vehicle.ano,
          valorFipe: parseFloat(quotation.vehicle.valorFipe),
          codigoFipe: quotation.vehicle.codigoFipe,
          combustivel: quotation.vehicle.combustivel,
          cor: quotation.vehicle.cor,
          categoria: quotation.vehicle.categoria,
          tipoUso: quotation.vehicle.tipoUso,
        },
        seller: quotation.seller
          ? {
              id: quotation.seller.id,
              name: quotation.seller.name,
              email: quotation.seller.email,
              phone: quotation.seller.phone,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Acesso negado",
          },
        },
        { status: 403 }
      );
    }

    console.error("Quotation get error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "API_ERROR",
          message: "Erro ao buscar cotacao. Tente novamente.",
        },
      },
      { status: 500 }
    );
  }
}

// ===========================================
// PATCH /api/quotations/[id] - Update quotation status
// ===========================================

const updateStatusSchema = z.object({
  status: z.enum(["CONTACTED", "ACCEPTED", "CANCELLED"]),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Autenticacao necessaria",
          },
        },
        { status: 401 }
      );
    }

    // Get seller info for the logged-in user
    const seller = await getSellerByUserId(session.user.id);

    if (!seller) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Usuario nao e um vendedor registrado",
          },
        },
        { status: 403 }
      );
    }

    const isAdmin = seller.role === "ADMIN";

    // Parse and validate body
    const body = await request.json();
    const parseResult = updateStatusSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Dados invalidos",
            details: parseResult.error.issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const { status, notes } = parseResult.data;

    // Update quotation status
    // If not admin, pass sellerId for authorization check
    const updated = await updateQuotationStatus(
      id,
      status,
      notes,
      isAdmin ? undefined : seller.id
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Cotacao nao encontrada",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        contactedAt: updated.contactedAt?.toISOString() || null,
        acceptedAt: updated.acceptedAt?.toISOString() || null,
        notes: updated.notes,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Acesso negado",
            },
          },
          { status: 403 }
        );
      }

      if (error.message.includes("Invalid status transition")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_TRANSITION",
              message: "Transicao de status invalida",
            },
          },
          { status: 400 }
        );
      }
    }

    console.error("Quotation update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "API_ERROR",
          message: "Erro ao atualizar cotacao. Tente novamente.",
        },
      },
      { status: 500 }
    );
  }
}
