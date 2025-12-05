/**
 * Seller Form Modal Component
 * @module components/vendedores-modal-form
 *
 * Modal para criar ou editar vendedor com react-hook-form e validacao Zod.
 */

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSellerAction,
  updateSellerAction,
} from "@/app/(admin)/vendedores/actions";
import {
  createSellerSchema,
  updateSellerSchema,
  type CreateSellerFormData,
  type UpdateSellerFormData,
  type SellerWithMetrics,
  SELLER_STATUS_CONFIG,
} from "@/lib/types/sellers";

interface VendedoresModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  seller?: SellerWithMetrics | null;
}

export function VendedoresModalForm({
  open,
  onOpenChange,
  onSuccess,
  seller,
}: VendedoresModalFormProps) {
  const isEditMode = !!seller;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Create form
  const createForm = useForm<CreateSellerFormData>({
    resolver: zodResolver(createSellerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cargo: "",
      role: "SELLER",
      password: "",
      status: "ACTIVE",
      participateRoundRobin: true,
      notifyEmail: true,
      notifyWhatsapp: true,
    },
  });

  // Edit form
  const editForm = useForm<UpdateSellerFormData>({
    resolver: zodResolver(updateSellerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cargo: "",
      role: "SELLER",
      notifyEmail: true,
      notifyWhatsapp: true,
    },
  });

  // Pre-fill edit form when seller changes
  useEffect(() => {
    if (seller && open) {
      editForm.reset({
        name: seller.name,
        email: seller.email,
        phone: seller.phone || "",
        cargo: seller.cargo || "",
        role: seller.role,
        notifyEmail: seller.notifyEmail,
        notifyWhatsapp: seller.notifyWhatsapp,
      });
    }
  }, [seller, open, editForm]);

  // Reset create form when opening in create mode
  useEffect(() => {
    if (!seller && open) {
      createForm.reset();
    }
  }, [seller, open, createForm]);

  const onCreateSubmit = async (data: CreateSellerFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await createSellerAction(data);

      if (result.success) {
        toast.success("Vendedor criado com sucesso!");
        createForm.reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        const errorMsg = result.error || "Erro ao criar vendedor";
        setServerError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = "Erro inesperado. Tente novamente.";
      setServerError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: UpdateSellerFormData) => {
    if (!seller) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await updateSellerAction(seller.id, data);

      if (result.success) {
        toast.success("Vendedor atualizado com sucesso!");
        onOpenChange(false);
        onSuccess?.();
      } else {
        const errorMsg = result.error || "Erro ao atualizar vendedor";
        setServerError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = "Erro inesperado. Tente novamente.";
      setServerError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      createForm.reset();
      editForm.reset();
      setServerError(null);
      onOpenChange(false);
    }
  };

  // Watch common fields (usar forms especificos para evitar erro de tipo)
  const watchRole = isEditMode ? editForm.watch("role") : createForm.watch("role");
  const watchNotifyEmail = isEditMode ? editForm.watch("notifyEmail") : createForm.watch("notifyEmail");
  const watchNotifyWhatsapp = isEditMode ? editForm.watch("notifyWhatsapp") : createForm.watch("notifyWhatsapp");

  // Create mode specific watches
  const watchStatus = !isEditMode ? createForm.watch("status") : undefined;
  const watchParticipateRoundRobin = !isEditMode
    ? createForm.watch("participateRoundRobin")
    : undefined;

  // Form errors
  const formErrors = isEditMode ? editForm.formState.errors : createForm.formState.errors;

  // Helper para register
  const registerField = (name: "name" | "email" | "phone" | "cargo") => {
    return isEditMode ? editForm.register(name) : createForm.register(name);
  };

  // Helper para setValue
  const setFormValue = (name: "role" | "notifyEmail" | "notifyWhatsapp", value: unknown) => {
    if (isEditMode) {
      editForm.setValue(name, value as never);
    } else {
      createForm.setValue(name, value as never);
    }
  };

  // Handler para submit
  const handleFormSubmit = isEditMode
    ? editForm.handleSubmit(onEditSubmit)
    : createForm.handleSubmit(onCreateSubmit);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Vendedor" : "Novo Vendedor"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Atualize os dados do vendedor."
              : "Preencha os dados para cadastrar um novo vendedor."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleFormSubmit}
          className="space-y-4"
        >
          {serverError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {serverError}
            </div>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Nome completo"
              {...registerField("name")}
              disabled={isSubmitting}
            />
            {formErrors.name && (
              <p className="text-sm text-destructive">
                {formErrors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              {...registerField("email")}
              disabled={isSubmitting}
            />
            {formErrors.email && (
              <p className="text-sm text-destructive">
                {formErrors.email.message}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              placeholder="(11) 99999-9999"
              {...registerField("phone")}
              disabled={isSubmitting}
            />
            {formErrors.phone && (
              <p className="text-sm text-destructive">
                {formErrors.phone.message}
              </p>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              placeholder="Ex: Consultor de Vendas"
              {...registerField("cargo")}
              disabled={isSubmitting}
            />
            {formErrors.cargo && (
              <p className="text-sm text-destructive">
                {formErrors.cargo.message}
              </p>
            )}
          </div>

          {/* Role e Status (Status apenas no modo criar) */}
          <div className={isEditMode ? "" : "grid grid-cols-2 gap-4"}>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil *</Label>
              <Select
                value={watchRole}
                onValueChange={(value) => setFormValue("role", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELLER">Vendedor</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-destructive">
                  {formErrors.role.message}
                </p>
              )}
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={watchStatus}
                  onValueChange={(value) =>
                    createForm.setValue(
                      "status",
                      value as "ACTIVE" | "INACTIVE" | "VACATION"
                    )
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SELLER_STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.status && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.status.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Senha (apenas no modo criar) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimo 8 caracteres"
                {...createForm.register("password")}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Deve ter no minimo 8 caracteres, 1 numero e 1 letra maiuscula.
              </p>
              {createForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>
          )}

          {/* Switches */}
          <div className="space-y-4 pt-2 border-t">
            {/* Participar do Round-Robin (apenas no modo criar) */}
            {!isEditMode && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="participateRoundRobin">
                    Participar do Round-Robin
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recebera leads automaticamente
                  </p>
                </div>
                <Switch
                  id="participateRoundRobin"
                  checked={watchParticipateRoundRobin}
                  onCheckedChange={(checked) =>
                    createForm.setValue("participateRoundRobin", checked)
                  }
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifyEmail">Notificar por Email</Label>
                <p className="text-xs text-muted-foreground">
                  Receber novos leads por email
                </p>
              </div>
              <Switch
                id="notifyEmail"
                checked={watchNotifyEmail}
                onCheckedChange={(checked) => setFormValue("notifyEmail", checked)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifyWhatsapp">Notificar por WhatsApp</Label>
                <p className="text-xs text-muted-foreground">
                  Receber novos leads por WhatsApp
                </p>
              </div>
              <Switch
                id="notifyWhatsapp"
                checked={watchNotifyWhatsapp}
                onCheckedChange={(checked) => setFormValue("notifyWhatsapp", checked)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditMode ? "Salvar Alteracoes" : "Criar Vendedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
