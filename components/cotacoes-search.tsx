/**
 * Cotacoes Search Component
 * @module components/cotacoes-search
 *
 * Campo de busca com debounce de 300ms conforme FR-004.
 * Busca por nome, placa, telefone, CPF do cliente.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CotacoesSearchProps {
  value: string;
  onSearch: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

const DEBOUNCE_MS = 300;

export function CotacoesSearch({
  value,
  onSearch,
  isLoading,
  placeholder = "Buscar por nome, placa, telefone ou CPF...",
  className,
}: CotacoesSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change with debounce
  const handleChange = (newValue: string) => {
    setInputValue(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      onSearch(newValue);
    }, DEBOUNCE_MS);
  };

  // Clear search
  const handleClear = () => {
    setInputValue("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearch("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        aria-label="Buscar cotacoes por nome, placa, telefone ou CPF"
        className={cn(
          "pl-9 pr-9",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      />
      {inputValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={isLoading}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Limpar busca</span>
        </Button>
      )}
    </div>
  );
}
