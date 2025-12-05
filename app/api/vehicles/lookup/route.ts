import { NextRequest, NextResponse } from "next/server";
import { lookupVehicle } from "@/lib/vehicles";
import { vehicleLookupSchema } from "@/lib/validations/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = vehicleLookupSchema.safeParse(body);

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

    const { placa, categoria, tipoUso } = parseResult.data;

    // Lookup vehicle
    const result = await lookupVehicle(placa, categoria, tipoUso);

    if (!result.success) {
      const statusCode =
        result.error.code === "NOT_FOUND"
          ? 404
          : result.error.code === "API_ERROR"
            ? 503
            : 422;

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Vehicle lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "API_ERROR",
          message: "Erro ao consultar veiculo. Tente novamente.",
        },
      },
      { status: 500 }
    );
  }
}
