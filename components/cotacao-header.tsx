/**
 * Cotacao Header Component
 * @module components/cotacao-header
 *
 * Header para paginas publicas de cotacao.
 * Exibe logo, nome da empresa e contatos.
 */

import Image from "next/image";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CotacaoHeaderProps {
  companyName: string;
  logo?: string;
  phone?: string;
  whatsapp?: string;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function getWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${fullNumber}`;
}

export function CotacaoHeader({
  companyName,
  logo,
  phone,
  whatsapp,
}: CotacaoHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Company Name */}
          <div className="flex items-center gap-3">
            {logo ? (
              <Image
                src={logo}
                alt={companyName}
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                {companyName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-foreground text-lg hidden sm:inline-block">
              {companyName}
            </span>
          </div>

          {/* Contact Buttons */}
          <div className="flex items-center gap-2">
            {phone && (
              <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                <a href={`tel:${phone.replace(/\D/g, "")}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  {formatPhone(phone)}
                </a>
              </Button>
            )}

            {whatsapp && (
              <Button variant="default" size="sm" asChild>
                <a
                  href={getWhatsAppLink(whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">WhatsApp</span>
                  <span className="sm:hidden">Contato</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
