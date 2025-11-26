import { notFound } from "next/navigation";
import { getQuotationById } from "@/lib/quotations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando Contato",
  CONTACTED: "Em Negociacao",
  ACCEPTED: "Aceita",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REJECTED: "Recusada",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "default",
  CONTACTED: "secondary",
  ACCEPTED: "default",
  CANCELLED: "destructive",
  EXPIRED: "outline",
  REJECTED: "destructive",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, "");
  return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export default async function QuotationResultPage({ params }: Props) {
  const { id } = await params;
  const quotation = await getQuotationById(id);

  if (!quotation) {
    notFound();
  }

  const isRejected = quotation.status === "REJECTED";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {isRejected ? "Solicitacao Registrada" : "Cotacao Realizada"}
        </h1>
        <p className="text-muted-foreground">
          {isRejected
            ? "Seus dados foram registrados e entraremos em contato"
            : "Confira os detalhes da sua cotacao abaixo"}
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Status da Cotacao</CardTitle>
              <Badge variant={STATUS_VARIANTS[quotation.status] || "outline"}>
                {STATUS_LABELS[quotation.status] || quotation.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Codigo</p>
                <p className="font-mono font-medium">
                  {quotation.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Data</p>
                <p className="font-medium">{formatDate(quotation.createdAt)}</p>
              </div>
              {!isRejected && quotation.expiresAt && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Validade</p>
                  <p className="font-medium">
                    {formatDate(quotation.expiresAt)}
                  </p>
                </div>
              )}
              {isRejected && quotation.rejectionReason && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Observacao</p>
                  <p className="font-medium">{quotation.rejectionReason}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Veiculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Placa</p>
                <p className="font-mono font-medium uppercase">
                  {quotation.vehicle.placa}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Marca/Modelo</p>
                <p className="font-medium">
                  {quotation.vehicle.marca} {quotation.vehicle.modelo}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Ano</p>
                <p className="font-medium">{quotation.vehicle.ano}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor FIPE</p>
                <p className="font-medium">
                  {formatCurrency(parseFloat(quotation.vehicle.valorFipe))}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Categoria</p>
                <p className="font-medium">{quotation.vehicle.categoria}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipo de Uso</p>
                <p className="font-medium">{quotation.vehicle.tipoUso}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card - Only show for non-rejected quotations */}
        {!isRejected && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Valores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Mensalidade
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(parseFloat(quotation.mensalidade))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Taxa de Adesao
                  </span>
                  <div className="text-right">
                    <span className="line-through text-muted-foreground mr-2">
                      {formatCurrency(parseFloat(quotation.adesao))}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(parseFloat(quotation.adesaoDesconto))}
                    </span>
                  </div>
                </div>
                {quotation.cotaParticipacao && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Cota de Participacao
                    </span>
                    <span className="font-medium">
                      {formatCurrency(parseFloat(quotation.cotaParticipacao))}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-muted-foreground">Nome</p>
                <p className="font-medium">{quotation.customer.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CPF</p>
                <p className="font-mono font-medium">
                  {formatCpf(quotation.customer.cpf)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">WhatsApp</p>
                <p className="font-medium">
                  {formatPhone(quotation.customer.phone)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{quotation.customer.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Endereco</p>
                <p className="font-medium">
                  {quotation.customer.street}, {quotation.customer.number}
                  {quotation.customer.complement &&
                    ` - ${quotation.customer.complement}`}
                  <br />
                  {quotation.customer.neighborhood} - {quotation.customer.city}/
                  {quotation.customer.state}
                  <br />
                  CEP: {formatCep(quotation.customer.cep)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Proximos Passos</h3>
            <p className="text-sm text-muted-foreground">
              {isRejected
                ? "Nossa equipe ira analisar sua solicitacao e entrar em contato em breve para apresentar opcoes disponiveis."
                : "Um de nossos consultores entrara em contato pelo WhatsApp para finalizar sua adesao. Guarde o codigo da cotacao para referencia."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
