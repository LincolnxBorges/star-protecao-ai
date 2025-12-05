"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId, markAsContacted } from "@/lib/dashboard";
import type { MarkContactedResult } from "@/lib/types/dashboard";

export async function confirmContactAction(
  quotationId: string
): Promise<MarkContactedResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Não autenticado" };
  }

  const seller = await getSellerByUserId(session.user.id);

  if (!seller) {
    return { success: false, error: "Vendedor não encontrado" };
  }

  try {
    const success = await markAsContacted(quotationId);

    if (!success) {
      return {
        success: false,
        error: "Não foi possível atualizar a cotação. Ela pode já ter sido contatada.",
      };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao atualizar cotação" };
  }
}
