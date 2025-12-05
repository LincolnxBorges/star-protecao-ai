/**
 * Seller Search Component
 * @module components/vendedores-search
 *
 * Input de busca com debounce e select de ordenacao.
 */

"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SellerSortField } from "@/lib/types/sellers";

interface VendedoresSearchProps {
  search: string;
  onSearchChange: (search: string) => void;
  sortBy: SellerSortField;
  onSortByChange: (sortBy: SellerSortField) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (sortOrder: "asc" | "desc") => void;
  disabled?: boolean;
}

const SORT_OPTIONS: Array<{ value: SellerSortField; label: string }> = [
  { value: "name", label: "Nome" },
  { value: "quotations", label: "Cotacoes" },
  { value: "accepted", label: "Aceitas" },
  { value: "conversion", label: "Conversao" },
  { value: "responseTime", label: "Tempo de Resposta" },
  { value: "lastLead", label: "Ultimo Lead" },
  { value: "createdAt", label: "Data Cadastro" },
];

export function VendedoresSearch({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  disabled,
}: VendedoresSearchProps) {
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  // Sync local state when external search changes
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleClear = () => {
    setLocalSearch("");
    onSearchChange("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9 pr-9"
          disabled={disabled}
        />
        {localSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Limpar busca</span>
          </Button>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2">
        <Select
          value={sortBy}
          onValueChange={(value) => onSortByChange(value as SellerSortField)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortOrder}
          onValueChange={(value) => onSortOrderChange(value as "asc" | "desc")}
          disabled={disabled}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">A-Z</SelectItem>
            <SelectItem value="desc">Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
