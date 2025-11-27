/**
 * Cotacoes Note Dialog Component
 * @module components/cotacoes-note-dialog
 *
 * Dialog para adicionar notas/observacoes a uma cotacao.
 * Tipos disponiveis: Nota, Ligacao, Email, WhatsApp
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Phone, Mail, MessageCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { addQuotationNoteAction } from "@/app/(admin)/cotacoes/actions";

interface CotacoesNoteDialogProps {
  quotationId: string;
  trigger?: React.ReactNode;
}

const NOTE_TYPES = [
  {
    value: "NOTE",
    label: "Nota/Observacao",
    icon: FileText,
    description: "Anotacao geral sobre a cotacao",
  },
  {
    value: "CALL",
    label: "Ligacao",
    icon: Phone,
    description: "Registro de ligacao telefonica",
  },
  {
    value: "EMAIL",
    label: "Email",
    icon: Mail,
    description: "Registro de email enviado/recebido",
  },
  {
    value: "WHATSAPP_SENT",
    label: "WhatsApp",
    icon: MessageCircle,
    description: "Registro de mensagem WhatsApp",
  },
];

export function CotacoesNoteDialog({
  quotationId,
  trigger,
}: CotacoesNoteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = type && description.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    const result = await addQuotationNoteAction({
      quotationId,
      type,
      description: description.trim(),
    });

    if (result.success) {
      setOpen(false);
      setType("");
      setDescription("");
      toast.success("Nota adicionada com sucesso!");
      router.refresh();
    } else {
      const errorMsg = result.error || "Erro ao adicionar nota";
      setError(errorMsg);
      toast.error(errorMsg);
    }

    setIsLoading(false);
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setType("");
      setDescription("");
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Nota
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nota</DialogTitle>
          <DialogDescription>
            Registre uma interacao ou observacao sobre esta cotacao.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Note Type */}
          <div className="space-y-2">
            <Label htmlFor="note-type">Tipo de Registro</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="note-type">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((noteType) => {
                  const Icon = noteType.icon;
                  return (
                    <SelectItem key={noteType.value} value={noteType.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{noteType.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {type && (
              <p className="text-xs text-muted-foreground">
                {NOTE_TYPES.find((t) => t.value === type)?.description}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="note-description">Descricao</Label>
            <Textarea
              id="note-description"
              placeholder="Descreva a interacao ou observacao..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000 caracteres
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
