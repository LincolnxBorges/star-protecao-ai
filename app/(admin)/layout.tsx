import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId } from "@/lib/sellers";
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, Ban, LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const seller = await getSellerByUserId(session.user.id);

  if (!seller) {
    redirect("/login");
  }

  const isAdmin = seller.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/cotacoes" className="font-bold text-xl">
              Star Protecao
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/cotacoes"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cotacoes
                </span>
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/precos"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Precos
                    </span>
                  </Link>
                  <Link
                    href="/blacklist"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Blacklist
                    </span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{seller.name}</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Administrador" : "Vendedor"}
              </p>
            </div>
            <form action="/api/auth/sign-out" method="POST">
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <nav className="md:hidden border-b">
        <div className="container flex items-center gap-4 px-4 py-2 overflow-x-auto">
          <Link
            href="/cotacoes"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Cotacoes
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/precos"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Precos
              </Link>
              <Link
                href="/blacklist"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Blacklist
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="container px-4 py-6">{children}</main>
    </div>
  );
}
