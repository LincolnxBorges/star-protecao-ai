import { NextRequest, NextResponse } from "next/server";
import { fetchAddressByCEP } from "@/lib/integrations/viacep";
import { requireAdmin } from "@/lib/settings";

/**
 * GET /api/settings/cep/[cep]
 * Fetch address by CEP using ViaCEP API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  try {
    await requireAdmin();

    const { cep } = await params;

    if (!cep) {
      return NextResponse.json({ error: "CEP is required" }, { status: 400 });
    }

    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      return NextResponse.json(
        { error: "CEP must have 8 digits" },
        { status: 400 }
      );
    }

    const address = await fetchAddressByCEP(cleanCep);

    if (!address) {
      return NextResponse.json({ error: "CEP not found" }, { status: 404 });
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error("GET /api/settings/cep/[cep] error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 }
    );
  }
}
