/**
 * Client Profile Modal Component
 * @module components/clients-profile-modal
 *
 * Modal com perfil completo do cliente: dados pessoais, contato, endereco,
 * cotacoes resumidas, veiculos, historico de interacoes e info do vendedor.
 * T037-T044: User Story 4 - Ver Perfil Completo do Cliente.
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Phone,
  Mail,
  MessageCircle,
  Copy,
  MapPin,
  ExternalLink,
  User,
  Car,
  FileText,
  Clock,
  Shield,
  ShieldAlert,
  Calendar,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type {
  ClientProfile,
  ClientStatus,
  InteractionType,
  InteractionResult,
} from "@/lib/types/clients";

// Status config
const CLIENT_STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; className: string }
> = {
  CONVERTED: {
    label: "Convertido",
    className: "bg-green-500/10 text-green-700 border-green-500/20",
  },
  NEGOTIATING: {
    label: "Em Negociacao",
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  },
  INACTIVE: {
    label: "Inativo",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  LOST: {
    label: "Perdido",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
  },
  NEW: {
    label: "Novo",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
};

// Quotation status config
const QUOTATION_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACCEPTED: {
    label: "Aceita",
    className: "bg-green-500/10 text-green-700 border-green-500/20",
  },
  PENDING: {
    label: "Pendente",
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  },
  CONTACTED: {
    label: "Contatado",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  EXPIRED: {
    label: "Expirada",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  REJECTED: {
    label: "Rejeitada",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
  },
};

// Interaction type config
const INTERACTION_TYPE_CONFIG: Record<InteractionType, { label: string; icon: string }> = {
  CALL_MADE: { label: "Ligacao realizada", icon: "📞" },
  CALL_RECEIVED: { label: "Ligacao recebida", icon: "📲" },
  WHATSAPP_SENT: { label: "WhatsApp enviado", icon: "💬" },
  WHATSAPP_RECEIVED: { label: "WhatsApp recebido", icon: "📱" },
  EMAIL_SENT: { label: "Email enviado", icon: "📧" },
  EMAIL_RECEIVED: { label: "Email recebido", icon: "📩" },
  MEETING: { label: "Reuniao", icon: "🤝" },
  NOTE: { label: "Nota", icon: "📝" },
};

// Interaction result config
const INTERACTION_RESULT_CONFIG: Record<InteractionResult, { label: string; className: string }> = {
  POSITIVE: {
    label: "Positivo",
    className: "bg-green-500/10 text-green-700",
  },
  NEUTRAL: {
    label: "Neutro",
    className: "bg-muted text-muted-foreground",
  },
  NEGATIVE: {
    label: "Negativo",
    className: "bg-red-500/10 text-red-700",
  },
  NO_CONTACT: {
    label: "Sem contato",
    className: "bg-yellow-500/10 text-yellow-700",
  },
};

interface ClientsProfileModalProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLoadProfile: (clientId: string) => Promise<ClientProfile | null>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return cpf;
}

function formatCEP(cep: string): string {
  const digits = cep.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return cep;
}

export function ClientsProfileModal({
  clientId,
  isOpen,
  onClose,
  onLoadProfile,
}: ClientsProfileModalProps) {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load profile when clientId changes
  useEffect(() => {
    if (clientId && isOpen) {
      startTransition(async () => {
        const data = await onLoadProfile(clientId);
        setProfile(data);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null);
    }
  }, [clientId, isOpen, onLoadProfile]);

  const handleClose = () => {
    setProfile(null);
    onClose();
  };

  const handleCall = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    window.open(`tel:+55${digits}`, "_self");
  };

  const handleWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${digits}`, "_blank");
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, "_self");
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado para a area de transferencia`);
    } catch {
      toast.error(`Erro ao copiar ${label.toLowerCase()}`);
    }
  };

  const handleOpenMap = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
  };

  const getFullAddress = (p: ClientProfile) => {
    const parts = [
      p.street,
      p.number,
      p.complement,
      p.neighborhood,
      `${p.city}/${p.state}`,
      formatCEP(p.cep),
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil do Cliente
          </DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <div className="px-6 pb-6 space-y-6">
              {/* Section: Dados Pessoais */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados Pessoais
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg">{profile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        CPF: {formatCPF(profile.cpf)}
                      </p>
                    </div>
                    <Badge className={CLIENT_STATUS_CONFIG[profile.status].className}>
                      {CLIENT_STATUS_CONFIG[profile.status].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cliente desde {format(profile.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </section>

              <Separator />

              {/* Section: Contato */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contato
                </h3>
                <div className="space-y-2">
                  {/* Phone */}
                  <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{formatPhone(profile.phone)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCall(profile.phone)}
                        title="Ligar"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleWhatsApp(profile.phone)}
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(profile.phone, "Telefone")}
                        title="Copiar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEmail(profile.email)}
                        title="Enviar email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(profile.email, "Email")}
                        title="Copiar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Section: Endereco */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereco
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p>
                        {profile.street}, {profile.number}
                        {profile.complement && ` - ${profile.complement}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.neighborhood} - {profile.city}/{profile.state}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        CEP: {formatCEP(profile.cep)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenMap(getFullAddress(profile))}
                        title="Abrir no mapa"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(getFullAddress(profile), "Endereco")}
                        title="Copiar endereco"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Section: Cotacoes */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cotacoes ({profile.quotations.length})
                </h3>
                {profile.quotations.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
                    Nenhuma cotacao registrada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {profile.quotations.slice(0, 5).map((q) => {
                      const statusConfig = QUOTATION_STATUS_CONFIG[q.status] || {
                        label: q.status,
                        className: "bg-muted text-muted-foreground",
                      };
                      return (
                        <div
                          key={q.id}
                          className="bg-muted/30 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">
                              {q.vehicleMarca} {q.vehicleModelo}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {q.vehiclePlaca} • {formatCurrency(q.mensalidade)}/mes
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(q.createdAt, "dd/MM/yyyy")}
                              {q.acceptedAt && ` • Aceita em ${format(q.acceptedAt, "dd/MM/yyyy")}`}
                            </p>
                          </div>
                          <Badge className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      );
                    })}
                    {profile.quotations.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        +{profile.quotations.length - 5} cotacoes
                      </p>
                    )}
                  </div>
                )}
              </section>

              <Separator />

              {/* Section: Veiculos */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Veiculos ({profile.vehicles.length})
                </h3>
                {profile.vehicles.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
                    Nenhum veiculo registrado.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {profile.vehicles.map((v) => (
                      <div
                        key={v.placa}
                        className="bg-muted/30 rounded-lg p-3 flex items-start justify-between"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {v.marca} {v.modelo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {v.placa} • {v.ano}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {v.isProtected ? (
                            <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                              <Shield className="h-3 w-3 mr-1" />
                              Protegido
                            </Badge>
                          ) : v.hasPendingQuotation ? (
                            <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground">
                              Sem protecao
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              {/* Section: Historico de Interacoes */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Historico de Interacoes ({profile.interactions.length})
                </h3>
                {profile.interactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
                    Nenhuma interacao registrada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {profile.interactions.slice(0, 10).map((i) => {
                      const typeConfig = INTERACTION_TYPE_CONFIG[i.type];
                      const resultConfig = i.result
                        ? INTERACTION_RESULT_CONFIG[i.result]
                        : null;
                      return (
                        <div
                          key={i.id}
                          className="bg-muted/30 rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{typeConfig.icon}</span>
                              <span className="font-medium text-sm">
                                {typeConfig.label}
                              </span>
                              {resultConfig && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${resultConfig.className}`}
                                >
                                  {resultConfig.label}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(i.createdAt, "dd/MM/yyyy HH:mm")}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {i.description}
                          </p>
                          {i.authorName && (
                            <p className="text-xs text-muted-foreground">
                              Por: {i.authorName}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {profile.interactions.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        +{profile.interactions.length - 10} interacoes
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Section: Vendedor Responsavel */}
              {profile.seller && (
                <>
                  <Separator />
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Vendedor Responsavel
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="font-medium">{profile.seller.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {profile.seller.email}
                        </span>
                        {profile.seller.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {formatPhone(profile.seller.phone)}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Cliente nao encontrado.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
