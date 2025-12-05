/**
 * Login Header Component
 * @module components/login-header
 *
 * Header para a pagina de login.
 * Exibe logo, nome da empresa e slogan.
 */

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginHeaderProps {
  companyName: string;
  logo?: string;
  whatsapp?: string;
}

function getWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${fullNumber}`;
}

export function LoginHeader({ companyName, logo, whatsapp }: LoginHeaderProps) {
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Company Name */}
          <div className="flex items-center gap-3">
            {logo ? (
              <Image
                src={logo}
                alt={companyName}
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-foreground">{companyName}</span>
          </div>

          {/* Contact */}
          {whatsapp ? (
            <Button variant="ghost" size="sm" asChild>
              <a
                href={getWhatsAppLink(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Precisa de ajuda?
              </a>
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">
              Protecao Veicular de Confianca
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
