"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { isValidPlaca } from "@/lib/validations/placa";

const formSchema = z.object({
  placa: z.string().refine((val) => isValidPlaca(val), "Placa invalida"),
  categoria: z.enum(["LEVE", "UTILITARIO"]),
  tipoUso: z.enum(["PARTICULAR", "COMERCIAL"]),
});

type FormData = z.infer<typeof formSchema>;

interface VehicleLookupResult {
  success: true;
  data: {
    placa: string;
    marca: string;
    modelo: string;
    ano: string;
    valorFipe: number;
    codigoFipe: string;
    combustivel: string | null;
    cor: string | null;
    categoria: string;
    tipoUso: string;
    pricing: {
      mensalidade: number;
      adesao: number;
      adesaoDesconto: number;
      cotaParticipacao: number | null;
    };
  };
}

interface VehicleLookupError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  saveAsLead?: boolean;
}

type LookupResponse = VehicleLookupResult | VehicleLookupError;

interface CotacaoFormVehicleProps {
  onSuccess: (data: VehicleLookupResult["data"]) => void;
  onRejected: (error: VehicleLookupError["error"], saveAsLead: boolean) => void;
}

export function CotacaoFormVehicle({
  onSuccess,
  onRejected,
}: CotacaoFormVehicleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      placa: "",
      categoria: "LEVE",
      tipoUso: "PARTICULAR",
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/vehicles/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: LookupResponse = await response.json();

      if (result.success) {
        onSuccess(result.data);
      } else {
        onRejected(result.error, result.saveAsLead || false);
      }
    } catch {
      onRejected(
        {
          code: "API_ERROR",
          message: "Erro ao consultar veiculo. Tente novamente.",
        },
        false
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Consulta de Veiculo</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="placa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa do Veiculo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABC-1234 ou ABC1D23"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria do Veiculo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LEVE">
                        Leve (Carros de passeio)
                      </SelectItem>
                      <SelectItem value="UTILITARIO">
                        Utilitario (SUVs, Caminhonetes, Vans)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipoUso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Uso</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de uso" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PARTICULAR">
                        Particular (uso pessoal)
                      </SelectItem>
                      <SelectItem value="COMERCIAL">
                        Comercial (aplicativo, transporte)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Consultando...
                </>
              ) : (
                "Consultar Veiculo"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
