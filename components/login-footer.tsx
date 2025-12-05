/**
 * Login Footer Component
 * @module components/login-footer
 *
 * Footer para a pagina de login.
 * Exibe links de contato e informacoes da empresa.
 */

import { Phone, Mail } from "lucide-react";

interface LoginFooterProps {
  companyName: string;
  phone?: string;
  email?: string;
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

export function LoginFooter({ companyName, phone, email }: LoginFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Contact Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {phone && (
              <a
                href={`tel:${phone.replace(/\D/g, "")}`}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                {formatPhone(phone)}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                {email}
              </a>
            )}
            {!phone && !email && (
              <span>Fale Conosco</span>
            )}
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} {companyName}
          </p>
        </div>
      </div>
    </footer>
  );
}
