/**
 * Client Interaction Modal Component
 * @module components/clients-interaction-modal
 *
 * Modal para registrar interacoes com cliente: tipo, resultado,
 * descricao e agendamento de follow-up opcional.
 * T053-T060: User Story 6 - Registrar Interacao.
 */

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Phone,
  PhoneIncoming,
  MessageCircle,
  MessageSquare,
  Mail,
  MailOpen,
  Users,
  StickyNote,
  CalendarClock,
  Loader2,
  CheckCircle,
  MinusCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createInteractionSchema,
  interactionTypeValues,
  interactionResultValues,
} from "@/lib/validations/clients";
import type { InteractionType, InteractionResult } from "@/lib/types/clients";
import type { z } from "zod";

// Interaction type config with icons
const INTERACTION_TYPE_CONFIG: Record<
  InteractionType,
  { label: string; icon: typeof Phone; description: string }
> = {
  CALL_MADE: {
    label: "Ligacao realizada",
    icon: Phone,
    description: "Voce ligou para o cliente",
  },
  CALL_RECEIVED: {
    label: "Ligacao recebida",
    icon: PhoneIncoming,
    description: "O cliente ligou para voce",
  },
  WHATSAPP_SENT: {
    label: "WhatsApp enviado",
    icon: MessageCircle,
    description: "Voce enviou mensagem no WhatsApp",
  },
  WHATSAPP_RECEIVED: {
    label: "WhatsApp recebido",
    icon: MessageSquare,
    description: "O cliente enviou mensagem no WhatsApp",
  },
  EMAIL_SENT: {
    label: "Email enviado",
    icon: Mail,
    description: "Voce enviou email para o cliente",
  },
  EMAIL_RECEIVED: {
    label: "Email recebido",
    icon: MailOpen,
    description: "O cliente enviou email para voce",
  },
  MEETING: {
    label: "Reuniao",
    icon: Users,
    description: "Reuniao presencial ou online",
  },
  NOTE: {
    label: "Nota",
    icon: StickyNote,
    description: "Anotacao ou observacao sobre o cliente",
  },
};

// Interaction result config with icons and colors
const INTERACTION_RESULT_CONFIG: Record<
  InteractionResult,
  { label: string; icon: typeof CheckCircle; className: string; description: string }
> = {
  POSITIVE: {
    label: "Positivo",
    icon: CheckCircle,
    className: "text-green-600 border-green-500/30 hover:bg-green-500/10",
    description: "Interacao teve resultado positivo",
  },
  NEUTRAL: {
    label: "Neutro",
    icon: MinusCircle,
    className: "text-muted-foreground border-muted-foreground/30 hover:bg-muted",
    description: "Interacao sem resultado definido",
  },
  NEGATIVE: {
    label: "Negativo",
    icon: XCircle,
    className: "text-red-600 border-red-500/30 hover:bg-red-500/10",
    description: "Interacao teve resultado negativo",
  },
  NO_CONTACT: {
    label: "Sem contato",
    icon: HelpCircle,
    className: "text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/10",
    description: "Nao foi possivel falar com o cliente",
  },
};

type FormData = z.infer<typeof createInteractionSchema>;

interface ClientsInteractionModalProps {
  clientId: string | null;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function ClientsInteractionModal({
  clientId,
  clientName,
  isOpen,
  onClose,
  onSubmit,
}: ClientsInteractionModalProps) {
  const [isPending, startTransition] = useTransition();
  const [showCalendar, setShowCalendar] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createInteractionSchema),
    defaultValues: {
      customerId: clientId || "",
      type: undefined,
      result: undefined,
      description: "",
      scheduledFollowUp: undefined,
    },
  });

  const selectedType = watch("type");
  const selectedResult = watch("result");
  const scheduledFollowUp = watch("scheduledFollowUp");
  const description = watch("description");

  const handleClose = () => {
    reset();
    setShowCalendar(false);
    onClose();
  };

  const handleFormSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await onSubmit({
        ...data,
        customerId: clientId || "",
      });

      if (result.success) {
        toast.success("Interacao registrada com sucesso!");
        handleClose();
      } else {
        toast.error(result.error || "Erro ao registrar interacao");
      }
    });
  });

  const handleTypeSelect = (type: InteractionType) => {
    setValue("type", type, { shouldValidate: true });
  };

  const handleResultSelect = (result: InteractionResult | undefined) => {
    setValue("result", result, { shouldValidate: true });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setValue("scheduledFollowUp", date, { shouldValidate: true });
    setShowCalendar(false);
  };

  const clearFollowUp = () => {
    setValue("scheduledFollowUp", undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Registrar Interacao
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Cliente: <span className="font-medium">{clientName}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Interaction Type Selector */}
          <div className="space-y-2">
            <Label>Tipo de Interacao *</Label>
            <div className="grid grid-cols-2 gap-2">
              {interactionTypeValues.map((type) => {
                const config = INTERACTION_TYPE_CONFIG[type];
                const Icon = config.icon;
                const isSelected = selectedType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeSelect(type)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isSelected && "text-primary")} />
                    <span className={cn("text-sm", isSelected && "font-medium")}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Interaction Result Selector */}
          <div className="space-y-2">
            <Label>Resultado (opcional)</Label>
            <div className="grid grid-cols-4 gap-2">
              {interactionResultValues.map((result) => {
                const config = INTERACTION_RESULT_CONFIG[result];
                const Icon = config.icon;
                const isSelected = selectedResult === result;

                return (
                  <button
                    key={result}
                    type="button"
                    onClick={() => handleResultSelect(isSelected ? undefined : result)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors",
                      isSelected
                        ? cn("ring-1", config.className.replace("hover:", ""))
                        : cn("border-border", config.className)
                    )}
                    title={config.description}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Descricao *</Label>
              <span className="text-xs text-muted-foreground">
                {description?.length || 0}/2000
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Descreva os detalhes da interacao..."
              rows={4}
              {...register("description")}
              className={cn(errors.description && "border-destructive")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Scheduled Follow-up */}
          <div className="space-y-2">
            <Label>Agendar Follow-up (opcional)</Label>
            <div className="flex items-center gap-2">
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !scheduledFollowUp && "text-muted-foreground"
                    )}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {scheduledFollowUp
                      ? format(scheduledFollowUp, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledFollowUp}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {scheduledFollowUp && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearFollowUp}
                  title="Remover agendamento"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              O follow-up aparecera no historico do cliente.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar Interacao"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
