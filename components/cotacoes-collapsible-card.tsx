/**
 * Cotacoes Collapsible Card Component
 * @module components/cotacoes-collapsible-card
 *
 * Card wrapper que e colapsavel em mobile conforme FR-033.
 * Mostra o card expandido por padrao em desktop, colapsavel em mobile.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CotacoesCollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CotacoesCollapsibleCard({
  title,
  icon,
  children,
  defaultOpen = true,
  className,
}: CotacoesCollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={className}>
      {/* Mobile: Collapsible */}
      <div className="lg:hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  {icon}
                  {title}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">{children}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop: Always expanded */}
      <div className="hidden lg:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </div>
    </Card>
  );
}
