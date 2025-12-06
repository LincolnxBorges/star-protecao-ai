/**
 * Goals API Route
 *
 * API endpoints for managing seller monthly goals.
 * Only accessible by Admin users.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId } from "@/lib/dashboard";
import { setGoal, removeGoal, getSellersWithGoals } from "@/lib/goals";
import { z } from "zod";

const setGoalSchema = z.object({
  sellerId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  targetAccepted: z.number().int().positive(),
});

const removeGoalSchema = z.object({
  sellerId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
});

async function isAdmin() {
  const session = await getSession();
  if (!session?.user) return false;

  const seller = await getSellerByUserId(session.user.id);
  return seller?.role === "ADMIN";
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2024) {
      return NextResponse.json(
        { success: false, error: "Mês e ano são obrigatórios" },
        { status: 400 }
      );
    }

    const sellers = await getSellersWithGoals(month, year);

    return NextResponse.json({ success: true, sellers });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = setGoalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos" },
        { status: 400 }
      );
    }

    const response = await setGoal(result.data);

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting goal:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = removeGoalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos" },
        { status: 400 }
      );
    }

    const response = await removeGoal(
      result.data.sellerId,
      result.data.month,
      result.data.year
    );

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing goal:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
