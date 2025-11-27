/**
 * Seller Profile Modal Component
 * @module components/vendedores-modal-profile
 *
 * Modal para visualizar perfil detalhado do vendedor com metricas e grafico.
 * T046, T047, T048
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getSellerProfileAction } from "@/app/(admin)/vendedores/actions";
import type { Seller, SellerMetrics } from "@/lib/types/sellers";
import { SELLER_STATUS_CONFIG } from "@/lib/types/sellers";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type PeriodType = "thisMonth" | "last3Months" | "last6Months" | "lastYear";

interface VendedoresModalProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string | null;
}

interface MonthlyData {
  month: string;
  year: number;
  quotations: number;
  accepted: number;
}

interface QuotationSummary {
  id: string;
  vehicleMarca: string;
  vehicleModelo: string;
  vehicleAno: string;
  customerName: string;
  mensalidade: number;
  status: string;
  createdAt: Date;
}

const PERIOD_OPTIONS: Array<{ value: PeriodType; label: string }> = [
  { value: "thisMonth", label: "Este mes" },
  { value: "last3Months", label: "Ultimos 3 meses" },
  { value: "last6Months", label: "Ultimos 6 meses" },
  { value: "lastYear", label: "Ultimo ano" },
];

const QUOTATION_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pendente", variant: "secondary" },
  ACCEPTED: { label: "Aceita", variant: "default" },
  EXPIRED: { label: "Expirada", variant: "outline" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
};

export function VendedoresModalProfile({
  open,
  onOpenChange,
  sellerId,
}: VendedoresModalProfileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>("thisMonth");
  const [seller, setSeller] = useState<Seller | null>(null);
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [monthlyEvolution, setMonthlyEvolution] = useState<MonthlyData[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<QuotationSummary[]>([]);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!sellerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSellerProfileAction(sellerId, period);
      if (result.success && result.data) {
        setSeller(result.data.seller);
        setMetrics(result.data.metrics);
        setMonthlyEvolution(result.data.monthlyEvolution);
        setRecentQuotations(
          result.data.recentQuotations.map((q) => ({
            ...q,
            createdAt: new Date(q.createdAt),
          }))
        );
      } else {
        setError(result.error || "Erro ao carregar perfil");
      }
    } catch {
      setError("Erro ao carregar perfil");
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, period]);

  useEffect(() => {
    if (open && sellerId) {
      void fetchProfile();
    }
  }, [open, sellerId, fetchProfile]);

  // Reset state quando modal fecha
  const resetState = useCallback(() => {
    setSeller(null);
    setMetrics(null);
    setMonthlyEvolution([]);
    setRecentQuotations([]);
    setPeriod("thisMonth");
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatResponseTime = (hours: number | null) => {
    if (hours === null) return "N/A";
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  if (!sellerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil do Vendedor
          </DialogTitle>
          <DialogDescription>
            Visualize metricas detalhadas e historico de performance.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
          </div>
        ) : seller && metrics ? (
          <div className="space-y-6">
            {/* Seller Info */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary">
                    {seller.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-semibold">{seller.name}</h3>
                  <Badge variant={SELLER_STATUS_CONFIG[seller.status].variant as "default" | "secondary" | "destructive"}>
                    {SELLER_STATUS_CONFIG[seller.status].label}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {seller.email}
                  </span>
                  {seller.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {seller.phone}
                    </span>
                  )}
                  {seller.cargo && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {seller.cargo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Metricas do Periodo</h4>
              <Select value={period} onValueChange={(v) => handlePeriodChange(v as PeriodType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Cotacoes</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{metrics.totalQuotations}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">Aceitas</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{metrics.acceptedQuotations}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Conversao</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{metrics.conversionRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Tempo Resp.</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {formatResponseTime(metrics.avgResponseTimeHours)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-lg font-semibold">{metrics.pendingQuotations}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Expiradas</p>
                <p className="text-lg font-semibold">{metrics.expiredQuotations}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Canceladas</p>
                <p className="text-lg font-semibold">{metrics.cancelledQuotations}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Potencial</p>
                <p className="text-lg font-semibold">{formatCurrency(metrics.potentialRevenue)}</p>
              </div>
            </div>

            {/* Evolution Chart */}
            {monthlyEvolution.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Evolucao Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyEvolution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="quotations"
                          name="Cotacoes"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="accepted"
                          name="Aceitas"
                          stroke="hsl(142.1 76.2% 36.3%)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Quotations */}
            {recentQuotations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Cotacoes Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {recentQuotations.map((quotation) => (
                      <div
                        key={quotation.id}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {quotation.vehicleMarca} {quotation.vehicleModelo} {quotation.vehicleAno}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {quotation.customerName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge
                            variant={
                              QUOTATION_STATUS_CONFIG[quotation.status]?.variant || "secondary"
                            }
                            className="text-xs"
                          >
                            {QUOTATION_STATUS_CONFIG[quotation.status]?.label || quotation.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(quotation.createdAt, {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
