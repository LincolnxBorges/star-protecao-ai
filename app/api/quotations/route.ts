import { NextRequest, NextResponse } from "next/server";
import { createQuotationSchema } from "@/lib/validations/schemas";
import { findOrCreateByCpf } from "@/lib/customers";
import { createVehicle } from "@/lib/vehicles";
import {
  createQuotation,
  getQuotationById,
  listQuotations,
  expireOldQuotations,
} from "@/lib/quotations";
import { assignSellerToQuotation } from "@/lib/sellers";
import { getSellerByUserId } from "@/lib/sellers";
import { notifyQuotationCreated } from "@/lib/notifications";
import { getSession } from "@/lib/auth-server";

// ===========================================
// GET /api/quotations - List quotations (requires auth)
// ===========================================

export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const status = statusParam ? statusParam.split(",") : undefined;
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = Math.min(limitParam ? parseInt(limitParam, 10) : 20, 100);

    // Expire old quotations before listing
    await expireOldQuotations();

    // List quotations with appropriate filter
    const result = await listQuotations({
      sellerId: isAdmin ? undefined : seller.id,
      status,
      page,
      limit,
    });

    // Format response
    const items = result.items.map((q) => ({
      id: q.id,
      status: q.status,
      mensalidade: parseFloat(q.mensalidade),
      createdAt: q.createdAt?.toISOString(),
      expiresAt: q.expiresAt?.toISOString(),
      customer: {
        id: q.customer.id,
        name: q.customer.name,
        phone: q.customer.phone,
      },
      vehicle: {
        id: q.vehicle.id,
        placa: q.vehicle.placa,
        marca: q.vehicle.marca,
        modelo: q.vehicle.modelo,
        valorFipe: parseFloat(q.vehicle.valorFipe),
      },
      seller: q.seller
        ? {
            id: q.seller.id,
            name: q.seller.name,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Quotation list error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "API_ERROR",
          message: "Erro ao listar cotacoes. Tente novamente.",
        },
      },
      { status: 500 }
    );
  }
}

// ===========================================
// POST /api/quotations - Create quotation (public)
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = createQuotationSchema.safeParse(body);

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

    const { vehicle, customer, isRejected, rejectionReason } = parseResult.data;

    // 1. Find or create customer
    const customerRecord = await findOrCreateByCpf({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpf: customer.cpf,
      cep: customer.cep,
      street: customer.street,
      number: customer.number,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state,
    });

    // 2. Create vehicle record
    const vehicleRecord = await createVehicle({
      placa: vehicle.placa,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      ano: vehicle.ano,
      valorFipe: vehicle.valorFipe,
      codigoFipe: vehicle.codigoFipe,
      combustivel: vehicle.combustivel,
      cor: vehicle.cor,
      categoria: vehicle.categoria,
      tipoUso: vehicle.tipoUso,
    });

    // 3. Calculate values (from vehicle lookup, passed in body)
    // For rejected quotations, use zero values
    const mensalidade = isRejected ? 0 : (body.pricing?.mensalidade ?? 0);
    const adesao = isRejected ? 0 : (body.pricing?.adesao ?? 0);
    const adesaoDesconto = isRejected ? 0 : (body.pricing?.adesaoDesconto ?? 0);
    const cotaParticipacao = isRejected
      ? null
      : (body.pricing?.cotaParticipacao ?? null);

    // 4. Create quotation
    const quotation = await createQuotation({
      customerId: customerRecord.id,
      vehicleId: vehicleRecord.id,
      mensalidade,
      adesao,
      adesaoDesconto,
      cotaParticipacao,
      isRejected,
      rejectionReason,
    });

    // 5. Assign seller via round-robin (only for non-rejected quotations)
    let assignedSeller = null;
    if (!isRejected) {
      assignedSeller = await assignSellerToQuotation(quotation.id);
    }

    // 6. Send notifications (async, don't block response)
    // Only notify for non-rejected quotations
    if (!isRejected) {
      // Fire and forget - notifications shouldn't block the response
      notifyQuotationCreated({
        id: quotation.id,
        mensalidade,
        adesaoDesconto,
        cotaParticipacao,
        customer: {
          name: customerRecord.name,
          phone: customerRecord.phone,
        },
        vehicle: {
          marca: vehicleRecord.marca,
          modelo: vehicleRecord.modelo,
          ano: vehicleRecord.ano,
          placa: vehicleRecord.placa,
        },
        seller: assignedSeller
          ? {
              name: assignedSeller.name,
              phone: assignedSeller.phone,
            }
          : null,
      }).catch((error) => {
        // Log but don't fail the request
        console.error("Notification error:", error);
      });
    }

    // 7. Fetch complete quotation with relations for response
    const completeQuotation = await getQuotationById(quotation.id);

    // 8. Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: quotation.id,
          mensalidade: parseFloat(quotation.mensalidade),
          adesao: parseFloat(quotation.adesao),
          adesaoDesconto: parseFloat(quotation.adesaoDesconto),
          cotaParticipacao: quotation.cotaParticipacao
            ? parseFloat(quotation.cotaParticipacao)
            : null,
          status: quotation.status,
          expiresAt: quotation.expiresAt?.toISOString(),
          seller: completeQuotation?.seller
            ? {
                id: completeQuotation.seller.id,
                name: completeQuotation.seller.name,
              }
            : null,
          customer: {
            id: customerRecord.id,
            name: customerRecord.name,
          },
          vehicle: {
            id: vehicleRecord.id,
            placa: vehicleRecord.placa,
            marca: vehicleRecord.marca,
            modelo: vehicleRecord.modelo,
            valorFipe: parseFloat(vehicleRecord.valorFipe),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Quotation creation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "API_ERROR",
          message: "Erro ao criar cotacao. Tente novamente.",
        },
      },
      { status: 500 }
    );
  }
}
