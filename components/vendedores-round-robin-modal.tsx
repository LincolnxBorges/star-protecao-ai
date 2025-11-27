/**
 * Round-Robin Configuration Modal Component
 * @module components/vendedores-round-robin-modal
 *
 * Modal para configurar metodo de distribuicao de leads.
 * T055: vendedores-round-robin-modal.tsx
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getRoundRobinConfigAction,
  updateRoundRobinConfigAction,
} from "@/app/(admin)/vendedores/actions";
import { ROUND_ROBIN_METHOD_CONFIG } from "@/lib/types/sellers";
import type { RoundRobinMethod } from "@/lib/types/sellers";

const formSchema = z.object({
  method: z.enum(["SEQUENTIAL", "LOAD_BALANCE", "PERFORMANCE", "SPEED"]),
  pendingLeadLimit: z.number().min(0).max(100).nullable(),
  skipOverloaded: z.boolean(),
  notifyWhenAllOverloaded: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface VendedoresRoundRobinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function VendedoresRoundRobinModal({
  open,
  onOpenChange,
  onSuccess,
}: VendedoresRoundRobinModalProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      method: "SEQUENTIAL",
      pendingLeadLimit: null,
      skipOverloaded: true,
      notifyWhenAllOverloaded: true,
    },
  });

  // Load current config when modal opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);

      getRoundRobinConfigAction()
        .then((result) => {
          if (result.success && result.data) {
            const config = result.data.config;
            form.reset({
              method: config.method,
              pendingLeadLimit: config.pendingLeadLimit,
              skipOverloaded: config.skipOverloaded,
              notifyWhenAllOverloaded: config.notifyWhenAllOverloaded,
            });
          }
        })
        .catch(() => {
          setError("Erro ao carregar configuracao");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, form]);

  const onSubmit = (values: FormValues) => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await updateRoundRobinConfigAction({
          method: values.method,
          pendingLeadLimit: values.pendingLeadLimit,
          skipOverloaded: values.skipOverloaded,
          notifyWhenAllOverloaded: values.notifyWhenAllOverloaded,
        });

        if (result.success) {
          toast.success("Configuracao salva com sucesso!");
          onSuccess?.();
          onOpenChange(false);
        } else {
          const errorMsg = result.error || "Erro ao salvar configuracao";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch {
        const errorMsg = "Erro ao salvar configuracao";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    });
  };

  const selectedMethod = form.watch("method");
  const methodConfig = ROUND_ROBIN_METHOD_CONFIG[selectedMethod];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Configurar Distribuicao de Leads
          </DialogTitle>
          <DialogDescription>
            Configure como os leads serao distribuidos entre os vendedores ativos.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Method Selection */}
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metodo de Distribuicao</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um metodo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(ROUND_ROBIN_METHOD_CONFIG) as RoundRobinMethod[]).map(
                          (method) => (
                            <SelectItem key={method} value={method}>
                              {ROUND_ROBIN_METHOD_CONFIG[method].label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>{methodConfig.description}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pending Lead Limit */}
              <FormField
                control={form.control}
                name="pendingLeadLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Leads Pendentes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Sem limite"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? null : parseInt(value, 10));
                        }}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Numero maximo de leads pendentes por vendedor. Deixe vazio para sem limite.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skip Overloaded */}
              <FormField
                control={form.control}
                name="skipOverloaded"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Pular Vendedores Sobrecarregados</FormLabel>
                      <FormDescription>
                        Pular vendedores que atingiram o limite de leads pendentes.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Notify When All Overloaded */}
              <FormField
                control={form.control}
                name="notifyWhenAllOverloaded"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Notificar Quando Todos Sobrecarregados</FormLabel>
                      <FormDescription>
                        Enviar notificacao quando todos os vendedores estiverem sobrecarregados.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  As alteracoes serao aplicadas imediatamente para novos leads.
                  Leads ja distribuidos nao serao afetados.
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Configuracao
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
