"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  RefreshCw,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  userId: string;
  category: string;
  field: string;
  previousValue: string | null;
  changedAt: string;
  description: string;
}

const categoryLabels: Record<string, string> = {
  company: "Empresa",
  quotation: "Cotacao",
  whatsapp: "WhatsApp",
  notification: "Notificacoes",
  system: "Sistema",
};

const categoryColors: Record<string, string> = {
  company: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  quotation: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  whatsapp: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  notification: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  system: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function SettingsAuditViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [limit, setLimit] = useState<number>(25);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }
      params.set("limit", limit.toString());

      const response = await fetch(`/api/settings/audit?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Erro ao buscar logs de auditoria");
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Log de Auditoria
            </CardTitle>
            <CardDescription>
              Historico de alteracoes em campos sensiveis das configuracoes
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            aria-label="Atualizar logs de auditoria"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="audit-category-filter"
              className="text-sm font-medium"
            >
              Categoria:
            </label>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger
                id="audit-category-filter"
                className="w-[160px]"
                aria-label="Filtrar por categoria"
              >
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
                <SelectItem value="quotation">Cotacao</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="notification">Notificacoes</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="audit-limit-filter"
              className="text-sm font-medium"
            >
              Limite:
            </label>
            <Select
              value={limit.toString()}
              onValueChange={(val) => setLimit(parseInt(val, 10))}
            >
              <SelectTrigger
                id="audit-limit-filter"
                className="w-[100px]"
                aria-label="Limitar resultados"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhuma alteracao sensivel registrada
            </p>
            <p className="text-xs text-muted-foreground">
              Alteracoes em campos como senhas e API keys aparecerao aqui
            </p>
          </div>
        )}

        {/* Audit Log Table */}
        {!isLoading && !error && logs.length > 0 && (
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="min-w-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Data/Hora</TableHead>
                  <TableHead className="w-[100px]">Categoria</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead className="w-[150px]">Valor Anterior</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {formatDate(log.changedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={categoryColors[log.category] || ""}
                      >
                        {categoryLabels[log.category] || log.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <span title={log.description}>{log.description}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.previousValue || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </ScrollArea>
        )}

        {/* Info Footer */}
        <p className="text-xs text-muted-foreground">
          Este log registra alteracoes em campos sensiveis como senhas, API keys e credenciais.
          Valores anteriores sao mascarados para proteger informacoes confidenciais.
        </p>
      </CardContent>
    </Card>
  );
}
