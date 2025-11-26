"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { isValidCpf } from "@/lib/validations/cpf";

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email invalido"),
  phone: z.string().min(10, "Telefone invalido").max(11, "Telefone invalido"),
  cpf: z.string().refine((val) => isValidCpf(val), "CPF invalido"),
  cep: z.string().length(8, "CEP deve ter 8 digitos"),
  street: z.string().min(1, "Logradouro obrigatorio"),
  number: z.string().min(1, "Numero obrigatorio"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro obrigatorio"),
  city: z.string().min(1, "Cidade obrigatoria"),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

interface CotacaoFormCustomerProps {
  onSubmit: (data: FormData) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

export function CotacaoFormCustomer({
  onSubmit,
  onBack,
  isLoading = false,
}: CotacaoFormCustomerProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  const watchCep = form.watch("cep");

  // Auto-fill address when CEP changes
  useEffect(() => {
    const cepDigits = watchCep?.replace(/\D/g, "") || "";

    if (cepDigits.length === 8) {
      setIsLoadingCep(true);

      fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            form.setValue("street", data.logradouro || "");
            form.setValue("neighborhood", data.bairro || "");
            form.setValue("city", data.localidade || "");
            form.setValue("state", data.uf || "");
          }
        })
        .catch(() => {
          // Ignore errors, user can fill manually
        })
        .finally(() => {
          setIsLoadingCep(false);
        });
    }
  }, [watchCep, form]);

  function handlePhoneChange(value: string) {
    // Only keep digits
    const digits = value.replace(/\D/g, "");
    form.setValue("phone", digits.slice(0, 11));
  }

  function handleCpfChange(value: string) {
    // Only keep digits
    const digits = value.replace(/\D/g, "");
    form.setValue("cpf", digits.slice(0, 11));
  }

  function handleCepChange(value: string) {
    // Only keep digits
    const digits = value.replace(/\D/g, "");
    form.setValue("cep", digits.slice(0, 8));
  }

  async function handleFormSubmit(data: FormData) {
    await onSubmit(data);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Dados do Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="11999999999"
                        value={field.value}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00000000000"
                      value={field.value}
                      onChange={(e) => handleCpfChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000000"
                        value={field.value}
                        onChange={(e) => handleCepChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          isLoadingCep ? "Carregando..." : "Rua, Avenida..."
                        }
                        disabled={isLoadingCep}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Apto, Sala..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isLoadingCep ? "Carregando..." : "Bairro"}
                      disabled={isLoadingCep}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isLoadingCep ? "Carregando..." : "Cidade"}
                        disabled={isLoadingCep}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SP"
                        maxLength={2}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        disabled={isLoadingCep}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  "Finalizar Cotacao"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
