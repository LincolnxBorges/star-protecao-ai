/**
 * Cotacoes Detail Seller Component
 * @module components/cotacoes-detail-seller
 *
 * Card com informacoes do vendedor conforme FR-019:
 * nome, email, telefone e data de atribuicao
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Mail, Phone, Calendar } from "lucide-react";

interface SellerData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface CotacoesDetailSellerProps {
  seller: SellerData | null;
  assignedAt?: Date | string | null;
}

function formatPhone(phone: string | null): string {
  if (!phone) return "-";
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function CotacoesDetailSeller({
  seller,
  assignedAt,
}: CotacoesDetailSellerProps) {
  if (!seller) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle className="h-5 w-5" />
            Vendedor Responsavel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum vendedor atribuido a esta cotacao.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCircle className="h-5 w-5" />
          Vendedor Responsavel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nome */}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Nome</p>
          <p className="text-sm font-semibold">{seller.name}</p>
        </div>

        {/* Email e Telefone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <a
                href={`mailto:${seller.email}`}
                className="text-sm text-primary hover:underline"
              >
                {seller.email}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              {seller.phone ? (
                <a
                  href={`tel:${seller.phone.replace(/\D/g, "")}`}
                  className="text-sm text-primary hover:underline"
                >
                  {formatPhone(seller.phone)}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
          </div>
        </div>

        {/* Data de Atribuicao */}
        {assignedAt && (
          <div className="flex items-start gap-2 border-t pt-4">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Data de Atribuicao
              </p>
              <p className="text-sm">{formatDate(assignedAt)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
