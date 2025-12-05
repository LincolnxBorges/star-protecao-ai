"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Database,
  Download,
  Trash2,
  MoreHorizontal,
  HardDrive,
  Clock,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  type: "manual" | "automatic";
}

export function SettingsBackupManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBackups = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/backup");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar backups");
      }

      setBackups(data.backups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "manual" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar backup");
      }

      // Refresh the list
      await fetchBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar backup");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteBackup = async (filename: string) => {
    setIsDeleting(filename);
    setError(null);

    try {
      const response = await fetch(
        `/api/settings/backup?filename=${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover backup");
      }

      // Refresh the list
      await fetchBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover backup");
    } finally {
      setIsDeleting(null);
    }
  };

  const downloadExport = (type: "settings" | "templates", format: "json" | "csv") => {
    window.open(`/api/settings/export?type=${type}&format=${format}`, "_blank");
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Backup Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backups
              </CardTitle>
              <CardDescription>
                Gerencie backups das configuracoes e templates
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBackups}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                onClick={createBackup}
                disabled={isCreating}
                size="sm"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <HardDrive className="mr-2 h-4 w-4" />
                    Criar Backup
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Database className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhum backup encontrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Clique em &quot;Criar Backup&quot; para fazer o primeiro backup
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-mono text-sm">
                      {backup.filename}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          backup.type === "manual"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {backup.type === "manual" ? "Manual" : "Automatico"}
                      </span>
                    </TableCell>
                    <TableCell>{backup.sizeFormatted}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(backup.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isDeleting === backup.filename}
                            aria-label={`Remover backup ${backup.filename}`}
                          >
                            {isDeleting === backup.filename ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover backup?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover o backup &quot;{backup.filename}&quot;?
                              Esta acao nao pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBackup(backup.filename)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </CardTitle>
          <CardDescription>
            Exporte configuracoes e templates em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Settings Export */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium">Configuracoes</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Todas as configuracoes do sistema
              </p>
              <div className="mt-4 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                      <MoreHorizontal className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => downloadExport("settings", "json")}
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => downloadExport("settings", "csv")}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Templates Export */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium">Templates de Mensagem</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Todos os templates configurados
              </p>
              <div className="mt-4 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                      <MoreHorizontal className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => downloadExport("templates", "json")}
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => downloadExport("templates", "csv")}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
