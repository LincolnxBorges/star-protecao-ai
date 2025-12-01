"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Search, Building2, MapPin, Phone, Globe } from "lucide-react";
import { SettingsLogoUpload } from "@/components/settings-logo-upload";
import {
  companySettingsSchema,
  type CompanySettings,
} from "@/lib/settings-schemas";
import {
  applyCNPJMask,
  applyPhoneMask,
  applyCEPMask,
  validateCNPJ,
} from "@/lib/validators";

interface SettingsEmpresaFormProps {
  initialData: CompanySettings;
  onSave: (data: CompanySettings) => Promise<void>;
  readOnly?: boolean;
}

export function SettingsEmpresaForm({
  initialData,
  onSave,
  readOnly = false,
}: SettingsEmpresaFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CompanySettings>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: initialData,
  });

  const logoValue = watch("logo");
  const cnpjValue = watch("cnpj");
  const cepValue = watch("endereco.cep");

  // Reset success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const onSubmit = async (data: CompanySettings) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Validate CNPJ if provided
      if (data.cnpj && !validateCNPJ(data.cnpj)) {
        setSaveError("CNPJ invalido. Verifique os digitos.");
        setIsSaving(false);
        return;
      }

      await onSave(data);
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Erro ao salvar configuracoes"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCNPJMask(e.target.value);
    setValue("cnpj", masked, { shouldDirty: true });
  };

  const handlePhoneChange = (
    field: "telefonePrincipal" | "telefoneSecundario" | "whatsappComercial"
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyPhoneMask(e.target.value);
      setValue(field, masked, { shouldDirty: true });
    };
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCEPMask(e.target.value);
    setValue("endereco.cep", masked, { shouldDirty: true });
  };

  const searchCEP = async () => {
    const cep = cepValue?.replace(/\D/g, "");
    if (!cep || cep.length !== 8) return;

    setIsSearchingCep(true);

    try {
      const response = await fetch(`/api/settings/cep/${cep}`);
      const data = await response.json();

      if (response.ok) {
        setValue("endereco.logradouro", data.logradouro, { shouldDirty: true });
        setValue("endereco.bairro", data.bairro, { shouldDirty: true });
        setValue("endereco.cidade", data.cidade, { shouldDirty: true });
        setValue("endereco.estado", data.estado, { shouldDirty: true });
        setValue("endereco.cep", data.cep, { shouldDirty: true });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Auto-search CEP when complete
  useEffect(() => {
    const cep = cepValue?.replace(/\D/g, "");
    if (cep?.length === 8) {
      searchCEP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepValue]);

  const handleLogoUpload = (path: string) => {
    setValue("logo", path, { shouldDirty: true });
  };

  const handleLogoRemove = () => {
    setValue("logo", "", { shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Logo da Empresa
          </CardTitle>
          <CardDescription>
            Logo exibido em documentos e interface do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsLogoUpload
            currentLogo={logoValue}
            onUploadSuccess={handleLogoUpload}
            onRemove={handleLogoRemove}
            readOnly={readOnly}
          />
        </CardContent>
      </Card>

      {/* Company Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>
            Informacoes basicas da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Razao Social *</Label>
            <Input
              id="nome"
              {...register("nome")}
              placeholder="Nome da empresa"
              disabled={readOnly}
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
            <Input
              id="nomeFantasia"
              {...register("nomeFantasia")}
              placeholder="Nome fantasia"
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={cnpjValue || ""}
              onChange={handleCNPJChange}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              disabled={readOnly}
            />
            {errors.cnpj && (
              <p className="text-sm text-destructive">{errors.cnpj.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inscricaoEstadual">Inscricao Estadual</Label>
            <Input
              id="inscricaoEstadual"
              {...register("inscricaoEstadual")}
              placeholder="Inscricao estadual"
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="email@empresa.com.br"
              disabled={readOnly}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register("website")}
              placeholder="https://www.empresa.com.br"
              disabled={readOnly}
            />
            {errors.website && (
              <p className="text-sm text-destructive">
                {errors.website.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contato
          </CardTitle>
          <CardDescription>
            Telefones de contato da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="telefonePrincipal">Telefone Principal</Label>
            <Input
              id="telefonePrincipal"
              value={watch("telefonePrincipal") || ""}
              onChange={handlePhoneChange("telefonePrincipal")}
              placeholder="(00) 00000-0000"
              maxLength={15}
              disabled={readOnly}
            />
            {errors.telefonePrincipal && (
              <p className="text-sm text-destructive">
                {errors.telefonePrincipal.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefoneSecundario">Telefone Secundario</Label>
            <Input
              id="telefoneSecundario"
              value={watch("telefoneSecundario") || ""}
              onChange={handlePhoneChange("telefoneSecundario")}
              placeholder="(00) 00000-0000"
              maxLength={15}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappComercial">WhatsApp Comercial</Label>
            <Input
              id="whatsappComercial"
              value={watch("whatsappComercial") || ""}
              onChange={handlePhoneChange("whatsappComercial")}
              placeholder="(00) 00000-0000"
              maxLength={15}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereco
          </CardTitle>
          <CardDescription>
            Endereco da empresa. Digite o CEP para busca automatica.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                value={cepValue || ""}
                onChange={handleCEPChange}
                placeholder="00000-000"
                maxLength={9}
                disabled={readOnly}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={searchCEP}
                disabled={isSearchingCep || readOnly}
              >
                {isSearchingCep ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.endereco?.cep && (
              <p className="text-sm text-destructive">
                {errors.endereco.cep.message}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-4">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input
              id="logradouro"
              {...register("endereco.logradouro")}
              placeholder="Rua, Avenida, etc."
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="numero">Numero</Label>
            <Input
              id="numero"
              {...register("endereco.numero")}
              placeholder="123"
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              {...register("endereco.complemento")}
              placeholder="Sala, Andar, etc."
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              {...register("endereco.bairro")}
              placeholder="Bairro"
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2 md:col-span-4">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              {...register("endereco.cidade")}
              placeholder="Cidade"
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="estado">Estado</Label>
            <Input
              id="estado"
              {...register("endereco.estado")}
              placeholder="UF"
              maxLength={2}
              disabled={readOnly}
            />
            {errors.endereco?.estado && (
              <p className="text-sm text-destructive">
                {errors.endereco.estado.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Section */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {saveSuccess && (
              <p className="text-sm text-green-600">
                Configuracoes salvas com sucesso!
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSaving || !isDirty}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configuracoes"
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
