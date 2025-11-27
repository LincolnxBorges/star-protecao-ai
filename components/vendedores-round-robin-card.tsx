/**
 * Round-Robin Configuration Card Component
 * @module components/vendedores-round-robin-card
 *
 * Card que exibe configuracao atual do round-robin e fila de vendedores com drag-and-drop.
 * T054, T061, T062, T063: vendedores-round-robin-card.tsx
 */

"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import {
  Settings,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  GripVertical,
  RotateCcw,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getRoundRobinConfigAction,
  reorderRoundRobinQueueAction,
  resetRoundRobinQueueAction,
} from "@/app/(admin)/vendedores/actions";
import type { RoundRobinConfig, SellerQueueItem } from "@/lib/types/sellers";
import { ROUND_ROBIN_METHOD_CONFIG } from "@/lib/types/sellers";

interface VendedoresRoundRobinCardProps {
  onOpenConfig: () => void;
}

// Sortable Item Component
interface SortableQueueItemProps {
  item: SellerQueueItem;
  index: number;
  getInitials: (name: string) => string;
}

function SortableQueueItem({ item, index, getInitials }: SortableQueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.seller.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border ${
        item.isNext
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "bg-muted/30 hover:bg-muted/50"
      } ${isDragging ? "shadow-lg z-10" : ""}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs bg-background">
          {getInitials(item.seller.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {item.seller.name}
        </p>
        {item.pendingCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {item.pendingCount} pendente{item.pendingCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {item.isNext ? (
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-primary fill-primary" />
          <Badge variant="default" className="text-xs">
            Proximo
          </Badge>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground font-medium">
          #{index + 1}
        </span>
      )}
    </div>
  );
}

export function VendedoresRoundRobinCard({ onOpenConfig }: VendedoresRoundRobinCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<RoundRobinConfig | null>(null);
  const [queue, setQueue] = useState<SellerQueueItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getRoundRobinConfigAction();

      if (result.success && result.data) {
        setConfig(result.data.config);
        setQueue(result.data.queue);
      } else {
        setError(result.error || "Erro ao carregar configuracao");
      }
    } catch {
      setError("Erro ao carregar configuracao");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((item) => item.seller.id === active.id);
      const newIndex = queue.findIndex((item) => item.seller.id === over.id);

      const newQueue = arrayMove(queue, oldIndex, newIndex).map((item, index) => ({
        ...item,
        position: index + 1,
        isNext: index === 0,
      }));

      // Optimistic update
      setQueue(newQueue);

      // Persist to server
      startTransition(async () => {
        const orderedIds = newQueue.map((item) => item.seller.id);
        const result = await reorderRoundRobinQueueAction(orderedIds);

        if (result.success && result.data) {
          setQueue(result.data.queue);
          toast.success("Fila reordenada com sucesso!");
        } else {
          // Revert on error
          void fetchConfig();
          const errorMsg = result.error || "Erro ao reordenar fila";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      });
    }
  };

  const handleResetQueue = () => {
    startTransition(async () => {
      const result = await resetRoundRobinQueueAction();

      if (result.success && result.data) {
        setQueue(result.data.queue);
        toast.success("Fila resetada em ordem alfabetica!");
      } else {
        const errorMsg = result.error || "Erro ao resetar fila";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchConfig}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!config) return null;

  const methodConfig = ROUND_ROBIN_METHOD_CONFIG[config.method];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Distribuicao de Leads
            </CardTitle>
            <CardDescription>
              Arraste para reordenar a fila de distribuicao
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onOpenConfig}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Method */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{methodConfig.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {methodConfig.description}
          </p>
        </div>

        {/* Additional Settings */}
        <div className="flex flex-wrap gap-2">
          {config.pendingLeadLimit && (
            <Badge variant="outline" className="text-xs">
              Limite: {config.pendingLeadLimit} leads
            </Badge>
          )}
          {config.skipOverloaded && (
            <Badge variant="outline" className="text-xs">
              Pula sobrecarregados
            </Badge>
          )}
          {config.notifyWhenAllOverloaded && (
            <Badge variant="outline" className="text-xs">
              Notifica quando todos sobrecarregados
            </Badge>
          )}
        </div>

        {/* Queue with Drag and Drop */}
        {queue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Fila de Distribuicao ({queue.length})
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetQueue}
                disabled={isPending}
                className="text-xs h-7"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3 mr-1" />
                )}
                Resetar (A-Z)
              </Button>
            </div>

            <div className="relative">
              {isPending && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={queue.map((item) => item.seller.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {queue.map((item, index) => (
                      <SortableQueueItem
                        key={item.seller.id}
                        item={item}
                        index={index}
                        getInitials={getInitials}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              O vendedor marcado como &quot;Proximo&quot; recebera o proximo lead
            </p>
          </div>
        )}

        {queue.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Nenhum vendedor ativo na fila
          </div>
        )}
      </CardContent>
    </Card>
  );
}
