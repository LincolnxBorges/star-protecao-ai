"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  name: string;
  eventType: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateVariable {
  name: string;
  description: string;
}

const eventTypeLabels: Record<string, string> = {
  quotation_created: "Cotacao Criada",
  quotation_expiring: "Cotacao Expirando",
  quotation_accepted: "Cotacao Aceita",
};

export function SettingsTemplateEditor() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEventType, setFormEventType] = useState("quotation_created");
  const [formContent, setFormContent] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Variables state
  const [availableVariables, setAvailableVariables] = useState<TemplateVariable[]>([]);
  const [invalidVariables, setInvalidVariables] = useState<string[]>([]);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/templates");
      if (!response.ok) throw new Error("Erro ao carregar templates");
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVariables = useCallback(async (eventType: string) => {
    try {
      const response = await fetch(
        `/api/settings/templates/validate?eventType=${eventType}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableVariables(data.variables || []);
      }
    } catch {
      console.error("Erro ao carregar variaveis");
    }
  }, []);

  const validateContent = useCallback(async (content: string, eventType: string) => {
    if (!content) {
      setInvalidVariables([]);
      return;
    }

    try {
      const response = await fetch("/api/settings/templates/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, eventType }),
      });

      if (response.ok) {
        const data = await response.json();
        setInvalidVariables(data.invalidVariables || []);
      }
    } catch {
      console.error("Erro ao validar template");
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (dialogOpen) {
      fetchVariables(formEventType);
    }
  }, [dialogOpen, formEventType, fetchVariables]);

  useEffect(() => {
    if (dialogOpen && formContent) {
      const timer = setTimeout(() => {
        validateContent(formContent, formEventType);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, formContent, formEventType, validateContent]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingTemplate(null);
    setFormName("");
    setFormEventType("quotation_created");
    setFormContent("");
    setFormIsActive(true);
    setFormError(null);
    setInvalidVariables([]);
    setDialogOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setDialogMode("edit");
    setEditingTemplate(template);
    setFormName(template.name);
    setFormEventType(template.eventType);
    setFormContent(template.content);
    setFormIsActive(template.isActive);
    setFormError(null);
    setInvalidVariables([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formContent) {
      setFormError("Nome e conteúdo são obrigatórios");
      return;
    }

    if (invalidVariables.length > 0) {
      setFormError("Corrija as variáveis inválidas antes de salvar");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const url =
        dialogMode === "create"
          ? "/api/settings/templates"
          : `/api/settings/templates/${editingTemplate?.id}`;

      const response = await fetch(url, {
        method: dialogMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          eventType: formEventType,
          content: formContent,
          isActive: formIsActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar template");
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/settings/templates/${templateToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Erro ao excluir template");

      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setIsDeleting(false);
    }
  };

  const insertVariable = (variableName: string) => {
    const textarea = document.getElementById("template-content") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formContent;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newContent = `${before}{{${variableName}}}${after}`;
      setFormContent(newContent);
      // Focus and set cursor position after variable
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + variableName.length + 4;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const generatePreview = () => {
    const sampleData: Record<string, string> = {
      cliente_nome: "João Silva",
      cliente_telefone: "(11) 99999-9999",
      cliente_email: "joao@email.com",
      veiculo_marca: "Honda",
      veiculo_modelo: "Civic",
      veiculo_ano: "2023",
      veiculo_placa: "ABC-1234",
      valor_fipe: "120.000,00",
      mensalidade: "189,90",
      adesao: "960,00",
      cota_participacao: "2.400,00",
      validade_dias: "7",
      dias_restantes: "2",
      empresa_nome: "Star Proteção",
    };

    let preview = formContent;
    for (const [key, value] of Object.entries(sampleData)) {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    setPreviewContent(preview);
    setShowPreview(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Templates de Mensagens
              </CardTitle>
              <CardDescription>
                Gerencie os templates de mensagens para WhatsApp
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {templates.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum template cadastrado. Clique em "Novo Template" para criar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {eventTypeLabels[template.eventType] || template.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge variant="default" className="bg-green-600">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTemplateToDelete(template);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Novo Template" : "Editar Template"}
            </DialogTitle>
            <DialogDescription>
              Configure o template de mensagem para WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome *</Label>
                <Input
                  id="template-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Cotacao Criada"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-event">Tipo de Evento *</Label>
                <Select value={formEventType} onValueChange={setFormEventType}>
                  <SelectTrigger id="template-event">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quotation_created">Cotacao Criada</SelectItem>
                    <SelectItem value="quotation_expiring">Cotacao Expirando</SelectItem>
                    <SelectItem value="quotation_accepted">Cotacao Aceita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="template-content">Conteudo *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePreview}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Preview
                  </Button>
                </div>
              </div>
              <Textarea
                id="template-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Digite o conteudo do template..."
                rows={8}
                className="font-mono text-sm"
              />
              {invalidVariables.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Variaveis invalidas: {invalidVariables.join(", ")}
                </div>
              )}
            </div>

            {/* Available Variables */}
            <div className="space-y-2">
              <Label>Variaveis Disponiveis</Label>
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable) => (
                    <Button
                      key={variable.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto py-1 text-xs"
                      onClick={() => insertVariable(variable.name)}
                      title={variable.description}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {`{{${variable.name}}}`}
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Clique em uma variavel para inserir no cursor
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="template-active">Template Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Templates inativos nao serao usados para envio
                </p>
              </div>
              <Switch
                id="template-active"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>

            {formError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
            <DialogDescription>
              Visualizacao com dados de exemplo
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <pre className="whitespace-pre-wrap text-sm">{previewContent}</pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"?
              Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
