import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FooterLink {
  href: string;
  label: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface DashboardFooterProps {
  companyName?: string;
  description?: string;
  sections?: FooterSection[];
  socialLinks?: SocialLink[];
  showNewsletter?: boolean;
  onNewsletterSubmit?: (email: string) => void;
  className?: string;
}

const DEFAULT_SECTIONS: FooterSection[] = [
  {
    title: "Produto",
    links: [
      { href: "/recursos", label: "Recursos" },
      { href: "/precos", label: "Preços" },
      { href: "/integracao", label: "Integração" },
      { href: "/atualizacoes", label: "Atualizações" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/sobre", label: "Sobre nós" },
      { href: "/carreiras", label: "Carreiras" },
      { href: "/contato", label: "Contato" },
      { href: "/parceiros", label: "Parceiros" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { href: "/ajuda", label: "Central de Ajuda" },
      { href: "/documentacao", label: "Documentação" },
      { href: "/status", label: "Status" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/termos", label: "Termos de Uso" },
      { href: "/privacidade", label: "Privacidade" },
      { href: "/cookies", label: "Cookies" },
      { href: "/lgpd", label: "LGPD" },
    ],
  },
];

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { href: "https://facebook.com", icon: <Facebook className="h-5 w-5" />, label: "Facebook" },
  { href: "https://instagram.com", icon: <Instagram className="h-5 w-5" />, label: "Instagram" },
  { href: "https://twitter.com", icon: <Twitter className="h-5 w-5" />, label: "Twitter" },
  { href: "https://linkedin.com", icon: <Linkedin className="h-5 w-5" />, label: "LinkedIn" },
];

export function DashboardFooter({
  companyName = "Star Proteção",
  description = "Proteja seu veículo com a melhor cobertura e atendimento do mercado.",
  sections = DEFAULT_SECTIONS,
  socialLinks = DEFAULT_SOCIAL_LINKS,
  showNewsletter = true,
  onNewsletterSubmit,
  className,
}: DashboardFooterProps) {
  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    if (email && onNewsletterSubmit) {
      onNewsletterSubmit(email);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t bg-muted/30",
        className
      )}
    >
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold text-primary">
              {companyName}
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              {description}
            </p>

            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        {showNewsletter && (
          <div className="mt-12 border-t pt-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Assine nossa newsletter
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Receba novidades e ofertas exclusivas no seu email.
                </p>
              </div>
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex w-full max-w-md gap-2 sm:w-auto"
              >
                <Input
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  required
                  className="flex-1"
                  aria-label="Email para newsletter"
                />
                <Button type="submit">
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                  Assinar
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} {companyName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
