"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
}

interface DashboardNavbarProps {
  logo?: React.ReactNode;
  logoText?: string;
  links?: NavLink[];
  showAuthButtons?: boolean;
  onSignUpClick?: () => void;
  onLoginClick?: () => void;
  className?: string;
}

const DEFAULT_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/sobre", label: "Sobre" },
  { href: "/planos", label: "Planos" },
  { href: "/contato", label: "Contato" },
];

export function DashboardNavbar({
  logo,
  logoText = "Star Proteção",
  links = DEFAULT_LINKS,
  showAuthButtons = true,
  onSignUpClick,
  onLoginClick,
  className,
}: DashboardNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <nav
        className="container mx-auto flex h-16 items-center justify-between px-4"
        role="navigation"
        aria-label="Navegação principal"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-primary transition-colors hover:text-primary/90"
        >
          {logo || <span>{logoText}</span>}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons (Desktop) */}
        {showAuthButtons && (
          <div className="hidden md:flex md:items-center md:gap-3">
            <Button variant="ghost" onClick={onLoginClick} asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button onClick={onSignUpClick} asChild>
              <Link href="/signup">Cadastrar</Link>
            </Button>
          </div>
        )}

        {/* Mobile Menu Trigger */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-80 p-0">
            <div className="flex h-full flex-col">
              {/* Mobile Header */}
              <div className="flex h-16 items-center justify-between border-b px-4">
                <span className="text-xl font-bold text-primary">{logoText}</span>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4" aria-label="Menu mobile">
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Mobile Auth Buttons */}
              {showAuthButtons && (
                <div className="border-t p-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLoginClick?.();
                    }}
                    asChild
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignUpClick?.();
                    }}
                    asChild
                  >
                    <Link href="/signup">Cadastrar</Link>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
