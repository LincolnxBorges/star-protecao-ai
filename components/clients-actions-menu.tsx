/**
 * Client Quick Actions Menu Component
 * @module components/clients-actions-menu
 *
 * Botoes de acao rapida reutilizaveis: ligar, WhatsApp, email, copiar.
 * T061-T066: User Story 7 - Acoes Rapidas.
 */

"use client";

import { Phone, MessageCircle, Mail, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface ClientsActionsMenuProps {
  phone: string;
  email: string;
  /** Display mode: inline (horizontal buttons) or vertical (stacked) */
  mode?: "inline" | "vertical";
  /** Size of the buttons */
  size?: "sm" | "default";
  /** Show tooltips on hover */
  showTooltips?: boolean;
  /** Show labels next to icons */
  showLabels?: boolean;
}

/**
 * Formats a phone number to digits only for use in tel: and wa.me URLs
 */
function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Initiates a phone call using the tel: protocol
 */
function handleCall(phone: string) {
  const digits = getPhoneDigits(phone);
  window.open(`tel:+55${digits}`, "_self");
}

/**
 * Opens WhatsApp chat using the wa.me URL
 */
function handleWhatsApp(phone: string) {
  const digits = getPhoneDigits(phone);
  window.open(`https://wa.me/55${digits}`, "_blank");
}

/**
 * Opens email client using the mailto: protocol
 */
function handleEmail(email: string) {
  window.open(`mailto:${email}`, "_self");
}

/**
 * Copies text to clipboard and shows feedback toast
 */
async function handleCopy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a area de transferencia`);
  } catch {
    toast.error(`Erro ao copiar ${label.toLowerCase()}`);
  }
}

export function ClientsActionsMenu({
  phone,
  email,
  mode = "inline",
  size = "sm",
  showTooltips = true,
  showLabels = false,
}: ClientsActionsMenuProps) {
  const buttonSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const actions = [
    {
      key: "call",
      label: "Ligar",
      icon: Phone,
      onClick: () => handleCall(phone),
      disabled: !phone,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      onClick: () => handleWhatsApp(phone),
      disabled: !phone,
    },
    {
      key: "email",
      label: "Email",
      icon: Mail,
      onClick: () => handleEmail(email),
      disabled: !email,
    },
    {
      key: "copy-phone",
      label: "Copiar telefone",
      icon: Copy,
      onClick: () => handleCopy(phone, "Telefone"),
      disabled: !phone,
    },
  ];

  const containerClass =
    mode === "inline"
      ? "flex items-center gap-1"
      : "flex flex-col gap-1";

  const ActionButton = ({
    action,
  }: {
    action: (typeof actions)[number];
  }) => {
    const Icon = action.icon;
    const button = (
      <Button
        variant="ghost"
        size="icon"
        className={showLabels ? "w-auto px-2" : buttonSize}
        onClick={action.onClick}
        disabled={action.disabled}
        aria-label={action.label}
      >
        <Icon className={iconSize} />
        {showLabels && <span className="ml-1.5 text-xs">{action.label}</span>}
      </Button>
    );

    if (showTooltips && !showLabels) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{action.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={containerClass}>
        {actions.map((action) => (
          <ActionButton key={action.key} action={action} />
        ))}
      </div>
    </TooltipProvider>
  );
}

// Export individual action handlers for external use
export { handleCall, handleWhatsApp, handleEmail, handleCopy, getPhoneDigits };
