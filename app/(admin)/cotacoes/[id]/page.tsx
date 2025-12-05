import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId } from "@/lib/sellers";
import { getQuotationByIdWithAccessCheck, listQuotationActivities } from "@/lib/quotations";
import { AdminQuotationDetails } from "@/components/admin-quotation-details";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Cotacao ${id.slice(0, 8).toUpperCase()} - Star Protecao`,
    description: "Detalhes da cotacao de protecao veicular",
  };
}

export default async function QuotationDetailsPage({ params }: Props) {
  const { id } = await params;

  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const seller = await getSellerByUserId(session.user.id);

  if (!seller) {
    redirect("/login");
  }

  const isAdmin = seller.role === "ADMIN";

  try {
    const quotation = await getQuotationByIdWithAccessCheck(
      id,
      seller.id,
      isAdmin
    );

    if (!quotation) {
      notFound();
    }

    // Fetch activities for history
    const activities = await listQuotationActivities(id);

    // Transform the data for the component
    const quotationData = {
      id: quotation.id,
      status: quotation.status,
      rejectionReason: quotation.rejectionReason,
      mensalidade: parseFloat(quotation.mensalidade),
      adesao: parseFloat(quotation.adesao),
      adesaoDesconto: parseFloat(quotation.adesaoDesconto),
      cotaParticipacao: quotation.cotaParticipacao
        ? parseFloat(quotation.cotaParticipacao)
        : null,
      createdAt: quotation.createdAt?.toISOString() || "",
      expiresAt: quotation.expiresAt?.toISOString() || "",
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
    };

    return <AdminQuotationDetails quotation={quotationData} activities={activities} />;
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      notFound();
    }
    throw error;
  }
}
