/**
 * Cotacoes Detail Client Component
 * @module components/cotacoes-detail-client
 *
 * Card com dados completos do cliente conforme FR-015:
 * nome, CPF, telefone, email, endereco completo
 *
 * Botoes de contato rapido conforme US5:
 * WhatsApp, Ligar, Email
 *
 * Botoes de copiar conforme US9:
 * Copiar telefone, email, endereco
 *
 * Botao Ver no Mapa conforme US10:
 * Abre endereco no Google Maps
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, Phone, Mail, MapPin, MessageCircle, Copy, ExternalLink } from "lucide-react";
import { formatWhatsAppLink, formatTelLink, copyToClipboard, formatGoogleMapsUrl } from "@/lib/utils";
import { toast } from "sonner";

interface ClientData {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

interface CotacoesDetailClientProps {
  client: ClientData;
}

function formatCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

function formatCep(cep: string): string {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return cep;
  return clean.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export function CotacoesDetailClient({ client }: CotacoesDetailClientProps) {
  const fullAddress = [
    `${client.street}, ${client.number}`,
    client.complement,
    client.neighborhood,
    `${client.city} - ${client.state}`,
    formatCep(client.cep),
  ]
    .filter(Boolean)
    .join(", ");

  const mapsUrl = formatGoogleMapsUrl({
    street: client.street,
    number: client.number,
    neighborhood: client.neighborhood,
    city: client.city,
    state: client.state,
    cep: client.cep,
  });

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success(`${label} copiado!`);
    } else {
      toast.error(`Erro ao copiar ${label.toLowerCase()}`);
    }
  };

  return (
    <TooltipProvider>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Dados do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nome e CPF */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nome</p>
            <p className="text-sm">{client.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">CPF</p>
            <p className="text-sm">{formatCpf(client.cpf)}</p>
          </div>
        </div>

        {/* Telefone e Email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <div className="flex items-center gap-1">
                <a
                  href={`tel:${client.phone.replace(/\D/g, "")}`}
                  className="text-sm text-primary hover:underline"
                >
                  {formatPhone(client.phone)}
                </a>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(formatPhone(client.phone), "Telefone")}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="sr-only">Copiar telefone</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar telefone</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <div className="flex items-center gap-1">
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm text-primary hover:underline truncate"
                >
                  {client.email}
                </a>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleCopy(client.email, "Email")}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="sr-only">Copiar email</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar email</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Endereco */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Endereco</p>
            <div className="flex items-start gap-1">
              <p className="text-sm flex-1">{fullAddress}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleCopy(fullAddress, "Endereco")}
                  >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">Copiar endereco</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copiar endereco</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    asChild
                  >
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      <span className="sr-only">Ver no Google Maps</span>
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver no Google Maps</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Botoes de Contato Rapido */}
        <div className="border-t pt-4 mt-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Contato Rapido
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              asChild
            >
              <a
                href={formatWhatsAppLink(client.phone)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={formatTelLink(client.phone)}>
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${client.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
