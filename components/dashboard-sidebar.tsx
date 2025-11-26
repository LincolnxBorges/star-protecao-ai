"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebarItem } from "@/components/dashboard-sidebar-item";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const NAVIGATION_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/cotacoes", icon: FileText, label: "Cotações" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

interface SidebarContentProps {
  onItemClick?: () => void;
}

function SidebarContent({ onItemClick }: SidebarContentProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <span className="text-xl font-bold text-primary">Star Proteção</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {NAVIGATION_ITEMS.map((item) => (
          <DashboardSidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            onClick={onItemClick}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        data-testid="sidebar-desktop"
        className="hidden w-64 flex-shrink-0 border-r bg-card lg:block"
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-40 lg:hidden"
            data-testid="sidebar-mobile-trigger"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0"
          data-testid="sidebar-mobile"
        >
          <SidebarContent onItemClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
