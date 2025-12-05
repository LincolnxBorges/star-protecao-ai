"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Car, Building2 } from "lucide-react";

// ===========================================
// Types
// ===========================================

interface BlacklistItem {
  id: string;
  marca: string;
  modelo: string | null;
  motivo: string | null;
  isActive: boolean;
  createdAt: string | null;
}

// ===========================================
// Component
// ===========================================

export function AdminBlacklistTable() {
  const [items, setItems] = useState<BlacklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    motivo: "",
  });

  // Fetch items
  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/blacklist");
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        setError(data.error?.message || "Erro ao carregar blacklist");
      }
    } catch {
      setError("Erro ao carregar blacklist");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateDialog() {
    setFormData({
      marca: "",
      modelo: "",
      motivo: "",
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim() || null,
        motivo: formData.motivo.trim() || undefined,
      };

      const response = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || "Erro ao adicionar a blacklist");
        return;
      }

      setIsDialogOpen(false);
      fetchItems();
    } catch {
      setError("Erro ao adicionar a blacklist");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este item da blacklist?")) {
      return;
    }

    try {
      const response = await fetch(`/api/blacklist/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchItems();
      } else {
        setError(data.error?.message || "Erro ao remover da blacklist");
      }
    } catch {
      setError("Erro ao remover da blacklist");
    }
  }

  // Separate brands (modelo=null) from models
  const brands = items.filter((item) => item.modelo === null);
  const models = items.filter((item) => item.modelo !== null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.length} itens na blacklist
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Adicionar a Blacklist</DialogTitle>
                <DialogDescription>
                  Bloqueie uma marca inteira ou um modelo especifico
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="marca">Marca *</Label>
                  <Input
                    id="marca"
                    placeholder="Ex: BMW, AUDI, MERCEDES"
                    value={formData.marca}
                    onChange={(e) =>
                      setFormData({ ...formData, marca: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="modelo">
                    Modelo{" "}
                    <span className="text-muted-foreground font-normal">
                      (deixe em branco para bloquear toda a marca)
                    </span>
                  </Label>
                  <Input
                    id="modelo"
                    placeholder="Ex: FOCUS, FUSION, CACTUS"
                    value={formData.modelo}
                    onChange={(e) =>
                      setFormData({ ...formData, modelo: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="motivo">
                    Motivo{" "}
                    <span className="text-muted-foreground font-normal">
                      (opcional)
                    </span>
                  </Label>
                  <Input
                    id="motivo"
                    placeholder="Ex: Nao trabalhamos com esta marca"
                    value={formData.motivo}
                    onChange={(e) =>
                      setFormData({ ...formData, motivo: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Adicionar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum item na blacklist
        </div>
      ) : (
        <div className="space-y-6">
          {/* Blocked Brands */}
          {brands.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Marcas Bloqueadas
                <Badge variant="secondary">{brands.length}</Badge>
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands
                      .sort((a, b) => a.marca.localeCompare(b.marca))
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.marca}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.motivo || "Nao trabalhamos com este veiculo"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remover</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Blocked Models */}
          {models.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Car className="h-4 w-4" />
                Modelos Bloqueados
                <Badge variant="secondary">{models.length}</Badge>
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models
                      .sort((a, b) => {
                        const marcaCompare = a.marca.localeCompare(b.marca);
                        if (marcaCompare !== 0) return marcaCompare;
                        return (a.modelo || "").localeCompare(b.modelo || "");
                      })
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.marca}</TableCell>
                          <TableCell className="font-medium">
                            {item.modelo}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.motivo || "Nao trabalhamos com este veiculo"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remover</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
