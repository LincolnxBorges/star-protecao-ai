/**
 * Cotacao Footer Component
 * @module components/cotacao-footer
 *
 * Footer para paginas publicas de cotacao.
 * Exibe informacoes da empresa, contatos e selos de confianca.
 */

import {
  Shield,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  CheckCircle,
  Lock,
  Clock,
} from "lucide-react";

interface Address {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface CotacaoFooterProps {
  companyName: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: Address;
}

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return cnpj;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function getWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${fullNumber}`;
}

function formatAddress(address: Address): string {
  const parts: string[] = [];

  if (address.logradouro) {
    let line = address.logradouro;
    if (address.numero) line += `, ${address.numero}`;
    if (address.complemento) line += ` - ${address.complemento}`;
    parts.push(line);
  }

  if (address.bairro) {
    parts.push(address.bairro);
  }

  if (address.cidade && address.estado) {
    parts.push(`${address.cidade}/${address.estado}`);
  }

  if (address.cep) {
    parts.push(`CEP: ${address.cep}`);
  }

  return parts.join(" - ");
}

export function CotacaoFooter({
  companyName,
  cnpj,
  email,
  phone,
  whatsapp,
  address,
}: CotacaoFooterProps) {
  const currentYear = new Date().getFullYear();
  const hasAddress = address && (address.logradouro || address.cidade);

  return (
    <footer className="border-t border-border bg-muted/30">
      {/* Trust Badges Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Protecao Garantida</span>
              <span className="text-xs text-muted-foreground">
                Cobertura completa para seu veiculo
              </span>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Dados Seguros</span>
              <span className="text-xs text-muted-foreground">
                Suas informacoes estao protegidas
              </span>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Atendimento Rapido</span>
              <span className="text-xs text-muted-foreground">
                Resposta em ate 24 horas
              </span>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">Sem Burocracia</span>
              <span className="text-xs text-muted-foreground">
                Processo simples e transparente
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Company Info Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Company Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{companyName}</h3>
            {cnpj && (
              <p className="text-sm text-muted-foreground">
                CNPJ: {formatCnpj(cnpj)}
              </p>
            )}
            {hasAddress && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{formatAddress(address)}</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contato</h3>
            <div className="space-y-3">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, "")}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {formatPhone(phone)}
                </a>
              )}
              {whatsapp && (
                <a
                  href={getWhatsAppLink(whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp: {formatPhone(whatsapp)}
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {email}
                </a>
              )}
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Informacoes Legais</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Associacao de protecao veicular. Nao somos seguradora.
              </p>
              <p>
                Os valores apresentados sao estimativas e podem variar conforme analise.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-muted-foreground">
            © {currentYear} {companyName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
